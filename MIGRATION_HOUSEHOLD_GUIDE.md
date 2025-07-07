# 🏠 Guide de Migration Household

## 📋 Vue d'ensemble

Ce guide vous permet d'exécuter manuellement la migration vers le système de cave partagée (households) via l'interface web de Supabase.

## 🔗 Accès à Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez le projet **veeni**
4. Allez dans **SQL Editor** (éditeur SQL)

## 🚀 Étapes de Migration

### Étape 1 : Créer les Tables

Copiez et exécutez le contenu du fichier `create_household_tables.sql` dans l'éditeur SQL de Supabase.

**Vérification :** Après exécution, vous devriez voir :
- ✅ Tables `households` et `user_household` créées
- ✅ Indexes créés
- ✅ RLS activé
- ✅ Policies créées
- ✅ Fonction `generate_join_code()` créée

### Étape 2 : Migrer les Utilisateurs

Copiez et exécutez le contenu du fichier `migrate_users_to_households.sql` dans l'éditeur SQL.

**Vérification :** Après exécution, vous devriez voir :
- ✅ Une household créée pour chaque utilisateur existant
- ✅ Chaque utilisateur associé à sa household
- ✅ Aucun utilisateur orphelin

### Étape 3 : Tester la Fonctionnalité

Copiez et exécutez le contenu du fichier `test_household_functionality.sql` dans l'éditeur SQL.

**Vérification :** Tous les tests doivent passer avec ✅

## 📊 Vérifications Post-Migration

### 1. Vérifier les Tables

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('households', 'user_household');
```

### 2. Vérifier les Données

```sql
-- Compter les households créées
SELECT COUNT(*) as total_households FROM public.households;

-- Compter les associations utilisateur-household
SELECT COUNT(*) as total_memberships FROM public.user_household;

-- Vérifier qu'il n'y a pas d'utilisateurs orphelins
SELECT COUNT(*) as users_without_household
FROM public."User" u
LEFT JOIN public.user_household uh ON u.id = uh.user_id
WHERE uh.user_id IS NULL;
```

### 3. Aperçu des Households Créées

```sql
-- Voir les households créées
SELECT 
  h.id,
  h.name,
  h.join_code,
  u.first_name,
  u.email
FROM public.households h
JOIN public.user_household uh ON h.id = uh.household_id
JOIN public."User" u ON uh.user_id = u.id
ORDER BY h.created_at;
```

## ⚠️ Points d'Attention

1. **Sauvegarde :** Assurez-vous d'avoir une sauvegarde complète avant de commencer
2. **Ordre d'exécution :** Respectez l'ordre des étapes
3. **Vérifications :** Exécutez les vérifications après chaque étape
4. **Erreurs :** Si une erreur survient, arrêtez et contactez le support

## 🔧 En Cas de Problème

### Erreur "Table already exists"
- Les tables existent déjà, passez à l'étape 2

### Erreur "Function already exists"
- La fonction existe déjà, c'est normal

### Erreur "Policy already exists"
- Les policies existent déjà, c'est normal

### Erreur de clé étrangère
- Vérifiez que tous les utilisateurs existent dans la table `User`

## 📱 Prochaines Étapes

Une fois la migration terminée avec succès :

1. ✅ **Backend :** Les tables sont créées et les utilisateurs migrés
2. 🔄 **Frontend :** Adapter les hooks pour utiliser `household_id`
3. 🔄 **Interface :** Ajouter les écrans de gestion des households
4. 🔄 **Tests :** Tester la fonctionnalité complète

## 📞 Support

En cas de problème, consultez :
- Les logs d'erreur dans l'éditeur SQL
- Les vérifications post-migration
- La documentation Supabase

---

**🎉 Félicitations !** Votre base de données est maintenant prête pour la fonctionnalité de cave partagée. 