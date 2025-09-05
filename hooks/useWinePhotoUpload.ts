import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useImageUpload } from './useImageUpload';

export const useWinePhotoUpload = () => {
  const { uploadImage, uploading } = useImageUpload();

  const uploadWinePhoto = async (wineId: string): Promise<string | null> => {
    try {
      // Générer un nom de fichier unique pour le vin
      const fileName = `${wineId}/photo.jpg`;
      
      // Utiliser le hook générique d'upload d'images
      const publicUrl = await uploadImage('wines', fileName, {
        allowsEditing: true,
        aspect: [4, 3], // Format plus adapté pour les photos de vins
        quality: 0.8,
      });

      if (!publicUrl) {
        return null;
      }

      // Mettre à jour la base de données avec la nouvelle photo
      const { error: updateError } = await supabase
        .from('Wine')
        .update({ image_uri: publicUrl })
        .eq('id', wineId);

      if (updateError) {
        console.error('Erreur mise à jour DB:', updateError);
        Alert.alert('Erreur', 'Photo uploadée mais impossible de mettre à jour le vin.');
        return null;
      }

      console.log('✅ Photo de vin mise à jour dans la base de données');
      console.log('✅ URL finale:', publicUrl);

      return publicUrl;

    } catch (error) {
      console.error('Erreur upload photo de vin:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'upload de la photo.');
      return null;
    }
  };

  return {
    uploadWinePhoto,
    uploading,
  };
}; 