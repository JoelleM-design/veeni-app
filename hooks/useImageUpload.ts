import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (
    bucket: string,
    fileName: string,
    options: ImagePickerOptions = {}
  ): Promise<string | null> => {
    try {
      setUploading(true);

      // 1. Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie.');
        return null;
      }

      // 2. Lancer le sélecteur d'image avec format forcé
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        base64: true, // 🔑 Forcer la conversion en base64
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const selectedImage = result.assets[0];
      console.log('🔍 Image sélectionnée:', selectedImage.uri);
      console.log('🔍 Base64 disponible:', !!selectedImage.base64);

      // 3. Convertir en blob avec format standardisé
      if (!selectedImage.base64) {
        console.error('❌ Base64 non disponible');
        Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée.');
        return null;
      }

      // 🔑 Forcer le format JPEG pour la compatibilité
      const contentType = 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${selectedImage.base64}`;
      
      console.log('🔍 Conversion base64 en blob...');
      
      const response = await fetch(dataUrl);
      if (!response.ok) {
        console.error('❌ Erreur fetch:', response.status, response.statusText);
        Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée.');
        return null;
      }

      const blob = await response.blob();
      console.log('🔍 Blob créé:', blob.size, 'bytes');

      // 4. Upload vers Supabase avec retry
      console.log('🔍 Upload vers bucket:', bucket);

      let uploadResult;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          uploadResult = await supabase.storage
            .from(bucket)
            .upload(fileName, blob, {
              contentType: contentType, // 🔑 Forcer le content-type
              upsert: true,
            });

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          console.log('✅ Upload réussi avec tentative', attempts);
          console.log('✅ Données de retour:', uploadResult.data);
          break;
        } catch (error) {
          console.error(`❌ Tentative ${attempts} échouée:`, error);
          if (attempts === maxAttempts) {
            Alert.alert('Erreur', 'Impossible d\'uploader l\'image. Veuillez réessayer.');
            return null;
          }
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!uploadResult?.data) {
        return null;
      }

      // 5. Construire l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('✅ Image uploadée avec succès:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'upload de l\'image.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
}; 