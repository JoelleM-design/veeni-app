# 🔧 Guide de Migration vers le Modèle Household Correct

## 📋 Vue d'ensemble

Ce guide corrige l'implémentation de la cave partagée pour respecter le modèle strict :
- **Mode individuel** : `user_wine.user_id = user_id` (pas de `household_id`)
- **Mode partagé** : `user_wine.household_id = household_id` (pas de `user_id`)
- **Wishlist** : Toujours personnelle (`user_id` uniquement)

## 🚀 Étapes de Migration

### Étape 1 : Modifier le schéma de base de données

Exécutez le script `fix_user_wine_for_household.sql` dans l'éditeur SQL de Supabase :

```sql
-- Ce script :
-- 1. Ajoute household_id à user_wine et wine_history
-- 2. Ajoute des contraintes pour s'assurer qu'un vin a soit user_id soit household_id
-- 3. Met à jour les politiques RLS
-- 4. Crée les indexes nécessaires
```

### Étape 2 : Migrer les données existantes

Exécutez le script `migrate_to_household_model.sql` dans l'éditeur SQL de Supabase :

```sql
-- Ce script :
-- 1. Crée une household pour chaque utilisateur existant
-- 2. Associe chaque utilisateur à sa household
-- 3. Migre tous les vins vers le modèle household
-- 4. Migre l'historique des vins
-- 5. Vérifie l'intégrité des données
```

### Étape 3 : Mettre à jour le code frontend

1. **Remplacer `useWines` par `useWinesCorrected`** dans tous les composants
2. **Utiliser `useActiveCave`** pour déterminer le mode de cave
3. **Ajouter `CaveModeIndicator`** dans l'interface

## 🔄 Changements dans le code

### Avant (modèle incorrect)
```typescript
// Récupération des vins de tous les utilisateurs d'un household
const { data } = await supabase
  .from('user_wine')
  .select('*')
  .in('user_id', userIds); // ❌ Mauvais : mélange user_id et household_id
```

### Après (modèle correct)
```typescript
// Récupération des vins selon le mode actif
const { data } = await supabase
  .from('user_wine')
  .select('*')
  .eq(caveMode === 'user' ? 'user_id' : 'household_id', caveId)
  .is(caveMode === 'user' ? 'household_id' : 'user_id', null); // ✅ Correct
```

## 📱 Interface utilisateur

### Indicateur de mode de cave
```tsx
import { CaveModeIndicator } from '../components/CaveModeIndicator';

// Dans votre composant
<CaveModeIndicator 
  onPress={() => {/* Gérer le changement de mode */}}
  showIcon={true}
/>
```

### Affichage conditionnel
```tsx
const { caveMode, isShared, householdName } = useActiveCave();

return (
  <View>
    {isShared ? (
      <Text>Cave partagée : {householdName}</Text>
    ) : (
      <Text>Ma cave</Text>
    )}
  </View>
);
```

## 🧪 Tests de validation

### 1. Vérifier la base de données
```sql
-- Vérifier qu'il n'y a pas de vins avec user_id ET household_id
SELECT COUNT(*) FROM user_wine 
WHERE user_id IS NOT NULL AND household_id IS NOT NULL;
-- Résultat attendu : 0

-- Vérifier qu'il n'y a pas de vins sans user_id ET sans household_id
SELECT COUNT(*) FROM user_wine 
WHERE user_id IS NULL AND household_id IS NULL;
-- Résultat attendu : 0
```

### 2. Tester l'application
1. **Mode individuel** : Ajouter un vin → doit être dans `user_wine.user_id`
2. **Mode partagé** : Ajouter un vin → doit être dans `user_wine.household_id`
3. **Wishlist** : Toujours personnelle, même en mode partagé

## ⚠️ Points d'attention

### 1. Sauvegarde obligatoire
```bash
# Créer une sauvegarde complète avant la migration
pg_dump your_database > backup_before_migration.sql
```

### 2. Ordre d'exécution strict
1. ✅ `fix_user_wine_for_household.sql`
2. ✅ `migrate_to_household_model.sql`
3. ✅ Mise à jour du code frontend
4. ✅ Tests de validation

### 3. Gestion des erreurs
- Si une erreur survient, restaurer la sauvegarde
- Vérifier les contraintes de la base de données
- Tester chaque étape individuellement

## 🔧 Scripts de vérification

### Vérifier l'intégrité des données
```sql
-- Vérifier la cohérence des households
SELECT 
  h.name,
  COUNT(uh.user_id) as member_count,
  COUNT(uw.wine_id) as wine_count
FROM households h
LEFT JOIN user_household uh ON h.id = uh.household_id
LEFT JOIN user_wine uw ON h.id = uw.household_id
GROUP BY h.id, h.name
ORDER BY h.created_at;
```

### Vérifier les politiques RLS
```sql
-- Vérifier que les politiques sont correctes
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_wine'
AND schemaname = 'public';
```

## 📞 Support

En cas de problème :
1. Vérifier les logs d'erreur dans Supabase
2. Exécuter les scripts de vérification
3. Restaurer la sauvegarde si nécessaire

---

**🎉 Résultat attendu :** 
- Mode individuel : Vins stockés avec `user_id` uniquement
- Mode partagé : Vins stockés avec `household_id` uniquement  
- Wishlist : Toujours personnelle (`user_id` uniquement)
- Interface : Indicateur clair du mode actif
