import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const ACCENT = '#FFFFFF';
const BG = '#23272F';
const WHITE = '#FFF';
const RADIUS = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_PHOTOS = 6; // Limite technique recommandée
const MAX_PHOTOS_WARNING = 4; // Limite recommandée avec avertissement

// Type pour les vins détectés par OCR
interface DetectedWine {
  id: string;
  name: string;
  domaine?: string;
  vintage?: number;
  region?: string;
  appellation?: string;
  country?: string; // ✅ Ajouter le pays
  grapes?: string[];
  imageUri: string;
  color?: 'red' | 'white' | 'rose' | 'sparkling';
  rawText?: string; // Texte brut extrait par OCR
}

export default function AddScreen() {
  console.log('🎯 AddScreen chargé - Nouveau système OCR actif');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBase64Map, setPhotoBase64Map] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Limite atteinte',
        `Vous ne pouvez pas ajouter plus de ${MAX_PHOTOS} photos. Supprimez une photo existante pour en ajouter une nouvelle.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        console.log('Photo prise:', photo.uri);
        setPhotos(prev => [...prev, photo.uri]);
        setError(null); // Effacer les erreurs précédentes
      } catch (error) {
        console.error('Erreur prise de photo:', error);
        setError('Impossible de prendre la photo');
      }
    }
  };

  const analyzePhotosWithOCR = async () => {
    console.log('🔥 FONCTION analyzePhotosWithOCR APPELÉE !');
    console.log('🔥 Nombre de photos:', photos.length);
    console.log('🔥 Photos:', photos);
    
    if (photos.length === 0) {
      console.log('❌ Aucune photo à analyser');
      setError('Prenez d\'abord une photo');
      return;
    }
    
    console.log('🚀 Début analysePhotosWithOCR avec', photos.length, 'photos');
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const detectedWines: DetectedWine[] = [];
      
      // Analyser chaque photo avec Google Vision puis l'Edge Function Supabase
      for (let i = 0; i < photos.length; i++) {
        const photoUri = photos[i];
        console.log(`📸 Traitement photo ${i + 1}/${photos.length}:`, photoUri);
        
        try {
          // Conversion FORCÉE en JPEG base64 pour éviter HEIC → Vision
          let base64 = '';
          try {
            const result = await manipulateAsync(
              photoUri,
              [],
              { compress: 0.9, format: SaveFormat.JPEG, base64: true }
            );
            base64 = result.base64 || '';
          } catch (manipErr) {
            console.warn('⚠️ manipulateAsync a échoué, fallback FileSystem:', manipErr);
            base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });
          }
          console.log('✅ Image encodée, taille:', base64.length);

          // Préparer une variante optimisée pour OCR (resize + JPEG)
          let variantBase64: string | undefined;
          try {
            const manipulated = await manipulateAsync(
              photoUri,
              [{ resize: { width: 1800 } }],
              { compress: 0.95, format: SaveFormat.JPEG, base64: true }
            );
            variantBase64 = manipulated.base64 || undefined;
          } catch {}

          // Appeler la fonction edge Supabase avec l'image base64 (+ variante si dispo)
          console.log('🤖 Appel fonction ocr-scan...');
          const { data: result, error: ocrError } = await supabase.functions.invoke('ocr-scan', {
            body: { images: variantBase64 ? [base64, variantBase64] : [base64] }
          });

          console.log('📡 Réponse ocr-scan reçue');

          if (ocrError) {
            console.error('❌ Erreur ocr-scan:', ocrError);
            throw new Error(`Erreur ocr-scan pour la photo ${i + 1}: ${ocrError.message}`);
          }

          if (!result) {
            throw new Error(`Aucune réponse de ocr-scan pour la photo ${i + 1}`);
          }
          console.log('✅ Réponse ocr-scan reçue:', result);
          console.log('🔍 Détails de la réponse OCR:', JSON.stringify(result, null, 2));

          // 3. Traiter la réponse de l'Edge Function
          let wine;
          if (result.success && (result.wine || (result.wines && result.wines[0]))) {
            wine = result.wine || result.wines[0];
            console.log('🍷 Vin extrait de la réponse:', wine);
            
            // Vérifier si le vin est valide - être très souple
            const hasValidData = wine.nom && wine.nom !== 'Nom non identifié' && wine.nom !== 'Vin non identifié';
            const hasProducteur = wine.producteur && wine.producteur !== 'Domaine inconnu';
            
            if (!hasValidData && !hasProducteur) {
              console.warn('⚠️ Vin non reconnu par le parsing local et l\'IA...');
              setError('Vin non reconnu. Veuillez réessayer ou saisir manuellement.');
              continue; // Passer à la photo suivante
            }
            
            const detectedWine: DetectedWine = {
              id: `ocr-${Date.now()}-${i}`,
              name: wine.nom || wine.producteur || 'Vin non identifié',
              domaine: wine.producteur,
              vintage: wine.année ? parseInt(wine.année) : undefined,
              region: wine.région,
              appellation: wine.appellation, // ✅ Utiliser la vraie appellation
              country: wine.pays, // ✅ Ajouter le pays
              grapes: wine.cépages || [],
              imageUri: photoUri, // Garder l'URI locale pour l'instant, upload dans useWines
              color: wine.type === 'Rouge' ? 'red' : 
                    wine.type === 'Blanc' ? 'white' : 
                    wine.type === 'Rosé' ? 'rose' : 
                    wine.type === 'Pétillant' ? 'sparkling' : 'red',
              rawText: wine.rawText || '',
            };
            detectedWines.push(detectedWine);
            console.log('🍷 Vin détecté avec succès:', wine);
            console.log('🍷 DetectedWine créé:', detectedWine);
          } else {
            console.log('❌ Aucun vin valide détecté dans la réponse ocr-scan');
            setError('Aucun vin reconnu. Veuillez réessayer.');
          }
        } catch (photoError: any) {
          console.error(`❌ Erreur traitement photo ${i + 1}:`, photoError);
          
          // Gestion spécifique des erreurs réseau
          if (photoError.message?.includes('Network request failed')) {
            setError('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
          } else {
            setError(`Erreur traitement photo ${i + 1}: ${photoError.message || 'Erreur inconnue'}`);
          }
        }
      }
      
      console.log('📊 Vins détectés au total:', detectedWines.length);
      
      if (detectedWines.length > 0) {
        // Naviguer vers l'écran des résultats avec les données
        router.push({
          pathname: '/ocr-results' as any,
          params: { wines: JSON.stringify(detectedWines) }
        });
      } else {
        setError('Aucun vin reconnu. Veuillez réessayer ou saisir manuellement.');
      }
      
    } catch (error: any) {
      console.error('❌ Erreur analyse OCR:', error);
      
      // Gestion spécifique des erreurs réseau
      if (error.message?.includes('Network request failed')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      } else {
        setError('Erreur pendant l\'analyse. Veuillez réessayer.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectPhotosFromLibrary = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Limite atteinte',
        `Vous ne pouvez pas ajouter plus de ${MAX_PHOTOS} photos. Supprimez une photo existante pour en ajouter une nouvelle.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la bibliothèque de photos est nécessaire pour sélectionner des images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Calculer le nombre de photos qu'on peut encore ajouter
      const remainingSlots = MAX_PHOTOS - photos.length;
      
      // Avertissement si on dépasse la limite recommandée
      if (photos.length >= MAX_PHOTOS_WARNING) {
        Alert.alert(
          'Attention',
          `Vous avez déjà ${photos.length} photos. L'analyse de plus de ${MAX_PHOTOS_WARNING} photos peut prendre du temps. Voulez-vous continuer ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Continuer', 
              onPress: () => openImagePicker(remainingSlots)
            }
          ]
        );
        return;
      }

      openImagePicker(remainingSlots);
    } catch (error) {
      console.error('Erreur sélection photos:', error);
      setError('Impossible d\'accéder à la bibliothèque de photos');
    }
  };

  const openImagePicker = async (maxImages: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
        selectionLimit: maxImages,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        // Mettre à jour la map base64 pour les assets qui la fournissent
        const newMapEntries: Record<string, string> = {};
        for (const asset of result.assets) {
          if (asset.base64) {
            newMapEntries[asset.uri] = asset.base64;
          }
        }
        if (Object.keys(newMapEntries).length > 0) {
          setPhotoBase64Map(prev => ({ ...prev, ...newMapEntries }));
        }
        setPhotos(prev => [...prev, ...newPhotos]);
        setError(null);
        console.log(`${newPhotos.length} photos ajoutées depuis la bibliothèque`);
      }
    } catch (error) {
      console.error('Erreur sélection images:', error);
      setError('Erreur lors de la sélection des photos');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const uriToRemove = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (uriToRemove && photoBase64Map[uriToRemove]) {
        setPhotoBase64Map(current => {
          const copy = { ...current };
          delete copy[uriToRemove];
          return copy;
        });
      }
      return next;
    });
    setError(null); // Effacer les erreurs quand on modifie les photos
  };

  // Gestion des permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un vin</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.instructions}>Demande d'accès à la caméra...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un vin</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.instructions}>Accès à la caméra refusé</Text>
          <TouchableOpacity style={styles.analyzeButton} onPress={requestPermission}>
            <Text style={styles.analyzeButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un vin</Text>
        {/* Espace réservé, bouton Suivant déplacé en bas (même largeur que backButton pour centrer le titre) */}
        <View style={{ width: 40 }} />
      </View>

      {/* Sous-titre */}
      <Text style={styles.instructions}>
        Scannez l'étiquette d'un ou plusieurs vins
      </Text>

      {/* Bloc Caméra */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        />
        {/* Cadre de guidage visuel */}
        <View style={styles.guidanceFrame} />
      </View>

      {/* Bouton de prise de photo sous la caméra */}
      <View style={styles.captureBelowCameraContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture} activeOpacity={0.7}>
          <View style={styles.captureOuter}>
            <View style={styles.captureInner} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Liste des vignettes photos */}
      <View style={styles.thumbnailsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 0 }}
        >
          {photos.map((photoUri, index) => (
            <View key={index} style={styles.thumbnailWrapper}>
              <Image source={{ uri: photoUri }} style={styles.thumbnail} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Bouton pour ajouter des photos depuis la bibliothèque */}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={styles.libraryButton}
              onPress={selectPhotosFromLibrary}
            >
              <Ionicons name="library-outline" size={32} color={WHITE} />
              <Text style={styles.libraryButtonText}>Bibliothèque</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Bouton Suivant fixe en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.analyzeBottomButton, (photos.length === 0 || isAnalyzing) && styles.analyzeBottomButtonDisabled]}
          onPress={analyzePhotosWithOCR}
          disabled={photos.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={'#000'} />
              <Text style={styles.analyzeBottomButtonText}>Analyse en cours…</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBottomButtonText}>Suivant</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: WHITE,
  },
  instructions: {
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    marginHorizontal: 20,
    height: 300,
    borderRadius: RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WHITE,
  },
  thumbnailsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    overflow: 'visible',
  },
  captureBelowCameraContainer: {
    paddingTop: 16,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    marginRight: 10,
    position: 'relative',
    overflow: 'visible',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: RADIUS,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(35, 39, 47, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: BG,
  },
  analyzeButton: {
    backgroundColor: ACCENT,
    borderRadius: RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    backgroundColor: 'rgba(246, 160, 122, 0.5)',
  },
  analyzeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeHeaderButton: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  analyzeHeaderButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  analyzeHeaderButtonText: {
    color: '#000000', // Noir pour contraste avec fond blanc
    fontSize: 14,
    fontWeight: '600',
  },
  guidanceFrame: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -70, // 140px / 2
    width: 140,
    height: 300,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderStyle: 'dashed',
    borderRadius: 8,
    pointerEvents: 'none',
  },
  analyzeBottomButton: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  analyzeBottomButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  analyzeBottomButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  libraryButton: {
    width: 80,
    height: 80,
    borderRadius: RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: 5,
  },
  libraryButtonText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
}); 