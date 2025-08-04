// Charger les variables d'environnement en premier
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const { sequelize, testConnection } = require('./config/database');

// Routes
const authRoutes = require('./routes/authRoutes');
const barRoutes = require('./routes/barRoutes');
const productRoutes = require('./routes/productRoutes');
const formatRoutes = require('./routes/formatRoutes');
const stockRoutes = require('./routes/stockRoutes');
const stockHistoryRoutes = require('./routes/stockHistoryRoutes');
const companyRoutes = require('./routes/companyRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const reserveRoutes = require('./routes/reserveRoutes');
const multiReserveRoutes = require('./routes/multiReserveRoutes');
const reserveStockRoutes = require('./routes/reserveStockRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Initialiser l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Rendre l'instance io disponible globalement
global.io = io;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/bars', barRoutes);
app.use('/api/products', productRoutes);
app.use('/api/formats', formatRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/reserves', reserveRoutes);
app.use('/api/multi-reserves', multiReserveRoutes);
app.use('/api/reserve-stocks', reserveStockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

// Servir les exports
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Route pour la documentation de l'API
app.get('/api', (req, res) => {
  res.json({
    message: 'API de gestion de stock pour bars',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      bars: '/api/bars',
      products: '/api/products',
      formats: '/api/formats',
      stocks: '/api/stocks',
      stockHistory: '/api/stock-history',
      companies: '/api/companies',
      shifts: '/api/shifts'
    }
  });
});

// Route pour l'interface admin
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configuration de Socket.IO
io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO établie:', socket.id);

  // Rejoindre une salle spécifique à un bar
  socket.on('join-bar', (barId) => {
    console.log(`Client ${socket.id} a rejoint la salle du bar ${barId}`);
    socket.join(`bar-${barId}`);
  });

  // Quitter une salle
  socket.on('leave-bar', (barId) => {
    console.log(`Client ${socket.id} a quitté la salle du bar ${barId}`);
    socket.leave(`bar-${barId}`);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Port
const PORT = process.env.PORT || 3000;

// Synchoniser la base de données et démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await testConnection();
    
    // Synchroniser les modèles avec la base de données (sans modifications de structure)
    await sequelize.sync({ force: false, alter: false });
    console.log('Base de données synchronisée avec succès');
    
    // Démarrer le serveur avec http au lieu de app.listen
    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

module.exports = { app, io, server }; 