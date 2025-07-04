import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CONFIG } from '../../constants/Config';
import { supabase } from '../../lib/supabase';

const ACCENT = '#F6A07A';
const BG = '#23272F';
const WHITE = '#FFF';
const RADIUS = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Type pour les vins détectés par OCR
interface DetectedWine {
  id: string;
  name: string;
  domaine?: string;
  vintage?: number;
  region?: string;
  appellation?: string;
  grapes?: string[];
  imageUri: string;
  color?: 'red' | 'white' | 'rose' | 'sparkling';
  rawText?: string; // Texte brut extrait par OCR
}

export default function AddScreen() {
  console.log('🎯 AddScreen chargé - Nouveau système OCR actif');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
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
    if (photos.length === 0) {
      console.log('❌ Aucune photo à analyser');
      setError('Prenez d\'abord une photo');
      return;
    }
    
    console.log('🚀 Début analysePhotosWithOCR avec', photos.length, 'photos');
    console.log('🔑 Clé API configurée:', CONFIG.GOOGLE_VISION_API_KEY.substring(0, 10) + '...');
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const detectedWines: DetectedWine[] = [];
      
      // Analyser chaque photo avec Google Vision puis l'Edge Function Supabase
      for (let i = 0; i < photos.length; i++) {
        const photoUri = photos[i];
        console.log(`📸 Traitement photo ${i + 1}/${photos.length}:`, photoUri);
        
        try {
          // Lire le fichier et l'encoder en base64
          console.log('📄 Encodage image en base64...');
          const base64 = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('✅ Image encodée, taille:', base64.length);

          // Appeler la fonction edge Supabase avec l'image base64
          console.log('🤖 Appel fonction ocr-scan (avec image base64)...');
          const { data: result, error: ocrError } = await supabase.functions.invoke('ocr-scan', {
            body: { images: [base64] }
          });

          console.log('📡 Réponse ocr-scan:', { result, error: ocrError });

          if (ocrError) {
            console.error('❌ Erreur ocr-scan:', ocrError);
            throw new Error(`Erreur ocr-scan pour la photo ${i + 1}: ${ocrError.message}`);
          }

          if (!result) {
            throw new Error(`Aucune réponse de ocr-scan pour la photo ${i + 1}`);
          }
          console.log('✅ Réponse ocr-scan reçue:', result);

          // 3. Traiter la réponse de l'Edge Function
          let wine;
          if (result.success && (result.wine || (result.wines && result.wines[0]))) {
            wine = result.wine || result.wines[0];
            // Vérifier si le vin est valide
            if (wine.nom === 'Nom non identifié' || wine.nom === 'Vin non identifié') {
              console.warn('⚠️ Vin non reconnu, tentative d\'enrichissement IA...');
              setError('Impossible de reconnaître ce vin. Veuillez réessayer ou saisir manuellement.');
              continue;
            }
            const detectedWine: DetectedWine = {
              id: `ocr-${Date.now()}-${i}`,
              name: wine.nom,
              domaine: wine.producteur,
              vintage: wine.année ? parseInt(wine.année) : undefined,
              region: wine.région,
              appellation: wine.région,
              grapes: wine.cépages,
              imageUri: photoUri,
              color: wine.type === 'Rouge' ? 'red' : 
                     wine.type === 'Blanc' ? 'white' : 
                     wine.type === 'Rosé' ? 'rose' : 
                     wine.type === 'Effervescent' ? 'sparkling' : 'red',
              rawText: wine.rawText || '',
            };
            detectedWines.push(detectedWine);
            console.log('🍷 Vin détecté avec succès:', wine);
          } else {
            console.log('❌ Aucun vin valide détecté dans la réponse ocr-scan');
            setError('Aucun vin reconnu. Veuillez réessayer.');
          }
        } catch (photoError: any) {
          console.error(`❌ Erreur traitement photo ${i + 1}:`, photoError);
          setError(`Erreur traitement photo ${i + 1}: ${photoError.message || 'Erreur inconnue'}`);
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
      
    } catch (error) {
      console.error('❌ Erreur analyse OCR:', error);
      setError('Erreur pendant l\'analyse. Veuillez réessayer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
        <TouchableOpacity
          style={[
            styles.analyzeHeaderButton,
            (photos.length === 0 || isAnalyzing) && styles.analyzeHeaderButtonDisabled
          ]}
          onPress={analyzePhotosWithOCR}
          disabled={photos.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Text style={styles.analyzeHeaderButtonText}>Analyser</Text>
          )}
        </TouchableOpacity>
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

      {/* Liste des vignettes photos */}
      {photos.length > 0 && (
        <View style={styles.thumbnailsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      )}

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Bouton de prise de photo en bas */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <Ionicons name="camera" size={32} color={WHITE} />
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnailsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  thumbnailWrapper: {
    marginRight: 10,
    position: 'relative',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: BG,
    alignItems: 'center',
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
    color: WHITE,
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
    backgroundColor: 'rgba(246, 160, 122, 0.5)',
  },
  analyzeHeaderButtonText: {
    color: WHITE,
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
}); 