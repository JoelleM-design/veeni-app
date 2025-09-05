import { supabase } from './supabase';
import { uploadWineImage } from './uploadWineImage';

/**
 * Migre les images locales vers Supabase Storage
 * Pour les vins existants qui ont des imageUri en file://
 */
export const migrateExistingImages = async (): Promise<{ migrated: number; errors: number }> => {
  console.log('🔄 Début de la migration des images...');
  
  let migrated = 0;
  let errors = 0;

  try {
    // Récupérer tous les vins avec des images locales
    const { data: wines, error: fetchError } = await supabase
      .from('wine')
      .select('id, name, image_uri')
      .like('image_uri', 'file://%');

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des vins:', fetchError);
      return { migrated: 0, errors: 1 };
    }

    if (!wines || wines.length === 0) {
      console.log('✅ Aucune image locale à migrer');
      return { migrated: 0, errors: 0 };
    }

    console.log(`📊 ${wines.length} vins avec images locales trouvés`);

    // Migrer chaque image
    for (const wine of wines) {
      try {
        console.log(`🔄 Migration de ${wine.name}...`);
        
        // Uploader l'image vers Supabase Storage
        const newImageUri = await uploadWineImage(wine.id, wine.image_uri);
        
        if (newImageUri && newImageUri !== wine.image_uri) {
          // Mettre à jour la base de données avec la nouvelle URI
          const { error: updateError } = await supabase
            .from('wine')
            .update({ image_uri: newImageUri })
            .eq('id', wine.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour ${wine.name}:`, updateError);
            errors++;
          } else {
            console.log(`✅ ${wine.name} migré: ${newImageUri}`);
            migrated++;
          }
        } else {
          console.warn(`⚠️ ${wine.name}: Image non migrée (même URI)`);
        }
      } catch (wineError) {
        console.error(`❌ Erreur migration ${wine.name}:`, wineError);
        errors++;
      }
    }

    console.log(`🎉 Migration terminée: ${migrated} migrés, ${errors} erreurs`);
    return { migrated, errors };

  } catch (error) {
    console.error('❌ Erreur générale migration:', error);
    return { migrated, errors: errors + 1 };
  }
};

/**
 * Nettoie les vins sans image (met image_uri à null)
 * Pour les vins qui n'ont jamais eu d'image
 */
export const cleanupWinesWithoutImages = async (): Promise<number> => {
  console.log('🧹 Nettoyage des vins sans image...');
  
  try {
    // Mettre à jour les vins avec des image_uri vides ou invalides
    const { data, error } = await supabase
      .from('wine')
      .update({ image_uri: null })
      .or('image_uri.is.null,image_uri.eq.,image_uri.like.file://%')
      .select('id, name');

    if (error) {
      console.error('❌ Erreur nettoyage:', error);
      return 0;
    }

    console.log(`✅ ${data?.length || 0} vins nettoyés`);
    return data?.length || 0;

  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    return 0;
  }
};
