import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMemoryPhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission refusée pour accéder à la galerie');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('🔍 Image sélectionnée:', selectedImage.uri);
        return selectedImage.uri;
      }
      return null;
    } catch (err: any) {
      console.error('Erreur lors de la sélection d\'image:', err.message);
      setError(err.message);
      return null;
    }
  };

  const takePhoto = async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission refusée pour accéder à la caméra');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('🔍 Photo prise:', selectedImage.uri);
        return selectedImage.uri;
      }
      return null;
    } catch (err: any) {
      console.error('Erreur lors de la prise de photo:', err.message);
      setError(err.message);
      return null;
    }
  };

  const uploadPhoto = async (uri: string, wineId: string): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `wine-memories/${wineId}/${fileName}`;

      // Utiliser FormData directement avec l'URI (méthode React Native)
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: `image/${fileExt}`,
        name: fileName,
      } as any);

      console.log('🔍 Upload vers bucket wines, chemin:', filePath);

      // Upload direct vers Supabase
      const { data, error: uploadError } = await supabase.storage
        .from('wines')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Construire l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('wines')
        .getPublicUrl(filePath);

      console.log('✅ Image uploadée avec succès:', publicUrl);
      return publicUrl;

    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err.message);
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (url: string): Promise<boolean> => {
    setUploading(true);
    setError(null);

    try {
      const path = url.split('wines/')[1];
      if (!path) {
        throw new Error('URL d\'image invalide pour la suppression');
      }

      const { error: deleteError } = await supabase.storage
        .from('wines')
        .remove([path]);

      if (deleteError) {
        throw deleteError;
      }
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err.message);
      setError(err.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { pickImage, takePhoto, uploadPhoto, deletePhoto, uploading, error };
}