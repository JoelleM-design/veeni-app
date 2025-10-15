# 📋 PLAN DE DÉVELOPPEMENT SÉCURISÉ - Veeni App

## 🎯 OBJECTIF
Ajouter les fonctionnalités **Notifications** et **Partage** sans casser le code stable existant.

## 🔒 PRINCIPE FONDAMENTAL
**AUCUNE modification** des fichiers critiques listés dans `STABLE_STATE_GUIDE.md`

## 📅 PHASES DE DÉVELOPPEMENT

### PHASE 1 : PRÉPARATION (1-2 jours)
- [x] Créer branche `feature/notifications-sharing`
- [x] Tagger version stable `v1.0.4-stable`
- [x] Créer scripts de test de régression
- [x] Documenter l'état stable
- [ ] Tests de régression complets
- [ ] Validation que tout fonctionne parfaitement

### PHASE 2 : NOTIFICATIONS (3-5 jours)
- [ ] **Nouveau dossier :** `features/notifications/`
- [ ] Configuration des préférences utilisateur
- [ ] Service de notifications push
- [ ] Rappels de dégustation
- [ ] Intégration avec les vins existants
- [ ] Tests unitaires et d'intégration

### PHASE 3 : PARTAGE (3-5 jours)
- [ ] **Nouveau dossier :** `features/sharing/`
- [ ] Composants de partage de vins
- [ ] Génération de liens de partage
- [ ] Intégration réseaux sociaux
- [ ] Export PDF des listes
- [ ] Tests unitaires et d'intégration

### PHASE 4 : INTÉGRATION (2-3 jours)
- [ ] Intégration des nouvelles fonctionnalités
- [ ] Tests de régression complets
- [ ] Optimisation des performances
- [ ] Documentation des nouvelles fonctionnalités

### PHASE 5 : VALIDATION (1-2 jours)
- [ ] Tests utilisateur
- [ ] Validation finale
- [ ] Préparation de la release
- [ ] Build et déploiement

## 🏗️ ARCHITECTURE PROPOSÉE

### Structure des dossiers
```
features/
├── notifications/
│   ├── components/
│   │   ├── NotificationSettings.tsx
│   │   ├── NotificationCard.tsx
│   │   └── ReminderModal.tsx
│   ├── hooks/
│   │   ├── useNotifications.ts
│   │   ├── useNotificationSettings.ts
│   │   └── useReminders.ts
│   ├── services/
│   │   ├── notificationService.ts
│   │   └── pushNotificationService.ts
│   └── types/
│       └── notification.types.ts
├── sharing/
│   ├── components/
│   │   ├── ShareButton.tsx
│   │   ├── ShareModal.tsx
│   │   └── ExportModal.tsx
│   ├── hooks/
│   │   ├── useSharing.ts
│   │   └── useExport.ts
│   ├── services/
│   │   ├── shareService.ts
│   │   └── exportService.ts
│   └── types/
│       └── sharing.types.ts
└── common/
    ├── components/
    ├── hooks/
    └── utils/
```

## 🧪 STRATÉGIE DE TEST

### Tests obligatoires avant chaque commit
1. **Test de régression** : `node test-regression-complete.js`
2. **Test manuel des vins** : Modification + persistance
3. **Test des stats** : Vérification des compteurs
4. **Test de navigation** : Tous les écrans

### Tests spécifiques aux nouvelles fonctionnalités
1. **Notifications** : Envoi, réception, configuration
2. **Partage** : Génération de liens, export, intégration

## ⚠️ RÈGLES STRICTES

### ✅ AUTORISÉ
- Créer de nouveaux fichiers dans `features/`
- Modifier `app.json` pour les permissions
- Ajouter des dépendances dans `package.json`
- Créer de nouveaux hooks dans `features/`
- Modifier les écrans existants POUR AJOUTER les nouvelles fonctionnalités

### ❌ INTERDIT
- Modifier `hooks/useWines.ts`
- Modifier `screens/WineDetailsScreenV2.tsx`
- Modifier `components/WineCard.tsx`
- Modifier `lib/cleanWine.ts`
- Modifier les policies RLS
- Modifier les hooks de stats existants

## 🚨 EN CAS DE PROBLÈME

1. **STOP** immédiat
2. **Revenir** à `v1.0.4-stable`
3. **Analyser** sans toucher au code stable
4. **Créer** une branche de correction
5. **Tester** exhaustivement

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] 100% des tests de régression passent
- [ ] Aucune régression des fonctionnalités existantes
- [ ] Nouvelles fonctionnalités fonctionnelles
- [ ] Performance maintenue
- [ ] Code propre et documenté

---
**🎯 Objectif : Livrer des fonctionnalités robustes sans casser l'existant**
