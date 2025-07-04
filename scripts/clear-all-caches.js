#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage complet des caches...\n');

try {
  // Arrêter le serveur Expo s'il tourne
  console.log('1. Arrêt du serveur Expo...');
  try {
    execSync('pkill -f "expo"', { stdio: 'ignore' });
    console.log('   ✅ Serveur Expo arrêté');
  } catch (e) {
    console.log('   ℹ️  Aucun serveur Expo en cours');
  }

  // Supprimer node_modules
  console.log('\n2. Suppression de node_modules...');
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('   ✅ node_modules supprimé');
  } else {
    console.log('   ℹ️  node_modules n\'existe pas');
  }

  // Supprimer le cache npm
  console.log('\n3. Nettoyage du cache npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('   ✅ Cache npm nettoyé');

  // Supprimer le cache Expo
  console.log('\n4. Nettoyage du cache Expo...');
  execSync('npx expo install --fix', { stdio: 'inherit' });
  console.log('   ✅ Cache Expo nettoyé');

  // Supprimer le cache Watchman
  console.log('\n5. Nettoyage du cache Watchman...');
  try {
    execSync('watchman watch-del-all', { stdio: 'ignore' });
    console.log('   ✅ Cache Watchman nettoyé');
  } catch (e) {
    console.log('   ℹ️  Watchman non installé ou déjà nettoyé');
  }

  // Supprimer les fichiers temporaires
  console.log('\n6. Nettoyage des fichiers temporaires...');
  const tempDirs = [
    '.expo',
    '.expo-shared',
    'dist',
    'build',
    '.next',
    '.cache'
  ];

  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      execSync(`rm -rf ${dir}`, { stdio: 'ignore' });
      console.log(`   ✅ ${dir} supprimé`);
    }
  });

  // Réinstaller les dépendances
  console.log('\n7. Réinstallation des dépendances...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dépendances réinstallées');

  // Vérifier l'installation
  console.log('\n8. Vérification de l\'installation...');
  execSync('npx expo doctor', { stdio: 'inherit' });
  console.log('   ✅ Installation vérifiée');

  console.log('\n🎉 Nettoyage terminé avec succès !');
  console.log('\n📱 Pour redémarrer l\'application :');
  console.log('   npm start');
  console.log('   ou');
  console.log('   npx expo start');

} catch (error) {
  console.error('\n❌ Erreur lors du nettoyage:', error.message);
  process.exit(1);
} 