import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: false,
        quality: 0.8,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return null;

      setUploading(true);
      const fileUri = pickerResult.assets[0].uri;

      // Lire le fichier image local en base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = decode(base64Data);
      const path = `${userId}/avatar.jpg`;

      // 1. Supprimer l'ancienne image si elle existe
      try {
        await supabase.storage
          .from('avatars')
          .remove([path]);
        console.log('🗑️ Ancienne image supprimée');
      } catch (deleteError) {
        // Ignorer l'erreur si le fichier n'existe pas
        console.log('ℹ️ Aucune ancienne image à supprimer');
      }

      // 2. Uploader la nouvelle image
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('❌ Erreur Supabase upload :', error);
        return null;
      }

      // 3. Obtenir l'URL publique avec cache-buster
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        console.error('❌ Impossible d\'obtenir l\'URL publique');
        return null;
      }

      // 4. Ajouter un cache-buster pour forcer le rechargement
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      
      console.log('✅ Nouvelle image uploadée avec succès');
      console.log('✅ URL finale:', urlWithCacheBuster);

      return urlWithCacheBuster;
    } catch (error) {
      console.error('❌ Erreur upload avatar', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
} 