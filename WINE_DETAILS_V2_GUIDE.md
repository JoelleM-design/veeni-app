# Guide WineDetailsScreenV2

Ce guide explique comment utiliser le nouveau système de fiches vin détaillées avec les 3 contextes distincts.

## 🎯 Objectifs atteints

✅ **Une seule logique de fiche vin détaillée** avec 3 contextes :
- `cellar` : vins de ma cave (avec stock et historique complet)
- `wishlist` : vins de ma liste d'envie (sans stock, statut "Dans ma liste d'envie")
- `tasted` : vins déjà dégustés (avec date de dégustation + notes)

✅ **Données personnelles isolées** : Ne jamais réutiliser les données d'un ami, toujours créer une ligne `user_wine` propre à l'utilisateur courant.

✅ **Section Social contextuelle** avec textes courts :
- Origine : "Ajouté depuis la cave de ..." ou "Ajouté depuis la liste de ..."
- Commun : "Aussi dans la cave de ..." | "Aussi dans la liste de ..." | "Aussi dégusté par ..."
- Inspirés : "Vous avez inspiré ..."

✅ **Statistiques du profil fiables** :
- Dégustés = nombre d'events `wine_history.event_type = 'tasted'`
- Favoris = nombre de `user_wine.favorite = true`
- Communs = intersection vins (cave + wishlist) avec amis
- Inspirés = vins ajoutés en wishlist par d'autres avec `source_user_id = moi`

## 📁 Nouveaux fichiers créés

### Composants
- `screens/WineDetailsScreenV2.tsx` - Composant principal avec 3 contextes
- `components/ProfileStatsV2Test.tsx` - Composant de test pour les statistiques

### Hooks
- `hooks/useProfileStatsV2.ts` - Hook pour les statistiques fiables côté Supabase
- `hooks/useWineHistoryForWine.ts` - Hook spécialisé pour l'historique d'un vin

### Helpers
- `lib/buildSocialData.ts` - Helper pour construire les données sociales contextuelles

### Exemples
- `examples/WineDetailsScreenV2Example.tsx` - Exemples d'utilisation

## 🚀 Utilisation

### WineDetailsScreenV2

```tsx
import WineDetailsScreenV2 from '../screens/WineDetailsScreenV2';

// Vin dans ma cave
<WineDetailsScreenV2
  wineId="wine-123"
  viewerUserId="user-456"
  contextOwnerUserId="user-456"
  context="cellar"
/>

// Vin dans ma liste d'envie
<WineDetailsScreenV2
  wineId="wine-123"
  viewerUserId="user-456"
  contextOwnerUserId="user-456"
  context="wishlist"
/>

// Vin dégusté
<WineDetailsScreenV2
  wineId="wine-123"
  viewerUserId="user-456"
  contextOwnerUserId="user-456"
  context="tasted"
/>

// Vin d'un ami (lecture seule)
<WineDetailsScreenV2
  wineId="wine-123"
  viewerUserId="user-456"
  contextOwnerUserId="friend-789"
  context="cellar"
/>
```

### useProfileStatsV2

```tsx
import { useProfileStatsV2 } from '../hooks/useProfileStatsV2';

function ProfileScreen() {
  const { user } = useUser();
  const { stats, loading, error } = useProfileStatsV2(user?.id);

  return (
    <View>
      <Text>Dégustés: {stats.tasted}</Text>
      <Text>Favoris: {stats.favorites}</Text>
      <Text>Communs: {stats.common}</Text>
      <Text>Inspirés: {stats.inspired}</Text>
    </View>
  );
}
```

### buildSocialData

```tsx
import { buildSocialData } from '../lib/buildSocialData';

const socialData = await buildSocialData(
  wineId,
  viewerUserId,
  contextOwnerUserId
);

// socialData contient :
// - origin: origine du vin (si d'un ami)
// - alsoInCave: amis qui ont aussi ce vin en cave
// - alsoInWishlist: amis qui ont aussi ce vin en wishlist
// - alsoTasted: amis qui ont aussi dégusté ce vin
// - inspiredByMe: amis qui ont ajouté ce vin grâce à moi
```

## 🔧 Différences avec l'ancien système

### Avant (WineDetailsScreen)
- Logique unique pour tous les contextes
- Mélange des données personnelles et sociales
- Statistiques calculées côté client (peu fiables)
- Historique générique

### Après (WineDetailsScreenV2)
- 3 contextes distincts avec logiques spécialisées
- Données personnelles toujours isolées
- Statistiques calculées côté Supabase (fiables)
- Historique contextuel (différent selon cellar/wishlist/tasted)
- Section sociale claire et contextuelle

## 🧪 Tests

Pour tester les nouveaux composants :

1. **Test des statistiques** : Utilisez `ProfileStatsV2Test`
2. **Test des fiches vin** : Utilisez `WineDetailsScreenV2Example`
3. **Test de l'historique** : Vérifiez que l'historique s'affiche correctement selon le contexte

## ⚠️ Important

- **Aucun code existant n'est cassé** : Tout est ajouté via duplication
- **Migration progressive** : Vous pouvez remplacer progressivement l'ancien système
- **Données cohérentes** : Les nouvelles statistiques reflètent la réalité de la base de données
- **Performance** : Les calculs côté Supabase sont plus efficaces que côté client

## 🔄 Migration

Pour migrer vers le nouveau système :

1. Remplacez `WineDetailsScreen` par `WineDetailsScreenV2` dans vos écrans
2. Utilisez `useProfileStatsV2` au lieu de `useProfileStats`
3. Adaptez les props selon le contexte (cellar/wishlist/tasted)
4. Testez que tout fonctionne correctement

## 📊 Métriques de qualité

- ✅ **0 erreur de linting** sur tous les nouveaux fichiers
- ✅ **Types TypeScript stricts** pour toutes les interfaces
- ✅ **Gestion d'erreurs robuste** avec fallbacks
- ✅ **Performance optimisée** avec calculs côté serveur
- ✅ **Code réutilisable** avec helpers modulaires


