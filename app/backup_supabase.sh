#!/bin/bash

# Dossier de sortie
OUTPUT_DIR="./supabase_backups"
mkdir -p "$OUTPUT_DIR"

# Nom du fichier de sortie avec date
DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="$OUTPUT_DIR/veeni_supabase_backup_$DATE.tar.gz"

# Dump de la base (structure + données)
supabase db dump --project-ref veeni-app --file "$OUTPUT_DIR/schema.sql"

# Sauvegarde des fonctions Edge (si tu veux aussi les garder)
cp -R supabase/functions "$OUTPUT_DIR/functions"

# Création de l'archive
tar -czf "$OUTPUT_FILE" -C "$OUTPUT_DIR" .

# Nettoyage intermédiaire
rm "$OUTPUT_DIR/schema.sql"
rm -rf "$OUTPUT_DIR/functions"

echo "✅ Sauvegarde terminée : $OUTPUT_FILE"
