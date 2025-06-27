import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WineCard } from '../../components/WineCard';
import { useWineEnrichment } from '../../hooks/useWineEnrichment';
import { useWines } from '../../hooks/useWines';
import { supabase } from '../../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

// --- Types ---
interface Bottle {
  id: string; 
  name: string;
  vintage: number | null;
  type: 'red' | 'white' | 'rosé' | 'sparkling';
  country: string;
  region: string;
  appellation: string | null;
  grapes: string[];
  photo: string;
  stock: number;
  validated?: boolean;
  destination?: 'cellar' | 'wishlist';
  favorite?: boolean;
}

export default function ValidateScreen() {
  const router = useRouter();
  const { bottles, wine, mode } = useLocalSearchParams<{ bottles: string, wine: string, mode: string }>();
  const [bottlesList, setBottlesList] = useState<Bottle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { refetch } = useWines();
  const { enrichWine } = useWineEnrichment();

  React.useEffect(() => {
    // Mode édition d'un vin unique
    if (mode === 'edit' && wine) {
      try {
        const wineData = JSON.parse(decodeURIComponent(wine)) as any;
        const bottle: Bottle = {
          id: wineData.id,
          name: wineData.name,
          vintage: wineData.vintage,
          type: wineData.color === 'rose' ? 'rosé' : wineData.color,
          country: wineData.country || 'France',
          region: wineData.region || '',
          appellation: wineData.appellation || wineData.domaine || '',
          grapes: wineData.grapes || [],
          photo: wineData.imageUri || '',
          stock: wineData.stock || 1,
          favorite: wineData.favorite || false
        };
        setBottlesList([bottle]);
      } catch (error) {
        console.error('Erreur parsing wine:', error);
        Alert.alert('Erreur', 'Impossible de charger les données du vin');
        router.back();
      }
    }
    // Mode normal avec plusieurs bouteilles
    else if (bottles) {
      try {
        const parsedBottles = JSON.parse(decodeURIComponent(bottles)) as Bottle[];
        // Enrichir chaque bouteille automatiquement
        parsedBottles.forEach((bottle, idx) => {
          enrichWine(bottle, (enriched) => {
            setBottlesList(prev => {
              const newList = [...prev];
              newList[idx] = { ...enriched, favorite: false };
              return newList;
            });
          });
        });
        // Initialiser la liste avec les données brutes pour éviter le vide
        setBottlesList(parsedBottles.map(b => ({ ...b, favorite: false })));
      } catch (error) {
        console.error('Erreur parsing bottles:', error);
        Alert.alert('Erreur', 'Impossible de charger les données des bouteilles');
        router.back();
      }
    }
    // Mode manuel
    else if (mode === 'manual') {
      const manualBottle: Bottle = {
        id: `manual-${Date.now()}`,
        name: 'Nouveau vin',
        vintage: new Date().getFullYear(),
        type: 'red',
        country: 'France',
        region: '',
        appellation: '',
        grapes: [],
        photo: '',
        stock: 1,
        favorite: false
      };
      setBottlesList([manualBottle]);
    }
  }, [bottles, wine, mode]);

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(page);
  };

  const handleValidation = async (destination: 'cellar' | 'wishlist') => {
    if (isSaving) return;
    setIsSaving(true);
    const bottle = bottlesList[currentIndex];
    if (!bottle) return;
    try {
      // Appeler la vraie logique de sauvegarde
      const { error } = await saveBottle({ ...bottle, destination });
      if (error) {
        Alert.alert('Erreur', 'Impossible de sauvegarder la bouteille');
        setIsSaving(false);
        return;
      }
      // Retirer la bouteille validée du carrousel
      const newList = bottlesList.filter((_, idx) => idx !== currentIndex);
      setBottlesList(newList);
      // Si plus de bouteilles, afficher succès et revenir à la cave
      if (newList.length === 0) {
        Alert.alert('Succès', 'Toutes les bouteilles ont été ajoutées !', [
          { text: 'OK', onPress: () => router.push('/(tabs)') }
        ]);
      } else {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
          setCurrentIndex(0);
        }, 200);
      }
      await refetch();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la bouteille');
    } finally {
      setIsSaving(false);
    }
  };

  // Gestion du like interactif
  const handleToggleFavorite = (idx: number) => {
    setBottlesList(prev => prev.map((b, i) => i === idx ? { ...b, favorite: !b.favorite } : b));
  };

  // Convertir Bottle en Wine pour WineCard
  const bottleToWine = (bottle: Bottle) => ({
    id: bottle.id,
    name: bottle.name,
    domaine: bottle.name,
    vintage: bottle.vintage || 0,
    color: (bottle.type === 'rosé' ? 'rose' : bottle.type) as 'red' | 'white' | 'sparkling' | 'rose',
    region: bottle.region,
    appellation: bottle.appellation || '',
    country: bottle.country,
    grapes: bottle.grapes,
    stock: 1,
    origin: bottle.destination || 'cellar',
    favorite: bottle.favorite || false,
    imageUri: bottle.photo,
    acidity: 0,
    power: 0,
    tannin: 0,
    sweet: 0,
    note: 0,
    description: '',
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const saveBottle = async (bottle: Bottle) => {
    try {
      console.log('=== DÉBUT SAUVEGARDE BOUTEILLE ===');
      console.log('Bouteille à sauvegarder:', bottle);
      
      // Étape 1: Récupérer l'ID de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié.');
      }
      
      console.log('Utilisateur connecté:', user.id);
      let wineId = '';

      // Étape 2: Vérifier si un vin similaire existe déjà dans la table principale `wine`
      console.log('Recherche du vin existant...');
      const { data: existingWines, error: searchError } = await supabase
        .from('wine')
        .select('id')
        .eq('name', bottle.name)
        .eq('year', bottle.vintage)
        .limit(1);

      if (searchError) {
        console.error('Erreur lors de la recherche:', searchError);
        throw searchError;
      }

      console.log('Vins existants trouvés:', existingWines);

      if (existingWines && existingWines.length > 0) {
        // Le vin existe, on récupère son ID
        wineId = existingWines[0].id;
        console.log('Vin existant trouvé, ID:', wineId);
      } else {
        console.log('Vin non trouvé, création d\'un nouveau vin...');
        // Le vin n'existe pas, on le crée dans la table `wine`
        
        // 2a. Uploader la photo et récupérer l'URL
        let image_url: string | undefined = undefined;
        if (bottle.photo) {
          try {
            const photoPath = `public/${user.id}/${Date.now()}-${bottle.id}.jpg`;
            const response = await fetch(bottle.photo);
            const blob = await response.blob();
            const { error: uploadError } = await supabase.storage
              .from('wines')
              .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: false });
            if (uploadError) {
              console.error('Erreur upload photo:', uploadError);
              throw uploadError;
            }
            image_url = supabase.storage.from('wines').getPublicUrl(photoPath).data.publicUrl;
            console.log('Photo uploadée:', image_url);
          } catch (err) {
            console.error('Erreur lors de l\'upload de la photo:', err);
          }
        }

        // 2b. Créer ou récupérer le producteur (utiliser le nom du domaine/domaine)
        console.log('Gestion du producteur...');
        let producerId = '';
        const producerName = bottle.appellation || bottle.name; // Utiliser l'appellation si disponible, sinon le nom du vin
        const { data: existingProducer, error: producerSearchError } = await supabase
          .from('producer')
          .select('id')
          .eq('name', producerName)
          .limit(1);

        if (producerSearchError) {
          console.error('Erreur recherche producteur:', producerSearchError);
          throw producerSearchError;
        }

        if (existingProducer && existingProducer.length > 0) {
          producerId = existingProducer[0].id;
          console.log('Producteur existant trouvé:', producerId);
        } else {
          console.log('Création d\'un nouveau producteur...');
          // Créer un nouveau producteur
          const { data: newProducer, error: producerInsertError } = await supabase
            .from('producer')
            .insert({ name: producerName })
            .select('id')
            .single();

          if (producerInsertError) {
            console.error('Erreur création producteur:', producerInsertError);
            throw producerInsertError;
          }
          producerId = newProducer.id;
          console.log('Nouveau producteur créé:', producerId);
        }

        // 2c. Créer ou récupérer le pays
        console.log('Gestion du pays...');
        let countryId = '';
        const { data: existingCountry, error: countrySearchError } = await supabase
          .from('country')
          .select('id')
          .eq('name', bottle.country)
          .limit(1);

        if (countrySearchError) {
          console.error('Erreur recherche pays:', countrySearchError);
          throw countrySearchError;
        }

        if (existingCountry && existingCountry.length > 0) {
          countryId = existingCountry[0].id;
          console.log('Pays existant trouvé:', countryId);
        } else {
          console.log('Création d\'un nouveau pays...');
          // Créer un nouveau pays
          const { data: newCountry, error: countryInsertError } = await supabase
            .from('country')
            .insert({ name: bottle.country, flag_emoji: '🏳️' })
            .select('id')
            .single();

          if (countryInsertError) {
            console.error('Erreur création pays:', countryInsertError);
            throw countryInsertError;
          }
          countryId = newCountry.id;
          console.log('Nouveau pays créé:', countryId);
        }

        // 2d. Insérer le nouveau vin avec toutes les infos OCR enrichies
        const { data: newWine, error: insertWineError } = await supabase
          .from('wine')
          .insert({
            name: bottle.name,
            year: bottle.vintage,
            wine_type: bottle.type === 'rosé' ? 'rose' : bottle.type,
            region: bottle.region,
            producer_id: producerId,
            country_id: countryId,
            image_uri: image_url,
            grapes: bottle.grapes && bottle.grapes.length > 0 ? bottle.grapes : null,
          })
          .select('id')
          .single();
        if (insertWineError) {
          console.error('Erreur création vin:', insertWineError);
          throw insertWineError;
        }
        wineId = newWine.id;
        console.log('Nouveau vin créé, ID:', wineId);
      }

      // Étape 3: Lier le vin à l'utilisateur dans user_wine
      // Vérifier si une entrée existe déjà pour ce user_id et wine_id
      const { data: existingUserWine, error: userWineCheckError } = await supabase
        .from('user_wine')
        .select('user_id, wine_id, amount, rating, liked, origin')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
        .limit(1);
      if (userWineCheckError) {
        console.error('Erreur lors de la vérification user_wine:', userWineCheckError);
        throw userWineCheckError;
      }
      if (existingUserWine && existingUserWine.length > 0) {
        Alert.alert(
          'Vin déjà présent',
          'Ce vin existe déjà dans votre cave ou liste d\'envie. Voulez-vous mettre à jour la fiche (stock, infos, photo) ?',
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Mettre à jour',
              onPress: async () => {
                // Mettre à jour l'entrée existante (exemple : augmenter le stock ou mettre à jour les infos)
                const updateData: any = {
                  amount: bottle.destination === 'cellar' ? (existingUserWine[0].amount + 1) : existingUserWine[0].amount,
                  origin: bottle.destination,
                  liked: bottle.favorite ?? existingUserWine[0].liked,
                  // Ajoute d'autres champs à mettre à jour si besoin
                };
                const { error: updateError } = await supabase
                  .from('user_wine')
                  .update(updateData)
                  .eq('user_id', user.id)
                  .eq('wine_id', wineId);
                if (updateError) {
                  console.error('Erreur lors de la mise à jour user_wine:', updateError);
                  throw updateError;
                }
                Alert.alert('Fiche mise à jour', 'Le vin a été mis à jour dans votre cave ou liste d\'envie.');
              },
            },
          ]
        );
        return { error: 'duplicate' };
      }
      // Si pas de doublon, insérer normalement
      const userWineData = {
        user_id: user.id,
        wine_id: wineId,
        amount: bottle.destination === 'cellar' ? 1 : 0,
        rating: null,
        liked: bottle.favorite ?? false,
        origin: bottle.destination,
      };
      console.log('Données user_wine:', userWineData);
      const { error: userWineError } = await supabase
        .from('user_wine')
        .insert(userWineData);
      if (userWineError) {
        console.error('Erreur liaison user_wine:', userWineError);
        throw userWineError;
      }

      console.log('Vin lié à l\'utilisateur avec succès');

      // Étape 4 (Optionnel): Enregistrer un événement dans l'historique
      console.log('Ajout de l\'événement historique...');
      const historyData = {
        user_id: user.id,
        wine_id: wineId,
        event_type: 'added',
        new_amount: 1
      };
      console.log('Données historique:', historyData);
      
      const { error: historyError } = await supabase.from('wine_history').insert(historyData);
      
      if (historyError) {
        console.error('Erreur historique (non bloquante):', historyError);
        // Ne pas faire planter si l'historique échoue
      } else {
        console.log('Événement historique ajouté');
      }

      console.log('=== FIN SAUVEGARDE BOUTEILLE - SUCCÈS ===');
      return { error: null };

    } catch (error) {
      console.error('=== ERREUR SAUVEGARDE BOUTEILLE ===');
      console.error('Erreur détaillée lors de la sauvegarde:', error);
      return { error: error as Error };
    }
  };

  if (bottlesList.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Aucune bouteille à valider.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header custom */}
      <View style={styles.headerCustom}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerCounter}>{currentIndex + 1} / {bottlesList.length}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {bottlesList.map((bottle, idx) => (
          <View key={bottle.id} style={{ width: screenWidth, justifyContent: 'center', alignItems: 'center' }}>
            <WineCard
              wine={bottleToWine(bottle)}
              showStockButtons={false}
              onPress={() => {}}
              onToggleFavorite={() => handleToggleFavorite(idx)}
            />
            <View style={styles.validationContainer}>
              <Text style={styles.validationQuestion}>
                Que souhaitez-vous faire avec cette bouteille ?
              </Text>
              <View style={styles.validationButtons}>
                <TouchableOpacity 
                  style={[styles.validationButton, styles.acceptButton]}
                  onPress={() => handleValidation('cellar')}
                  disabled={isSaving}
                >
                  <Ionicons name="wine" size={32} color="#FFF" />
                  <Text style={styles.validationButtonText}>Ma cave</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.validationButton, styles.rejectButton]}
                  onPress={() => handleValidation('wishlist')}
                  disabled={isSaving}
                >
                  <Ionicons name="heart" size={32} color="#FF4F8B" />
                  <Text style={styles.validationButtonText}>Liste d'envie</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const unstable_settings = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 0,
  },
  headerCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCounter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  validationContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  validationQuestion: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  validationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  validationButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  acceptButton: {
    backgroundColor: '#F6A07A',
  },
  rejectButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 2,
    borderColor: '#FF4F8B',
  },
  validationButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
}); 