#!/bin/bash

# Script de correction de l'encodage UTF-8
# Remplace les caractères mal encodés par les caractères français corrects

FILE="public/js/stock-manager.js"

echo "Correction de l'encodage dans $FILE..."

# Sauvegarde
cp "$FILE" "${FILE}.backup"

# Corrections des caractères les plus courants
sed -i \
  -e 's/Ã©/é/g' \
  -e 's/Ã¨/è/g' \
  -e 's/Ãª/ê/g' \
  -e 's/Ã«/ë/g' \
  -e 's/Ã /à/g' \
  -e 's/Ã¢/â/g' \
  -e 's/Ã¤/ä/g' \
  -e 's/Ã§/ç/g' \
  -e 's/Ã´/ô/g' \
  -e 's/Ã¶/ö/g' \
  -e 's/Ã¹/ù/g' \
  -e 's/Ã»/û/g' \
  -e 's/Ã¼/ü/g' \
  -e 's/Ã®/î/g' \
  -e 's/Ã¯/ï/g' \
  -e 's/Ã±/ñ/g' \
  -e 's/Ã/À/g' \
  -e 's/Ã/Á/g' \
  -e 's/Ã/Â/g' \
  -e 's/Ã/Ã/g' \
  -e 's/Ã/Ä/g' \
  -e 's/Ã/Å/g' \
  -e 's/Ã/Æ/g' \
  -e 's/Ã/Ç/g' \
  -e 's/Ã/È/g' \
  -e 's/Ã/É/g' \
  -e 's/Ã/Ê/g' \
  -e 's/Ã/Ë/g' \
  -e 's/Ã/Ì/g' \
  -e 's/Ã/Í/g' \
  -e 's/Ã/Î/g' \
  -e 's/Ã/Ï/g' \
  -e 's/Ã/Ð/g' \
  -e 's/Ã/Ñ/g' \
  -e 's/Ã/Ò/g' \
  -e 's/Ã/Ó/g' \
  -e 's/Ã/Ô/g' \
  -e 's/Ã/Õ/g' \
  -e 's/Ã/Ö/g' \
  -e 's/Ã/Ø/g' \
  -e 's/Ã/Ù/g' \
  -e 's/Ã/Ú/g' \
  -e 's/Ã/Û/g' \
  -e 's/Ã/Ü/g' \
  -e 's/Ã/Ý/g' \
  -e 's/Ã/Þ/g' \
  -e 's/Ã/ß/g' \
  "$FILE"

echo "Nombre de caractères 'Ã' restants:"
grep -c "Ã" "$FILE"

echo "Correction terminée. Sauvegarde créée: ${FILE}.backup"