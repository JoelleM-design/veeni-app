import { supabase } from './supabase';

export interface FriendLite {
  id: string;
  first_name: string;
  avatar?: string;
}

export interface SocialData {
  origin?: { type: 'cave' | 'wishlist', friend: FriendLite };
  alsoInCave: FriendLite[];
  alsoInWishlist: FriendLite[];
  alsoTasted: FriendLite[];
  inspiredByMe: FriendLite[];
}

/**
 * Construit les données sociales pour un vin donné
 * @param wineId ID du vin
 * @param viewerUserId ID de l'utilisateur qui consulte
 * @param contextOwnerUserId ID du propriétaire du contexte (peut être différent du viewer)
 * @returns Données sociales contextuelles
 */
export async function buildSocialData(
  wineId: string, 
  viewerUserId: string, 
  contextOwnerUserId: string
): Promise<SocialData> {
  try {
    // Récupérer les amis du viewer (bidirectionnel)
    const [fFrom, fTo] = await Promise.all([
      supabase.from('friend').select('friend_id').eq('user_id', viewerUserId).eq('status', 'accepted'),
      supabase.from('friend').select('user_id').eq('friend_id', viewerUserId).eq('status', 'accepted')
    ]);

    if (fFrom.error || fTo.error) {
      console.error('Erreur lors de la récupération des amis:', fFrom.error || fTo.error);
      return {
        alsoInCave: [],
        alsoInWishlist: [],
        alsoTasted: [],
        inspiredByMe: []
      };
    }

    const friendIds = Array.from(new Set([
      ...(fFrom.data || []).map((r: any) => r.friend_id),
      ...(fTo.data || []).map((r: any) => r.user_id)
    ]));

    console.log('🔍 buildSocialData: Amis trouvés:', friendIds);

    // Récupérer les détails des amis
    const { data: friendsData, error: friendsError } = await supabase
      .from('User')
      .select('id, first_name, avatar')
      .in('id', friendIds);

    if (friendsError) {
      console.error('Erreur lors de la récupération des détails des amis:', friendsError);
      return {
        alsoInCave: [],
        alsoInWishlist: [],
        alsoTasted: [],
        inspiredByMe: []
      };
    }

    const friendMap = new Map<string, FriendLite>();
    friendsData?.forEach(friend => {
      friendMap.set(friend.id, {
        id: friend.id,
        first_name: friend.first_name,
        avatar: friend.avatar
      });
    });

    // Si c'est un vin OCR (ID commence par 'ocr-'), ne pas essayer de récupérer les données des amis
    let friendWines: any[] = [];
    let friendWinesError: any = null;
    
    if (!wineId.startsWith('ocr-')) {
      const { data, error } = await supabase
        .from('user_wine')
        .select('user_id, origin')
        .eq('wine_id', wineId)
        .in('user_id', friendIds);
      
      friendWines = data || [];
      friendWinesError = error;
    } else {
      console.log('🍷 Vin OCR détecté, pas de récupération des données des amis');
    }

    if (friendWinesError) {
      console.error('Erreur lors de la récupération des vins des amis:', friendWinesError);
    } else {
      console.log('🔍 buildSocialData: Vins des amis trouvés:', friendWines);
    }

    // Récupérer les dégustations des amis (seulement si ce n'est pas un vin OCR)
    let friendTastings: any[] = [];
    let friendTastingsError: any = null;
    
    if (!wineId.startsWith('ocr-')) {
      const { data, error } = await supabase
        .from('wine_history')
        .select('user_id')
        .eq('wine_id', wineId)
        .eq('event_type', 'tasted')
        .in('user_id', friendIds);
      
      friendTastings = data || [];
      friendTastingsError = error;
    } else {
      console.log('🍷 Vin OCR détecté, pas de récupération des dégustations des amis');
    }

    if (friendTastingsError) throw friendTastingsError;

    // Récupérer les vins inspirés par le viewer (seulement si ce n'est pas un vin OCR)
    let inspiredWines: any[] = [];
    let inspiredWinesError: any = null;
    
    if (!wineId.startsWith('ocr-')) {
      const { data, error } = await supabase
        .from('user_wine')
        .select('user_id')
        .eq('wine_id', wineId)
        .eq('source_user_id', viewerUserId)
        .in('user_id', friendIds);
      
      inspiredWines = data || [];
      inspiredWinesError = error;
    } else {
      console.log('🍷 Vin OCR détecté, pas de récupération des vins inspirés');
    }

    if (inspiredWinesError) {
      console.error('Erreur lors de la récupération des vins inspirés:', inspiredWinesError);
    } else {
      console.log('🔍 buildSocialData: Vins inspirés trouvés:', inspiredWines);
    }

    // Construire les données sociales
    const socialData: SocialData = {
      alsoInCave: [],
      alsoInWishlist: [],
      alsoTasted: [],
      inspiredByMe: []
    };

    // Origine du vin (si le contexte vient d'un ami ET que ce n'est pas le même utilisateur)
    if (contextOwnerUserId !== viewerUserId) {
      const ownerWine = friendWines?.find(fw => fw.user_id === contextOwnerUserId);
      if (ownerWine) {
        const owner = friendMap.get(contextOwnerUserId);
        if (owner) {
          socialData.origin = {
            type: ownerWine.origin === 'wishlist' ? 'wishlist' : 'cave',
            friend: owner
          };
        }
      }
    }

    // Vins en commun (exclure le propriétaire du contexte s'il est différent)
    friendWines?.forEach(fw => {
      const friend = friendMap.get(fw.user_id);
      if (!friend || fw.user_id === contextOwnerUserId) return;

      if (fw.origin === 'cellar') {
        socialData.alsoInCave.push(friend);
      } else if (fw.origin === 'wishlist') {
        socialData.alsoInWishlist.push(friend);
      }
    });

    // Dégustations communes (exclure le propriétaire du contexte s'il est différent)
    friendTastings?.forEach(ft => {
      const friend = friendMap.get(ft.user_id);
      if (friend && 
          ft.user_id !== contextOwnerUserId && 
          !socialData.alsoTasted.some(f => f.id === friend.id)) {
        socialData.alsoTasted.push(friend);
      }
    });

    // Vins inspirés par le viewer
    inspiredWines?.forEach(iw => {
      const friend = friendMap.get(iw.user_id);
      if (friend) {
        socialData.inspiredByMe.push(friend);
      }
    });

    return socialData;
  } catch (error) {
    console.error('Erreur lors de la construction des données sociales:', error);
    return {
      alsoInCave: [],
      alsoInWishlist: [],
      alsoTasted: [],
      inspiredByMe: []
    };
  }
}

