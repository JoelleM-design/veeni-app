# 🔍 Script de Debug Supabase

## 📋 Description

Script de debug pour analyser les données stockées dans Supabase pour un utilisateur spécifique. Le script récupère et affiche les données des tables `user_wine`, `wine_history`, et `friend`.

## 🚨 **IMPORTANT - SÉCURITÉ**

⚠️ **Ce script utilise la clé SERVICE ROLE qui bypass RLS**
- ✅ **Utilisez-le UNIQUEMENT pour le debug**
- ❌ **JAMAIS dans le code de production**
- ❌ **JAMAIS dans le frontend**
- ❌ **JAMAIS commitée dans Git**

## 📦 Installation

### 1. Installer la dépendance

```bash
npm install @supabase/supabase-js
```

### 2. Configuration des variables d'environnement

Définissez les variables d'environnement dans votre terminal :

```bash
# URL de votre projet Supabase
export SUPABASE_URL="https://votre-projet.supabase.co"

# Clé service role (récupérez-la dans Supabase Dashboard > Settings > API)
export SUPABASE_SERVICE_ROLE_KEY="votre_clé_service_role_ici"
```

### 3. Configuration Windows (PowerShell)

```powershell
$env:SUPABASE_URL="https://votre-projet.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="votre_clé_service_role_ici"
```

### 4. Configuration Windows (CMD)

```cmd
set SUPABASE_URL=https://votre-projet.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_ici
```

## 🚀 Exécution

### Méthode 1 : Avec les variables d'environnement

```bash
node debugStats.js
```

### Méthode 2 : Exécution directe avec les clés

```bash
SUPABASE_URL="https://votre-projet.supabase.co" SUPABASE_SERVICE_ROLE_KEY="votre_clé" node debugStats.js
```

## ⚙️ Configuration

### Modifier l'utilisateur à analyser

Ouvrez `debugStats.js` et modifiez la variable `USER_ID` :

```javascript
// UUID de l'utilisateur à analyser (modifiez selon vos besoins)
const USER_ID = "27fd73b1-7088-4211-af88-3d075851f0db";
```

## 📊 Données récupérées

### 1. Table `user_wine`
- Tous les vins de l'utilisateur (cave + wishlist)
- Détails de chaque vin (nom, année, type, région)
- Statistiques calculées (favoris, inspirés, etc.)

### 2. Table `wine_history`
- Tous les événements liés aux vins
- Types d'événements (tasted, added, etc.)
- Dates et détails des événements

### 3. Table `friend`
- Relations d'amitié de l'utilisateur
- Statuts des relations (accepted, pending, etc.)
- Informations des amis

## 🔍 Exemple de sortie

```
🔍 Debug des données Supabase
=============================
User ID: 27fd73b1-7088-4211-af88-3d075851f0db
URL: https://votre-projet.supabase.co

1️⃣ Récupération des données user_wine...
✅ user_wine: 5 enregistrements trouvés

📊 Détail des user_wine:

  1. ID: 123e4567-e89b-12d3-a456-426614174000
     Wine ID: 456e7890-e89b-12d3-a456-426614174001
     Amount: 2 bouteilles
     Rating: 4.5
     Origin: cellar
     Favorite: Oui
     Source User ID: Aucun
     Created: 2024-01-15T10:30:00Z
     🍷 Vin: Château Margaux 2015 - red
     📍 Région: Bordeaux

📈 Statistiques user_wine:
   🍷 Cave: 3 vins
   📝 Wishlist: 2 vins
   ❤️ Favoris: 2 vins
   ✨ Inspirés: 1 vins
   📦 Total bouteilles: 8

2️⃣ Récupération des événements wine_history...
✅ wine_history: 12 événements trouvés

📅 Détail des événements wine_history:

  1. ID: 789e0123-e89b-12d3-a456-426614174002
     Wine ID: 456e7890-e89b-12d3-a456-426614174001
     Type: tasted
     Date: 2024-01-20T15:45:00Z
     🍷 Vin: Château Margaux 2015 - red

📊 Statistiques wine_history:
   tasted: 8 événements
   added: 4 événements

3️⃣ Récupération des relations friend...
✅ friend: 3 relations trouvées

👥 Détail des relations friend:

  1. ID: 321e6543-e89b-12d3-a456-426614174003
     User ID: 27fd73b1-7088-4211-af88-3d075851f0db
     Friend ID: a35e2da9-e9df-49d0-b1bc-ba1233d5129c
     Status: accepted
     Created: 2024-01-10T09:15:00Z
     👤 User: wspt.joelle@gmail.com
     👤 Friend: thea@example.com

📊 Statistiques friend:
   accepted: 2 relations
   pending: 1 relations

✅ Debug terminé !
==================
```

## 🔧 Dépannage

### Erreur "Variables d'environnement manquantes"
```bash
❌ Variables d'environnement manquantes !
💡 Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
```

**Solution :** Vérifiez que les variables d'environnement sont bien définies.

### Erreur "Invalid API key"
```bash
❌ Erreur Supabase: Invalid API key
```

**Solution :** Vérifiez que la clé service role est correcte et complète.

### Erreur "Module not found"
```bash
Error: Cannot find module '@supabase/supabase-js'
```

**Solution :** Installez la dépendance :
```bash
npm install @supabase/supabase-js
```

## 🎯 Objectif

Ce script permet de :
1. **Vérifier** que les données existent dans Supabase
2. **Comprendre** la structure des données
3. **Déboguer** les problèmes de calcul de statistiques
4. **Valider** les relations entre les tables

## 🔒 Sécurité

- La clé service role est **POWERFUL** - elle peut tout faire
- Utilisez-la **UNIQUEMENT** pour le debug
- **JAMAIS** dans le code de production
- **JAMAIS** dans le frontend
- **JAMAIS** commitée dans Git




