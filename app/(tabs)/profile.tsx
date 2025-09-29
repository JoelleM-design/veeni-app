import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileStatsBar from '../../components/ProfileStatsBar';
import { SharedCaveInfo } from '../../components/SharedCaveInfo';
import { WinePreferenceDisplay } from '../../components/WinePreferenceDisplay';
import { Spacing, Typography, VeeniColors } from '../../constants/Colors';
import { useSocialStats } from '../../hooks/useSocialStats';

import * as Contacts from 'expo-contacts';
import { useFriends } from '../../hooks/useFriends';
import { useStats } from '../../hooks/useStats';
import { useUser } from '../../hooks/useUser';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWines } from '../../hooks/useWines';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  
  // Hooks optimisés avec chargement conditionnel
  const { user, loading: userLoading, error: userError, updateUser, updateAvatar } = useUser();
  const { wines, loading: winesLoading, error: winesError } = useWines();
  
  // Charger les stats
  const profileStats = useStats();
  const [socialRefreshKey, setSocialRefreshKey] = useState(0);
  const { stats: socialStats } = useSocialStats(user?.id || null, socialRefreshKey);
  
  // Charger l'historique
  const { history: wineHistory, loading: historyLoading } = useWineHistory();



  // États locaux
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [contactsPermission, setContactsPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [suggestedFriends, setSuggestedFriends] = useState<Array<{
    id: string;
    first_name?: string;
    email?: string;
    avatar?: string;
  }>>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: string;
    first_name?: string;
    email?: string;
    avatar?: string;
  }>>([]);

  // Historique des dégustations simplifié
  const tastingHistory: any[] = [];


  const handleAvatarPress = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à votre bibliothèque de photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Ouvrir le sélecteur d'images avec la syntaxe correcte
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        console.log('Photo sélectionnée:', selectedImage.uri);
        
        // Mettre à jour l'avatar dans la base de données
        if (user && updateAvatar) {
          try {
            await updateAvatar(selectedImage.uri);
            Alert.alert('Succès', 'Votre photo de profil a été mise à jour !');
          } catch (updateError) {
            console.error('Erreur lors de la mise à jour de l\'avatar:', updateError);
            Alert.alert(
              'Erreur de sauvegarde',
              'La photo a été sélectionnée mais n\'a pas pu être sauvegardée. Veuillez réessayer.',
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Erreur',
            'Impossible de mettre à jour votre profil. Veuillez réessayer.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de photo:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la sélection de votre photo. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleGoBack = () => {
    router.back();
  };

  // Fonction pour vérifier les permissions des contacts
  const checkContactsPermission = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      setContactsPermission(status);
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions contacts:', error);
      return false;
    }
  };

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status);
      
      if (status === 'granted') {
        await loadSuggestedFriends();
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission contacts:', error);
    }
  };

  // Rafraîchir les suggestions quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      if (contactsPermission === 'granted') {
        // Délai pour éviter de surcharger lors des changements d'onglets rapides
        const timeoutId = setTimeout(() => {
          loadSuggestedFriends();
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }, [contactsPermission])
  );

  const loadSuggestedFriends = async (forceRefresh = false) => {
    if (contactsPermission !== 'granted') return;
    
    try {
      setSuggestionsLoading(true);
      
      // Récupérer les contacts
      const { data: contacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      
      console.log('📞 Contacts récupérés:', contacts?.length || 0);
      
      if (!contacts || contacts.length === 0) {
        console.log('❌ Aucun contact trouvé');
        setSuggestedFriends([]);
        return;
      }

      // Extraire les emails des contacts
      const contactEmails = contacts
        .flatMap(contact => 
          contact.emails?.map(email => email.email?.toLowerCase()).filter(Boolean) || []
        )
        .filter(email => email && email.includes('@'));

      if (contactEmails.length === 0) {
        console.log('❌ Aucun email trouvé dans les contacts');
        setSuggestedFriends([]);
        return;
      }

      // Rechercher les utilisateurs par email
      const { data: users, error } = await supabase
        .from('User')
        .select('id, first_name, email, avatar')
        .in('email', contactEmails)
        .neq('id', user?.id || '');

      if (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        setSuggestedFriends([]);
        return;
      }

      // Filtrer les utilisateurs qui ne sont pas déjà amis (comparaison robuste en string)
      const acceptedSet = new Set((friendIds || []).map(id => String(id)));
      const notFriends = (users || []).filter(u => !acceptedSet.has(String(u.id)));
      
      // Log de débogage pour voir les données exactes
      console.log('🔍 Données des utilisateurs trouvés:', users);
      console.log('🔍 Utilisateurs non amis:', notFriends);
      console.log('🔍 Premier utilisateur suggéré:', notFriends[0]);
      if (notFriends[0]) {
        console.log('🔍 Prénom du premier utilisateur:', notFriends[0].first_name);
        console.log('🔍 Email du premier utilisateur:', notFriends[0].email);
      }
      
      setSuggestedFriends(notFriends);
      
      console.log('✅ Amis suggérés trouvés:', notFriends.length);
    } catch (error) {
      console.error('Erreur lors du chargement des amis suggérés:', error);
      setSuggestedFriends([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Découvre Veeni, l'app pour gérer ta cave à vin et partager avec tes amis ! 🍷\nTélécharge-la ici : https://veeni.app",
        title: "Inviter des amis sur Veeni"
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friend')
        .upsert({ user_id: user?.id, friend_id: friendId, status: 'pending' } as any, { onConflict: 'user_id,friend_id' });

      if (error) {
        console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
        Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'ami');
        return;
      }

      // Marquer comme en attente (sans retirer la suggestion)
      setSentRequests(prev => (prev.includes(friendId) ? prev : [...prev, friendId]));
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'ami');
    }
  };

  const loadFriendIds = async () => {
    if (!user) return;
    
    try {
      setFriendsLoading(true);
      const [fromRes, toRes] = await Promise.all([
        supabase.from('friend').select('friend_id').eq('user_id', user.id).eq('status', 'accepted'),
        supabase.from('friend').select('user_id').eq('friend_id', user.id).eq('status', 'accepted'),
      ]);

      if (fromRes.error) throw fromRes.error;
      if (toRes.error) throw toRes.error;

      const ids = Array.from(new Set<string>([
        ...((fromRes.data || []).map((r: any) => String(r.friend_id))),
        ...((toRes.data || []).map((r: any) => String(r.user_id))),
      ]));
      setFriendIds(ids);
      console.log('🔍 IDs des amis chargés:', ids);
    } catch (error) {
      console.error('Erreur lors du chargement des IDs amis:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Charger les demandes sortantes en attente pour afficher "En attente"
  const loadOutgoingPending = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('friend')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if (error) throw error;
      const ids = (data || []).map((r: any) => String(r.friend_id));
      setSentRequests(ids);
    } catch (e) {
      setSentRequests([]);
    }
  };

  // Fonction pour charger les demandes d'amis reçues (pending)
  const loadPendingRequests = async () => {
    if (!user) return;
    try {
      // On récupère les demandes où l'utilisateur est le destinataire et le statut est 'pending'
      const { data, error } = await supabase
        .from('friend')
        .select('user_id, status, created_at, User:user_id(id, first_name, email, avatar)')
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Erreur lors du chargement des demandes d\'amis:', error);
        setPendingRequests([]);
        return;
      }
      
      if (data) {
        const requests = (data.map(r => r.User).filter(Boolean) as unknown) as Array<{
          id: string;
          first_name?: string;
          email?: string;
          avatar?: string;
        }>;
        setPendingRequests(requests);
        console.log('📨 Demandes d\'amis en attente:', requests.length);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes d\'amis:', error);
      setPendingRequests([]);
    }
  };

  // Fonction pour répondre aux demandes d'amis
  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    if (!user) return;
    
    // Si c'est un refus, afficher une popup de confirmation
    if (!accept) {
      Alert.alert(
        'Refuser la demande d\'ami',
        'Êtes-vous sûr de vouloir refuser cette demande d\'ami ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Refuser',
            style: 'destructive',
            onPress: () => processFriendRequest(requestId, false),
          },
        ]
      );
      return;
    }
    
    // Si c'est une acceptation, traiter directement
    await processFriendRequest(requestId, true);
  };

  // Fonction pour traiter la demande d'ami
  const processFriendRequest = async (requestId: string, accept: boolean) => {
    if (!user) return;
    
    try {
      const newStatus = accept ? 'accepted' : 'rejected';
      
      // Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('friend')
        .update({ status: newStatus })
        .eq('user_id', requestId)
        .eq('friend_id', user.id);
      
      if (error) throw error;
      
      console.log(`✅ Demande d'ami ${accept ? 'acceptée' : 'refusée'} pour:`, requestId);
      
      // Recharger les demandes en attente
      await loadPendingRequests();
      
      // Si acceptée, recharger aussi la liste des amis
      if (accept) {
        await loadFriendIds();
      }
      
    } catch (error) {
      console.error('Erreur lors de la réponse à la demande d\'ami:', error);
      Alert.alert('Erreur', 'Impossible de traiter la demande d\'ami');
    }
  };

  // Utiliser le hook useFriends avec les IDs chargés
  const { friends, loading: friendsLoadingFromHook, error: friendsError } = useFriends(friendIds);

  // Charger les amis quand l'utilisateur change
  useEffect(() => {
    if (user) {
      loadFriendIds();
    }
  }, [user]);

  // Charger les contacts et amis suggérés après le chargement des amis
  useEffect(() => {
    if (user && friendIds.length >= 0) {
      checkContactsPermission().then(hasPermission => {
        if (hasPermission) {
          loadSuggestedFriends();
        }
      });
    }
  }, [user, friendIds]);

  // Charger en plus les demandes sortantes en attente
  useEffect(() => {
    if (user) {
      loadOutgoingPending();
    }
  }, [user]);

  // Abonnement temps réel aux acceptations de nos demandes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('profile-friends-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friend', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const row = payload?.new as any;
        if (!row) return;
        if (row.status === 'accepted') {
          const fid = String(row.friend_id);
          setSentRequests(prev => prev.filter(id => id !== fid));
          setFriendIds(prev => (prev.includes(fid) ? prev : [...prev, fid]));
          setSuggestedFriends(prev => prev.filter(f => f.id !== fid));
        }
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [user]);

  // Charger l'historique de manière différée pour améliorer les performances
  useEffect(() => {
    if (user) {
      loadPendingRequests();
    }
  }, [user, wines]);

  // Filtrer les vins récents (dégustés)
  const recentWines = wines?.filter(wine => wine.origin === 'cellar').slice(0, 5) || [];





  // Afficher une erreur seulement si c'est critique
  if (userError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Erreur : {userError.message}
        </Text>
      </View>
    );
  }

  // Fonction de rafraîchissement pour le pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (contactsPermission === 'granted') {
      await loadSuggestedFriends(true);
    }
  }, [contactsPermission]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={suggestionsLoading}
            onRefresh={onRefresh}
            tintColor={VeeniColors.accent.primary}
            colors={[VeeniColors.accent.primary]}
          />
        }
      >
        {/* Header (non fixe) */}
        <View style={styles.headerContainer}>
          {/* SUPPRIMER LE BOUTON BACK */}
          <View style={{flex: 1}} />
          <TouchableOpacity onPress={handleSettingsPress} style={styles.headerIconRight}>
            <Ionicons name="settings-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* Section profil - Affichage immédiat */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress}>
            <View style={styles.avatarUnified}>
              {userLoading ? (
                <View style={styles.avatarPlaceholderUnified}>
                  <Ionicons name="person" size={32} color="#666" />
                </View>
              ) : user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholderUnified}>
                  <Text style={styles.avatarInitialUnified}>
                    {user?.first_name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>
            {userLoading ? '' : (user?.first_name || 'Utilisateur')}
          </Text>
          {/* Informations de cave partagée */}
          <SharedCaveInfo />
          {/* Préférence dynamique */}
          <WinePreferenceDisplay 
            wines={wines} 
            winesLoading={winesLoading}
            style={styles.preferenceContainer}
            textStyle={styles.userPreference}
            iconStyle={styles.preferenceIcon}
          />
        </View>
        {/* Barre de statistiques */}
        {/* Anciennes stats conservées */}
        <View style={styles.statsBar}>
          <ProfileStatsBar userId={user?.id} viewerId={user?.id} />
        </View>

        {/* Supprimé: bloc de stats sociales dupliquées */}

        

        {/* Section Demandes d'amis */}
        {pendingRequests.length > 0 && (
          <View style={[styles.section, styles.sectionWithSpacing]}>
            <Text style={styles.sectionTitle}>Demandes d'amis ({pendingRequests.length})</Text>
            <View style={styles.friendsList}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.friendItem}>
                  <View style={styles.friendAvatar}>
                    {request.avatar ? (
                      <Image source={{ uri: request.avatar }} style={styles.friendAvatarImage} />
                    ) : (
                      <Text style={styles.friendAvatarInitial}>
                        {request.first_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.friendName}>
                    {request.first_name || request.email || 'Utilisateur inconnu'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#4CAF50',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: {
                          width: 0,
                          height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                      }}
                      onPress={() => handleRespondToRequest(request.id, true)}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#F44336',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: {
                          width: 0,
                          height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                      }}
                      onPress={() => handleRespondToRequest(request.id, false)}
                    >
                      <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section Amis */}
        <View style={[styles.section, styles.sectionWithSpacing]}>
          <Text style={styles.sectionTitle}>Mes amis ({friends.length})</Text>
          <View style={styles.friendsList}>
            {friends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.friendItem}
                onPress={() => router.push(`/friend/${friend.id}`)}
              >
                <View style={styles.friendAvatar}>
                  {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.friendAvatarImage} />
                  ) : (
                    <Text style={styles.friendAvatarInitial}>
                      {friend.first_name?.charAt(0).toUpperCase() || 'A'}
                    </Text>
                  )}
                </View>
                <Text style={styles.friendName}>{friend.first_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Section Suggestions d'amis supprimée selon la demande */}
        {/* BOUTON INVITER DES AMIS - bas de page */}
        <View style={styles.inviteButtonContainerBottom}>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => router.push('/add-friends')}
          >
            <Ionicons name="add" size={20} color="#222" />
            <Text style={styles.inviteButtonText}>Inviter des amis</Text>
          </TouchableOpacity>
        </View>

        {/* Section historique - Chargement différé */}



      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#222',
  },
  headerIconRight: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#222',
  },
  headerIconLeft: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarUnified: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholderUnified: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialUnified: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  userPreference: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  statsBar: {
    marginTop: Spacing.sm,
    marginBottom: 8,
    width: '100%',
  },
  statsContainerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  searchContainer: {
    marginBottom: Spacing.base,
    width: '100%',
  },

  section: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    color: VeeniColors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: '600',
    marginBottom: Spacing.base,
  },
  emptyText: {
    color: VeeniColors.text.tertiary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  filterCircleActive: {
    borderColor: 'transparent',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#444',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#393C40', borderWidth: 0,
    borderColor: 'transparent',
  },
  filterOptionText: {
    color: '#FFF',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  preferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  preferenceIcon: {
    marginHorizontal: 4,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  historyDate: {
    color: '#999',
    fontSize: 14,
  },
  historyStock: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  historyRating: {
    color: '#999',
    fontSize: 14,
  },
  introBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  introBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sharedWinesText: {
    color: VeeniColors.text.primary,
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addFriendsButton: {
    padding: 8,
  },
  contactsPermissionBox: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactsPermissionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactsPermissionText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  contactsPermissionButton: {
    backgroundColor: '#393C40', borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  contactsPermissionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  friendsSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  friendsDescription: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#393C40', borderWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButtonContainer: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 16,
    paddingHorizontal: 32,
    height: 48,
    justifyContent: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  friendsSubsection: {
    flex: 1,
    paddingVertical: 16,
  },
  subsectionTitle: {
    color: VeeniColors.text.primary,
    fontSize: Typography.size.lg,
    fontWeight: '600',
    marginBottom: Spacing.base,
  },
  emptyFriendsText: {
    color: VeeniColors.text.tertiary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestedFriendsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedFriendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  friendAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  addFriendButton: {
    marginLeft: 'auto',
    backgroundColor: '#393C40',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  emptySuggestionsText: {
    color: VeeniColors.text.tertiary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: 16,
  },
  declineButton: {
    marginLeft: 4,
    backgroundColor: 'transparent',
  },
  pendingRequestsList: {
    gap: 12,
  },
  pendingRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent', // plus de fond gris
    borderWidth: 0,
  },
  pendingRequestButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 12,
  },
  pendingRequestButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
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
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF4F8B',
  },
  inviteButtonContainerBottom: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  inviteActionButton: {
    marginLeft: 'auto',
    backgroundColor: '#393C40', borderWidth: 0,
    borderRadius: 22,
  },
  inviteActionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  suggestionsSection: {
    paddingHorizontal: Spacing.base,
    marginTop: 24,
    marginBottom: 24,
  },
  sectionWithSpacing: {
    marginBottom: 32,
  },
  sectionWithHalfSpacing: {
    marginBottom: 16,
  },
}); 