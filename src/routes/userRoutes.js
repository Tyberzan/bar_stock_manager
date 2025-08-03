const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour la gestion des utilisateurs
router.get('/', getAllUsers);                    // GET /api/users
router.post('/', createUser);                    // POST /api/users
router.put('/:id', updateUser);                  // PUT /api/users/:id
router.put('/:id/password', changePassword);     // PUT /api/users/:id/password
router.delete('/:id', deleteUser);               // DELETE /api/users/:id
router.get('/stats', getUserStats);              // GET /api/users/stats

module.exports = router; 