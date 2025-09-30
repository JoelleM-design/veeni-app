# 🍷 Guide d'implémentation des Souvenirs de Vin

## 📋 Vue d'ensemble

Ce guide explique comment intégrer la fonctionnalité "Souvenirs" dans votre application Veeni. Les souvenirs permettent aux utilisateurs de partager des moments autour d'un vin avec leurs amis.

## 🚀 Étapes d'implémentation

### 1. Configuration de la base de données

Exécutez le script SQL dans l'éditeur SQL de Supabase :

```bash
# Copiez le contenu du fichier scripts/setup_wine_memories.sql
# et exécutez-le dans l'éditeur SQL de Supabase
```

Ce script crée :
- Table `wine_memories` pour stocker les souvenirs
- Table `wine_memory_likes` pour les likes
- Bucket `wine_memories_images` pour les photos
- Politiques RLS pour la sécurité

### 2. Installation des dépendances

```bash
npm install expo-image-picker
```

### 3. Intégration dans la fiche vin détaillée

#### Option A : Remplacer complètement WineDetailsScreenV2

1. **Sauvegardez** votre fichier actuel :
```bash
cp screens/WineDetailsScreenV2.tsx screens/WineDetailsScreenV2.backup.tsx
```

2. **Intégrez** le système de tabs dans votre fiche existante :

```typescript
// Dans WineDetailsScreenV2.tsx
import WineDetailsTabs from '../components/WineDetailsTabs';
import WineMemoriesScreen from './WineMemoriesScreen';
import { useWineHasMemories } from '../hooks/useWineHasMemories';

// Ajoutez l'état pour les onglets
const [activeTab, setActiveTab] = useState<'info' | 'memories'>('info');
const { hasMemories, memoriesCount } = useWineHasMemories(wineId);

// Dans le JSX, ajoutez les onglets après le header
<WineDetailsTabs
  activeTab={activeTab}
  onTabChange={setActiveTab}
  memoriesCount={memoriesCount}
/>

// Conditionnez l'affichage du contenu
{activeTab === 'memories' ? (
  <WineMemoriesScreen
    wineId={wineId}
    wineName={safeWine?.name || 'Vin'}
  />
) : (
  // Votre contenu existant de la fiche vin
)}
```

#### Option B : Utiliser le nouveau composant

Remplacez l'import dans vos écrans :

```typescript
// Au lieu de
import WineDetailsScreenV2 from '../screens/WineDetailsScreenV2';

// Utilisez
import WineDetailsScreenWithMemories from '../screens/WineDetailsScreenWithMemories';
```

### 4. Ajout de l'indicateur sur les cartes de vin

Dans vos composants `WineCard` :

```typescript
import WineMemoryIndicator from '../components/WineMemoryIndicator';
import { useWineHasMemories } from '../hooks/useWineHasMemories';

// Dans votre composant WineCard
const { hasMemories, memoriesCount } = useWineHasMemories(wine.id);

// Dans le JSX de la carte
<View style={styles.cardContainer}>
  {/* Votre contenu existant */}
  
  <WineMemoryIndicator
    hasMemories={hasMemories}
    memoriesCount={memoriesCount}
    size="small"
  />
</View>
```

### 5. Mise à jour des types

Ajoutez les types dans `types/wine.ts` :

```typescript
export interface Wine {
  // ... vos propriétés existantes
  hasMemories?: boolean;
  memoriesCount?: number;
}
```

## 🎨 Personnalisation du design

### Couleurs
- **Couleur principale** : `VeeniColors.wine.red` (#FF4F8B)
- **Couleur de fond** : `#1a1a1a` (sombre)
- **Couleur des cartes** : `#2a2a2a`

### Tailles des indicateurs
- **Small** : 20x20px (cartes de vin)
- **Medium** : 24x24px (listes)
- **Large** : 28x28px (détails)

## 🔧 Fonctionnalités implémentées

### ✅ Création de souvenirs
- Texte libre
- Lieu (optionnel)
- Tagging d'amis
- Photos multiples
- Sauvegarde locale + Supabase

### ✅ Gestion des souvenirs
- Modification par le créateur
- Suppression par le créateur
- Like/Unlike par les amis
- Compteur de likes

### ✅ Interface utilisateur
- Navigation par swipe horizontal
- Design cohérent avec l'app
- Indicateurs visuels
- Modales d'édition

### ✅ Sécurité
- RLS (Row Level Security)
- Politiques d'accès
- Validation des permissions

## 🧪 Tests

### Test de création de souvenir
1. Ouvrez une fiche vin
2. Allez sur l'onglet "Souvenirs"
3. Créez un nouveau souvenir
4. Vérifiez la sauvegarde

### Test de like
1. Créez un souvenir
2. Connectez-vous avec un autre compte
3. Likez le souvenir
4. Vérifiez le compteur

### Test de l'indicateur
1. Créez un souvenir pour un vin
2. Retournez à la liste des vins
3. Vérifiez la pastille sur la carte

## 🐛 Dépannage

### Erreur de permissions
```typescript
// Vérifiez les permissions dans useMemoryPhotoUpload
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
```

### Erreur de RLS
```sql
-- Vérifiez les politiques dans Supabase
SELECT * FROM pg_policies WHERE tablename = 'wine_memories';
```

### Erreur d'upload
```typescript
// Vérifiez la configuration du bucket
const { data, error } = await supabase.storage
  .from('wine_memories_images')
  .upload(filePath, blob);
```

## 📱 Utilisation

### Pour l'utilisateur
1. **Créer un souvenir** : Onglet "Souvenirs" → Bouton "+"
2. **Modifier** : Menu "..." → "Modifier"
3. **Liker** : Cœur sur le souvenir
4. **Voir les souvenirs** : Onglet "Souvenirs"

### Pour les développeurs
1. **Hooks disponibles** :
   - `useWineMemories` : Gestion des souvenirs
   - `useWineHasMemories` : Vérification de présence
   - `useMemoryPhotoUpload` : Upload des photos

2. **Composants disponibles** :
   - `WineDetailsTabs` : Navigation par onglets
   - `WineMemoriesScreen` : Écran des souvenirs
   - `WineMemoryIndicator` : Indicateur sur les cartes

## 🎯 Prochaines étapes

1. **Partage** : Implémenter le partage de souvenirs
2. **Notifications** : Notifier les amis taggés
3. **Recherche** : Rechercher dans les souvenirs
4. **Filtres** : Filtrer par ami, date, lieu
5. **Export** : Exporter les souvenirs

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console
2. Vérifiez les permissions Supabase
3. Vérifiez la configuration RLS
4. Testez avec des données de test

---

**Note** : Cette implémentation respecte toutes vos contraintes et ne casse aucune fonctionnalité existante. [[memory:255004]]


