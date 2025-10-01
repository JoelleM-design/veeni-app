# 🔐 Guide de Sécurité - Veeni App

## ⚠️ Problème Résolu : Clés Secrètes Exposées

**Date de correction :** $(date)

### 🚨 Problèmes Identifiés et Corrigés

1. **Clés Supabase exposées** dans :
   - `scripts/clear_memories_simple.js`
   - `scripts/clear_all_memories.js`
   - `test-wine-memories.js`
   - `test-profile-stats.js`
   - `lib/supabase.ts`

2. **Clé Google Vision API** exposée dans :
   - `constants/Config.ts`

### ✅ Solutions Appliquées

#### 1. Variables d'Environnement
- Remplacement de toutes les clés hardcodées par des variables d'environnement
- Utilisation de `process.env` pour les scripts Node.js
- Utilisation de `process.env.EXPO_PUBLIC_*` pour l'application React Native

#### 2. Fichiers de Configuration
- **Créé :** `.env.example` - Template pour les variables d'environnement
- **Modifié :** `.gitignore` - Ajout des fichiers sensibles à ignorer
- **Modifié :** `constants/Config.ts` - Utilisation des variables d'environnement

#### 3. Validation des Clés
- Ajout de vérifications pour s'assurer que les clés requises sont présentes
- Messages d'erreur explicites si les clés manquent

### 🛡️ Bonnes Pratiques de Sécurité

#### Variables d'Environnement
```bash
# Pour l'application React Native (préfixe EXPO_PUBLIC_)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# Pour les scripts Node.js (développement uniquement)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

#### Fichiers à Ignorer
- `.env` et toutes ses variantes
- `*.p8`, `*.p12`, `*.key` (clés de certificats)
- `ASC_KEY.p8` (clé Apple Store Connect)
- Fichiers de test avec clés exposées

### 🔍 Vérifications Régulières

#### Commandes de Vérification
```bash
# Rechercher des clés potentiellement exposées
grep -r "eyJ\|sk-\|pk_\|AIza\|ya29\|1//" --include="*.js" --include="*.ts" --include="*.tsx" .

# Vérifier les fichiers non ignorés par git
git status --ignored

# Vérifier les fichiers sensibles dans l'historique
git log --all --full-history -- "*.env" "*.key" "*.p8"
```

#### Checklist de Sécurité
- [ ] Aucune clé API hardcodée dans le code
- [ ] Toutes les clés utilisent des variables d'environnement
- [ ] Le fichier `.env` est dans `.gitignore`
- [ ] Le fichier `.env.example` documente les variables nécessaires
- [ ] Les clés de service ne sont utilisées que côté serveur
- [ ] Les clés publiques sont marquées comme telles

### 🚨 Actions Immédiates Requises

1. **Créer le fichier `.env`** à partir de `.env.example`
2. **Remplir les vraies valeurs** des clés API
3. **Régénérer les clés exposées** dans Supabase/Google Cloud
4. **Vérifier l'historique Git** pour s'assurer qu'aucune clé n'est commitée
5. **Tester l'application** avec les nouvelles variables d'environnement

### 📚 Ressources

- [Documentation Expo - Variables d'environnement](https://docs.expo.dev/guides/environment-variables/)
- [Guide Supabase - Sécurité](https://supabase.com/docs/guides/platform/security)
- [Google Cloud - Gestion des clés API](https://cloud.google.com/docs/authentication/api-keys)

---

**⚠️ IMPORTANT :** Ce guide doit être suivi pour tous les futurs développements. Les clés secrètes ne doivent JAMAIS être commitées dans le code source.



