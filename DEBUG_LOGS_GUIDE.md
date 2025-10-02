# 🔍 Guide de Debug avec Logs Détaillés

## ✅ **Logs Ajoutés pour Identifier les Crashes**

J'ai ajouté des logs détaillés dans tous les handlers et fonctions critiques pour identifier exactement où et pourquoi l'app crash.

### **1. Logs des Handlers de Champs**

```typescript
// Handler pour memoryText
const handleMemoryTextChange = (text: string) => {
  try {
    console.log('🔄 handleMemoryTextChange appelé avec:', text);
    setMemoryText(text);
    console.log('✅ handleMemoryTextChange terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur dans handleMemoryTextChange:', error);
    console.error('❌ Stack trace:', error.stack);
  }
};

// Handler pour locationText
const handleLocationTextChange = (text: string) => {
  try {
    console.log('🔄 handleLocationTextChange appelé avec:', text);
    setLocationText(text);
    console.log('✅ handleLocationTextChange terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur dans handleLocationTextChange:', error);
    console.error('❌ Stack trace:', error.stack);
  }
};
```

### **2. Logs de la Sauvegarde Automatique**

```typescript
const handleAutoSave = useCallback(() => {
  try {
    console.log('🔄 handleAutoSave déclenché:', { memoryText, locationText, selectedFriends, photoUrls, isEditing });
    console.log('🔄 Types des valeurs:', {
      memoryTextType: typeof memoryText,
      locationTextType: typeof locationText,
      selectedFriendsType: typeof selectedFriends,
      photoUrlsType: typeof photoUrls
    });
    
    // Protection contre les valeurs undefined
    const safeMemoryText = memoryText || '';
    const safeLocationText = locationText || '';
    const safeSelectedFriends = selectedFriends || [];
    const safePhotoUrls = photoUrls || [];
    
    console.log('🔄 Valeurs sécurisées:', { safeMemoryText, safeLocationText, safeSelectedFriends, safePhotoUrls });
    
    if (safeMemoryText.trim() || safeLocationText.trim() || safeSelectedFriends.length > 0 || safePhotoUrls.length > 0) {
      const memoryData: CreateWineMemoryData = {
        wine_id: wineId,
        text: safeMemoryText.trim() || undefined,
        location_text: safeLocationText.trim() || undefined,
        friends_tagged: safeSelectedFriends.length > 0 ? safeSelectedFriends : undefined,
        photo_urls: safePhotoUrls.length > 0 ? safePhotoUrls : undefined
      };

      console.log('💾 Sauvegarde automatique:', memoryData);
      console.log('💾 Appel de saveMemoryDebounced...');
      saveMemoryDebounced(memoryData);
      console.log('✅ saveMemoryDebounced appelé avec succès');
    } else {
      console.log('⏭️ Aucune sauvegarde nécessaire (pas de contenu)');
    }
  } catch (error) {
    console.error('❌ Erreur dans handleAutoSave:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}, [memoryText, locationText, selectedFriends, photoUrls, wineId, saveMemoryDebounced]);
```

### **3. Logs du useEffect de Sauvegarde**

```typescript
useEffect(() => {
  try {
    console.log('🔄 useEffect de sauvegarde déclenché:', { 
      memoryText, 
      locationText, 
      selectedFriends, 
      photoUrls, 
      isEditing 
    });
    
    if (!isEditing && (memoryText.trim() || locationText.trim() || selectedFriends.length > 0 || photoUrls.length > 0)) {
      console.log('🔄 Conditions de sauvegarde remplies, appel de handleAutoSave...');
      handleAutoSave();
    } else {
      console.log('⏭️ Conditions de sauvegarde non remplies:', {
        isEditing,
        hasMemoryText: !!memoryText.trim(),
        hasLocationText: !!locationText.trim(),
        hasSelectedFriends: selectedFriends.length > 0,
        hasPhotoUrls: photoUrls.length > 0
      });
    }
  } catch (error) {
    console.error('❌ Erreur dans useEffect de sauvegarde automatique:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}, [memoryText, locationText, selectedFriends, photoUrls, isEditing, handleAutoSave]);
```

### **4. Logs des Fonctions de Gestion**

```typescript
// Toggle ami sélectionné
const toggleFriendSelection = (friendId: string) => {
  try {
    console.log('🔄 toggleFriendSelection appelé avec friendId:', friendId);
    console.log('🔄 selectedFriends actuel:', selectedFriends);
    
    const newFriends = selectedFriends.includes(friendId) 
      ? selectedFriends.filter(id => id !== friendId)
      : [...selectedFriends, friendId];
    
    console.log('🔄 newFriends calculé:', newFriends);
    handleSelectedFriendsChange(newFriends);
    console.log('✅ toggleFriendSelection terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur dans toggleFriendSelection:', error);
    console.error('❌ Stack trace:', error.stack);
  }
};

// Gestion des photos
const handleAddPhoto = async () => {
  try {
    console.log('🔄 handleAddPhoto appelé');
    console.log('🔄 photoUrls actuel:', photoUrls);
    
    const imageUri = await pickImage();
    console.log('🔄 imageUri reçu:', imageUri);
    
    if (imageUri) {
      const newUrls = [...photoUrls, imageUri];
      console.log('🔄 newUrls calculé:', newUrls);
      handlePhotoUrlsChange(newUrls);
      console.log('✅ handleAddPhoto terminé avec succès');
    } else {
      console.log('⏭️ Aucune image sélectionnée');
    }
  } catch (error) {
    console.error('❌ Erreur dans handleAddPhoto:', error);
    console.error('❌ Stack trace:', error.stack);
    Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
  }
};
```

### **5. Logs du Debounce**

```typescript
const saveMemoryDebounced = useCallback(
  debounce((memoryData: CreateWineMemoryData) => {
    console.log('🔄 saveMemoryDebounced exécuté avec:', memoryData);
    createMemory(memoryData)
      .then(() => {
        console.log('✅ createMemory réussi');
        setIsSaving(true);
        setTimeout(() => {
          console.log('✅ setIsSaving(false) après timeout');
          setIsSaving(false);
        }, 1000);
      })
      .catch((error) => {
        console.error('❌ Erreur lors de la sauvegarde automatique:', error);
        console.error('❌ Stack trace:', error.stack);
        setIsSaving(false);
      });
  }, 1000),
  [createMemory]
);
```

## 🔍 **Comment Utiliser les Logs**

### **1. Ouvrir la Console**
- Dans Expo Go : Shake le téléphone → "Debug Remote JS"
- Dans le navigateur : F12 → Console

### **2. Identifier le Problème**
- Cherchez les logs `❌` pour les erreurs
- Vérifiez les `Stack trace` pour localiser le problème
- Regardez les logs `🔄` pour suivre le flux d'exécution

### **3. Informations Disponibles**
- **Valeurs des champs** : Types et contenu
- **Flux d'exécution** : Ordre des appels
- **Erreurs détaillées** : Message et stack trace
- **États des variables** : Avant et après les modifications

## 🎯 **Prochaines Étapes**

1. **Testez l'app** et reproduisez le crash
2. **Copiez les logs** de la console
3. **Identifiez** le dernier log avant le crash
4. **Analysez** l'erreur et la stack trace

Les logs vont nous dire exactement où et pourquoi l'app crash ! 🍷✨






