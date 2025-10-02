#!/bin/bash

echo "🧹 Nettoyage de l'historique Git - Suppression des clés secrètes"
echo "=============================================================="

# Vérifier que nous sommes dans un repo Git
if [ ! -d ".git" ]; then
    echo "❌ Ce n'est pas un répertoire Git"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va réécrire l'historique Git"
echo "⚠️  Assurez-vous d'avoir une sauvegarde avant de continuer"
echo ""
read -p "Voulez-vous continuer ? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Opération annulée"
    exit 1
fi

# Clés à supprimer de l'historique
KEYS_TO_REMOVE=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImiaWF0IjoxNzAwMDgwMDk5LCJleHAiOjIwNjU2NTYwOTl9.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0"
)

echo "🔍 Recherche des clés dans l'historique..."

for key in "${KEYS_TO_REMOVE[@]}"; do
    echo "Suppression de la clé: ${key:0:20}..."
    
    # Utiliser git filter-branch pour supprimer la clé de l'historique
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch -r . && git reset --hard" \
        --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
    
    # Alternative avec BFG Repo-Cleaner (plus efficace mais nécessite l'installation)
    # bfg --replace-text <(echo "$key==>***REMOVED***") --no-blob-protection .
done

echo "🧹 Nettoyage des références..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Nettoyage terminé !"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifiez l'historique avec: git log --oneline"
echo "2. Si tout est correct, forcez le push: git push --force-with-lease"
echo "3. Informez votre équipe du changement d'historique"
echo ""
echo "⚠️  IMPORTANT: Tous les développeurs devront refaire un clone du repo"





