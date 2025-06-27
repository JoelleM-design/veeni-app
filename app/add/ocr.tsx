import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { VeeniColors } from '../../constants/Colors';
import { useWineScan } from '../../hooks/useWineScan';
import { useWines } from '../../hooks/useWines';
import { Wine } from '../../types/wine';

interface WineCardProps {
  wine: Wine;
  onAddToCellar: () => void;
  onAddToWishlist: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const WineCard: React.FC<WineCardProps> = ({ wine, onAddToCellar, onAddToWishlist, onDelete, onEdit }) => {
  return (
    <View style={styles.wineCard}>
      {/* Bouton de suppression */}
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="close" size={16} color="white" />
      </TouchableOpacity>

      {/* Image du vin */}
      <View style={styles.wineImageContainer}>
        {wine.imageUri ? (
          <Image source={{ uri: wine.imageUri }} style={styles.wineImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="wine" size={40} color={VeeniColors.accent.primary} />
          </View>
        )}
      </View>

      {/* Informations du vin */}
      <View style={styles.wineInfo}>
        <Text style={styles.wineName} numberOfLines={2}>
          {wine.name}
        </Text>
        <Text style={styles.wineDetails}>
          {wine.domaine} • {wine.vintage} • {wine.region}
        </Text>
        <Text style={styles.wineType}>
          {wine.color === 'red' ? 'Rouge' : 
           wine.color === 'white' ? 'Blanc' : 
           wine.color === 'rose' ? 'Rosé' : 'Effervescent'}
        </Text>
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cellarButton} onPress={onAddToCellar}>
          <Ionicons name="wine" size={16} color="white" />
          <Text style={styles.buttonText}>Ma cave</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.wishlistButton} onPress={onAddToWishlist}>
          <Ionicons name="heart" size={16} color="white" />
          <Text style={styles.buttonText}>Ma liste d'envie</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton d'édition */}
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <Ionicons name="create" size={16} color={VeeniColors.accent.primary} />
        <Text style={styles.editButtonText}>Modifier</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function OCRScreen() {
  const router = useRouter();
  const { images } = useLocalSearchParams<{ images: string }>();
  const { addWineToCellar, addWineToWishlist } = useWines();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const { wines: analyzedWines, loading: scanLoading, error: scanError, fallbackMode: scanFallbackMode, scanWineImages } = useWineScan();

  useEffect(() => {
    if (images) {
      const imageUris = JSON.parse(images);
      handleAnalyzeImages(imageUris);
    }
  }, [images]);

  const handleAnalyzeImages = async (imageUris: string[]) => {
        setLoading(true);
        setError(null);
    setFallbackMode(false);

    try {
      await scanWineImages(imageUris);
    } catch (err) {
      console.error('Erreur analyse:', err);
      setError('Erreur lors de l\'analyse des images');
      setFallbackMode(true);
    } finally {
        setLoading(false);
      }
    };

  const addMoreImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImageUris = result.assets.map(asset => asset.uri);
        const currentImages = images ? JSON.parse(images) : [];
        const allImages = [...currentImages, ...newImageUris];
        
        // Mettre à jour les paramètres de route
        router.setParams({ images: JSON.stringify(allImages) });
        
        // Relancer l'analyse
        handleAnalyzeImages(allImages);
      }
    } catch (err) {
      console.error('Erreur sélection images:', err);
      Alert.alert('Erreur', 'Impossible de sélectionner des images');
    }
  };

  const handleAddToCellar = async (wine: Wine) => {
    try {
      const wineWithCellar = { ...wine, origin: 'cellar' as const, stock: 1 };
      await addWineToCellar(wineWithCellar);
      Alert.alert('Succès', 'Vin ajouté à votre cave !');
      
      // Redirection automatique vers la cave si plus de vins à traiter
      if (analyzedWines.length <= 1) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur ajout cave:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le vin à votre cave');
    }
  };

  const handleAddToWishlist = async (wine: Wine) => {
    try {
      const wineWithWishlist = { ...wine, origin: 'wishlist' as const, stock: 0 };
      await addWineToWishlist(wineWithWishlist);
      Alert.alert('Succès', 'Vin ajouté à votre liste d\'envie !');
      
      // Redirection automatique vers la wishlist si plus de vins à traiter
      if (analyzedWines.length <= 1) {
        router.replace('/(tabs)/wishlist');
      }
    } catch (error) {
      console.error('Erreur ajout wishlist:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le vin à votre liste d\'envie');
    }
  };

  const removeWineFromList = (wineId: string) => {
    // Cette fonction n'est plus nécessaire car les vins sont gérés par le hook
    // Les vins seront automatiquement retirés après ajout
  };

  const handleEditWine = (wine: Wine) => {
    // Rediriger vers un écran d'édition de vin
    router.push({
      pathname: '/add/validate',
      params: { 
        wine: JSON.stringify(wine),
        mode: 'edit'
      }
    });
  };

  const handleManualAdd = () => {
    router.push({
      pathname: '/add/validate',
      params: { mode: 'manual' }
    });
  };

  // Utiliser les états du hook useWineScan
  const isLoading = loading || scanLoading;
  const hasError = error || scanError;
  const isFallbackMode = fallbackMode || scanFallbackMode;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={VeeniColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse des vins</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* État de chargement */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={VeeniColors.accent.primary} />
            <Text style={styles.loadingText}>Analyse en cours...</Text>
          </View>
        )}

        {/* Mode fallback */}
        {isFallbackMode && !isLoading && (
          <View style={styles.fallbackContainer}>
            <Ionicons name="information-circle" size={24} color={VeeniColors.accent.primary} />
            <Text style={styles.fallbackText}>
              Mode manuel activé. Vous pouvez saisir les informations manuellement.
            </Text>
          </View>
        )}

        {/* Erreur */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="red" />
            <Text style={styles.errorText}>{hasError}</Text>
          </View>
        )}

        {/* Vins trouvés */}
        {analyzedWines.length > 0 && (
          <View style={styles.winesSection}>
            <Text style={styles.sectionTitle}>
              Vins trouvés ({analyzedWines.length})
            </Text>
            <View style={styles.winesGrid}>
              {analyzedWines.map((wine) => (
                <WineCard
                  key={wine.id}
                  wine={wine}
                  onAddToCellar={() => handleAddToCellar(wine)}
                  onAddToWishlist={() => handleAddToWishlist(wine)}
                  onDelete={() => removeWineFromList(wine.id)}
                  onEdit={() => handleEditWine(wine)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Bouton d'ajout manuel */}
        {!isLoading && analyzedWines.length === 0 && (
          <View style={styles.manualSection}>
            <Text style={styles.sectionTitle}>Aucun vin détecté</Text>
            <TouchableOpacity style={styles.manualButton} onPress={handleManualAdd}>
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.manualButtonText}>Ajouter manuellement</Text>
        </TouchableOpacity>
      </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VeeniColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: VeeniColors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imagesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: VeeniColors.text.primary,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: VeeniColors.accent.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: VeeniColors.text.primary,
  },
  fallbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  fallbackText: {
    marginLeft: 10,
    flex: 1,
    color: '#856404',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    color: '#721C24',
  },
  winesSection: {
    marginBottom: 20,
  },
  winesGrid: {
    gap: 15,
  },
  wineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'red',
    borderRadius: 12,
  },
  wineImageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  wineImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  noImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineInfo: {
    marginBottom: 15,
  },
  wineName: {
    fontSize: 16,
    fontWeight: '600',
    color: VeeniColors.text.primary,
    marginBottom: 5,
  },
  wineDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  wineType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cellarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    backgroundColor: VeeniColors.accent.primary,
  },
  wishlistButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#FF4F8B',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F8F8',
    gap: 5,
  },
  editButtonText: {
    color: VeeniColors.accent.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  manualSection: {
    alignItems: 'center',
    padding: 40,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VeeniColors.accent.primary,
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 