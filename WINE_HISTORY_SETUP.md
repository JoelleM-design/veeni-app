# Configuration de l'historique des vins - Solution pérenne

## Vue d'ensemble

Cette solution implémente un système d'historique complet pour les vins dans l'application Veeni, permettant de tracer toutes les interactions utilisateur avec leurs vins (ajout, dégustation, changement de stock, etc.).

## Structure de la base de données

### Tables créées

1. **`wine_history`** - Table principale pour l'historique
   - `id` (UUID) - Identifiant unique
   - `user_id` (UUID) - Référence vers l'utilisateur
   - `wine_id` (UUID) - Référence vers le vin
   - `event_type` (VARCHAR) - Type d'événement ('added', 'tasted', 'stock_change', 'removed', 'noted', 'favorited')
   - `event_date` (TIMESTAMP) - Date de l'événement
   - `previous_amount` (INTEGER) - Stock précédent
   - `new_amount` (INTEGER) - Nouveau stock
   - `rating` (INTEGER) - Note de dégustation (1-5)
   - `notes` (TEXT) - Notes additionnelles

2. **`user_wine_history`** - Vue pour faciliter les requêtes
   - Jointure automatique avec les tables `wine` et `producer`
   - Données enrichies pour l'affichage

### Fonctions et triggers

1. **`add_wine_history_event()`** - Fonction trigger
   - Automatise l'ajout d'événements d'historique
   - Gère les INSERT, UPDATE et DELETE sur `user_wine`

2. **`get_user_wine_history(user_uuid)`** - Fonction de récupération
   - Retourne l'historique complet d'un utilisateur
   - Données triées par date décroissante

## Installation

### 1. Exécuter le script SQL

1. Ouvrir le dashboard Supabase de votre projet
2. Aller dans l'éditeur SQL
3. Copier et exécuter le contenu du fichier `create_wine_history_tables.sql`

### 2. Vérification

Après l'exécution, vous devriez voir :
- Une nouvelle table `wine_history`
- Une vue `user_wine_history`
- Des index pour optimiser les performances
- Un trigger automatique sur `user_wine`

### 3. Test de la fonctionnalité

```sql
-- Tester la fonction d'historique
SELECT * FROM get_user_wine_history('votre-user-id');

-- Vérifier les événements créés
SELECT * FROM wine_history WHERE user_id = 'votre-user-id';
```

## Utilisation dans l'application

### Hooks disponibles

1. **`useWineHistory()`** - Hook principal pour l'historique
   ```typescript
   const { 
     history, 
     loading, 
     getTastedWines, 
     getRecentTastings, 
     addTastingEvent 
   } = useWineHistory();
   ```

2. **`useWines()`** - Hook mis à jour avec support historique
   ```typescript
   const { 
     wines, 
     updateWine, 
     addWineToCellar, 
     removeWineFromCellar 
   } = useWines();
   ```

### Fonctionnalités automatiques

- **Ajout de vin** : Crée automatiquement un événement 'added'
- **Changement de stock** : Crée un événement 'stock_change'
- **Dégustation** : Crée un événement 'tasted' avec la note
- **Suppression** : Crée un événement 'removed'
- **Favori** : Crée un événement 'favorited'

## Types d'événements

| Type | Description | Déclencheur |
|------|-------------|-------------|
| `added` | Vin ajouté à la cave | INSERT dans user_wine |
| `tasted` | Vin dégusté avec note | UPDATE rating dans user_wine |
| `stock_change` | Changement de quantité | UPDATE amount dans user_wine |
| `removed` | Vin supprimé de la cave | DELETE de user_wine ou amount = 0 |
| `noted` | Ajout de notes | UPDATE notes dans wine_history |
| `favorited` | Changement de statut favori | UPDATE liked dans user_wine |

## Avantages de cette solution

1. **Traçabilité complète** : Tous les événements sont enregistrés
2. **Performance optimisée** : Index sur les colonnes principales
3. **Automatisation** : Triggers pour éviter les oublis
4. **Flexibilité** : Facile d'ajouter de nouveaux types d'événements
5. **Compatibilité** : Fonctionne avec l'architecture existante
6. **Évolutivité** : Structure extensible pour de futures fonctionnalités

## Maintenance

### Ajout de nouveaux types d'événements

1. Modifier la contrainte CHECK dans `wine_history.event_type`
2. Mettre à jour la fonction `add_wine_history_event()`
3. Ajouter la logique dans les hooks TypeScript

### Optimisation des performances

- Les index sont créés automatiquement
- La vue `user_wine_history` optimise les jointures
- Limitation des résultats dans les hooks (ex: 20 dégustations récentes)

### Sauvegarde

L'historique est sauvegardé automatiquement avec Supabase et peut être restauré en cas de problème.

## Dépannage

### Erreurs courantes

1. **Trigger non créé** : Vérifier que la fonction `add_wine_history_event()` existe
2. **Permissions** : S'assurer que l'utilisateur a les droits sur les tables
3. **Contraintes** : Vérifier que les UUIDs sont valides

### Logs et monitoring

- Utiliser les logs Supabase pour tracer les erreurs
- Surveiller la taille de la table `wine_history`
- Vérifier les performances des requêtes

## Évolution future

Cette structure permet d'ajouter facilement :
- Historique des partages entre amis
- Statistiques avancées de dégustation
- Recommandations basées sur l'historique
- Export des données utilisateur
- Analytics et insights 