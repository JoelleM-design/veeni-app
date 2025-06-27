import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VeeniColors } from '../../constants/Colors';

export default function AddScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Nous avons besoin de votre permission pour utiliser la caméra</Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        setSelectedImages(prev => [...prev, photo.uri]);
        console.log('Photo prise:', photo.uri);
      } catch (error) {
        console.error('Erreur lors de la prise de photo:', error);
        Alert.alert('Erreur', 'Impossible de prendre la photo');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une image');
      return;
    }
    
    // Rediriger vers l'écran OCR avec les images
    router.push({
      pathname: '/add/ocr',
      params: { images: JSON.stringify(selectedImages) }
    });
  };

  return (
    <View style={styles.container}>
      {/* Zone caméra */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={facing}
        />
        
        {/* Bouton retour */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Boutons caméra */}
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.flipButton}
            onPress={() => setFacing(current => current === CameraType.back ? CameraType.front : CameraType.back)}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vignettes des images sélectionnées */}
      {selectedImages.length > 0 && (
        <View style={styles.thumbnailsContainer}>
          <Text style={styles.thumbnailsTitle}>Images sélectionnées ({selectedImages.length})</Text>
          <View style={styles.thumbnailsGrid}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.analyzeButton}
            onPress={startAnalysis}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.analyzeButtonText}>Analyser les images</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton d'analyse flottant quand pas d'images */}
      {selectedImages.length === 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={() => Alert.alert('Info', 'Prenez une photo ou sélectionnez une image depuis votre galerie pour commencer l\'analyse')}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.floatingButtonText}>Prendre une photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VeeniColors.background.primary,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: VeeniColors.text.primary,
  },
  permissionButton: {
    backgroundColor: VeeniColors.accent.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: VeeniColors.accent.primary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: VeeniColors.accent.primary,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailsContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  thumbnailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: VeeniColors.text.primary,
  },
  thumbnailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
  },
  analyzeButton: {
    backgroundColor: VeeniColors.accent.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: VeeniColors.accent.primary,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
}); 