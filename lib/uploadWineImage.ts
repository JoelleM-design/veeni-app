import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

/**
 * Upload une image de vin vers Supabase Storage
 * Compatible avec le système OCR existant
 */
export const uploadWineImage = async (wineId: string, localImageUri: string): Promise<string | null> => {
  // Si ce n'est pas une URI locale, retourner tel quel
  if (!localImageUri || !localImageUri.startsWith('file://')) {
    return localImageUri;
  }

  try {
    console.log('📤 Upload de l\'image vers Supabase Storage...');
    const fileName = `wine-${wineId}.jpg`;
    
    // Lire l'image en base64
    const imageBase64 = await FileSystem.readAsStringAsync(localImageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('📤 Image base64 length:', imageBase64.length);
    
    // Convertir en buffer avec la même méthode que les avatars
    const buffer = decode(imageBase64);
    
    console.log('📤 Buffer size:', buffer.byteLength, 'bytes');
    
    // Upload vers Supabase Storage (même méthode que les avatars)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wines')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('❌ Erreur upload image:', uploadError);
      return null; // Retourner null en cas d'erreur (comme les avatars)
    }
    
    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('wines')
      .getPublicUrl(fileName);
    
    console.log('✅ Image uploadée:', publicUrl);
    
    // Nettoyer le fichier local après upload réussi
    try {
      await FileSystem.deleteAsync(localImageUri, { idempotent: true });
      console.log('🗑️ Fichier local supprimé:', localImageUri);
    } catch (deleteErr) {
      console.warn('⚠️ Impossible de supprimer le fichier local:', deleteErr);
    }
    
    return publicUrl;
    
  } catch (uploadErr) {
    console.error('❌ Erreur lors de l\'upload de l\'image:', uploadErr);
    return null; // Retourner null en cas d'erreur (comme les avatars)
  }
};
