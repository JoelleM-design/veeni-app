#!/bin/bash

echo "🧹 Nettoyage complet du cache Metro et Expo..."

# Arrêter tous les processus Expo
echo "📱 Arrêt des processus Expo..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Nettoyer les caches Expo
echo "🗂️ Nettoyage des caches Expo..."
rm -rf .expo 2>/dev/null || true
rm -rf .expo-shared 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Nettoyer le cache npm
echo "📦 Nettoyage du cache npm..."
npm cache clean --force

# Nettoyer les caches Metro
echo "🚇 Nettoyage des caches Metro..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true

# Nettoyer les caches Watchman
echo "👀 Nettoyage du cache Watchman..."
watchman watch-del-all 2>/dev/null || true

# Redémarrer Expo avec cache vide
echo "🚀 Redémarrage d'Expo avec cache vide..."
npx expo start --clear 