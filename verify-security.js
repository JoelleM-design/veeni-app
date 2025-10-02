#!/usr/bin/env node

/**
 * Script de vérification de sécurité
 * Vérifie que les clés secrètes ne sont plus exposées dans le code
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de sécurité - Veeni App');
console.log('=====================================');

// Patterns de clés secrètes à rechercher
const secretPatterns = [
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT tokens
  /sk-[A-Za-z0-9]{48}/, // OpenAI API keys
  /pk_[A-Za-z0-9]{24}/, // Stripe public keys
  /AIza[0-9A-Za-z_-]{35}/, // Google API keys
  /ya29\.[0-9A-Za-z_-]+/, // Google OAuth tokens
  /1\/\/[0-9A-Za-z_-]+/, // Google OAuth refresh tokens
];

// Extensions de fichiers à vérifier
const fileExtensions = ['.js', '.ts', '.tsx', '.json'];
const excludeDirs = ['node_modules', '.git', '.expo', 'dist', 'web-build'];

let issuesFound = 0;

function shouldCheckFile(filePath) {
  const ext = path.extname(filePath);
  return fileExtensions.includes(ext);
}

function shouldExcludeDir(dirName) {
  return excludeDirs.includes(dirName);
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      secretPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          // Vérifier si c'est dans un commentaire ou une variable d'environnement
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('//') && 
              !trimmedLine.startsWith('*') && 
              !trimmedLine.startsWith('#') &&
              !trimmedLine.includes('process.env') &&
              !trimmedLine.includes('your_') &&
              !trimmedLine.includes('example')) {
            
            console.log(`❌ Clé potentiellement exposée trouvée:`);
            console.log(`   Fichier: ${filePath}`);
            console.log(`   Ligne ${index + 1}: ${line.trim()}`);
            console.log('');
            issuesFound++;
          }
        }
      });
    });
  } catch (error) {
    // Ignorer les erreurs de lecture de fichier
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeDir(item)) {
          scanDirectory(fullPath);
        }
      } else if (shouldCheckFile(fullPath)) {
        checkFile(fullPath);
      }
    });
  } catch (error) {
    // Ignorer les erreurs d'accès au répertoire
  }
}

// Vérifier que le fichier .env existe
if (fs.existsSync('.env')) {
  console.log('✅ Fichier .env trouvé');
} else {
  console.log('❌ Fichier .env manquant');
  issuesFound++;
}

// Vérifier que .env est dans .gitignore
const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
if (gitignoreContent.includes('.env')) {
  console.log('✅ .env est dans .gitignore');
} else {
  console.log('❌ .env n\'est pas dans .gitignore');
  issuesFound++;
}

console.log('\n🔍 Recherche de clés secrètes dans le code...');
scanDirectory('.');

console.log('\n📊 Résultats:');
console.log('=============');

if (issuesFound === 0) {
  console.log('🎉 Aucun problème de sécurité détecté !');
  console.log('✅ Votre code est sécurisé.');
} else {
  console.log(`⚠️  ${issuesFound} problème(s) de sécurité détecté(s).`);
  console.log('🔧 Veuillez corriger ces problèmes avant de continuer.');
}

process.exit(issuesFound);





