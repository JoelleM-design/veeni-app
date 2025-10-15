# 🔒 GUIDE DE L'ÉTAT STABLE - Veeni App

## 📅 Version stable : v1.0.4-stable
**Date de gel :** $(date)

## ✅ FONCTIONNALITÉS VALIDÉES ET STABLES

### 🍷 Gestion des vins
- ✅ Ajout de vins (OCR + manuel)
- ✅ Modification des détails (titre, type, description, etc.)
- ✅ Persistance des modifications
- ✅ Synchronisation locale/DB
- ✅ Protection contre l'écrasement des données

### 📊 Statistiques
- ✅ Comptage correct des bouteilles
- ✅ Stats par couleur (rouge, blanc, rosé, pétillant)
- ✅ Stats par statut (cave, wishlist, favoris)
- ✅ Mise à jour en temps réel

### 🔐 Sécurité (RLS)
- ✅ Policies SELECT sur toutes les tables
- ✅ Policies INSERT/UPDATE/DELETE appropriées
- ✅ Protection des données utilisateur
- ✅ Gestion des ménages (households)

### 🎯 Navigation et UX
- ✅ Écrans de détail des vins
- ✅ Modification en temps réel
- ✅ Pas de "flash" des anciennes valeurs
- ✅ Gestion des états de chargement

## 🚫 ZONES INTERDITES (NE PAS MODIFIER)

### Fichiers critiques - INTERDICTION TOTALE
```
hooks/useWines.ts                    # Logique centrale des vins
screens/WineDetailsScreenV2.tsx     # Écran de modification
components/WineCard.tsx             # Affichage des vins
lib/cleanWine.ts                    # Nettoyage des données
```

### Fichiers de sécurité - INTERDICTION TOTALE
```
supabase/                           # Toutes les policies RLS
analyze-all-rls-policies.sql        # Scripts de sécurité
fix-wine-update-policy.sql          # Policies critiques
```

### Fichiers de stats - INTERDICTION TOTALE
```
hooks/useStats.ts                   # Calcul des stats
hooks/useProfileStats.ts           # Stats de profil
fix-server-stats-final.sql         # RPC de stats
```

## 🆕 NOUVELLES FONCTIONNALITÉS À AJOUTER

### 📱 Notifications
- [ ] Configuration des préférences
- [ ] Notifications push
- [ ] Rappels de dégustation
- [ ] Notifications de partage

### 🔗 Partage
- [ ] Partage de vins individuels
- [ ] Partage de listes
- [ ] Intégration réseaux sociaux
- [ ] Export PDF

## ⚠️ RÈGLES STRICTES POUR LE DÉVELOPPEMENT

1. **AUCUNE modification** des fichiers listés en "INTERDICTION TOTALE"
2. **Toujours tester** les modifications de vins après chaque changement
3. **Créer des branches** pour chaque nouvelle fonctionnalité
4. **Tests de régression** avant chaque merge
5. **Documentation** de chaque modification

## 🧪 TESTS OBLIGATOIRES AVANT CHAQUE COMMIT

```bash
# 1. Test de régression
node test-regression-complete.js

# 2. Test manuel des modifications de vins
# - Modifier un titre
# - Changer le type
# - Vérifier la persistance
# - Recharger l'app
# - Vérifier que les modifications sont conservées

# 3. Test des stats
# - Vérifier que les compteurs sont corrects
# - Ajouter/supprimer un vin
# - Vérifier la mise à jour des stats
```

## 📞 EN CAS DE PROBLÈME

1. **STOP** immédiatement le développement
2. **Revenir** à la version stable : `git checkout v1.0.4-stable`
3. **Analyser** le problème sans toucher au code stable
4. **Créer** une branche de correction si nécessaire
5. **Tester** exhaustivement avant de continuer

---
**⚠️ ATTENTION : Ce guide est sacré. Toute violation peut casser l'app.**
