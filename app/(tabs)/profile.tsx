import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileStatsBar } from '../../components/ProfileStatsBar';
import { SharedCaveInfo } from '../../components/SharedCaveInfo';
import { WineCard } from '../../components/WineCard';
import { Spacing, Typography, VeeniColors } from '../../constants/Colors';

import * as Contacts from 'expo-contacts';
import * as Sharing from 'expo-sharing';
import { useFriends } from '../../hooks/useFriends';
import { useProfileStats } from '../../hooks/useProfileStats';
import { useUser } from '../../hooks/useUser';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWines } from '../../hooks/useWines';
import { supabase } from '../../lib/supabase';

const HEADER_MAX_HEIGHT = 280; // Hauteur maximale du header
const HEADER_MIN_HEIGHT = 110; // Hauteur minimale du header (barre de navigation + search bar)
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ProfileScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { wines, loading: winesLoading, error: winesError } = useWines();
  const { user, loading: userLoading, error: userError, updateUser, updateAvatar } = useUser();
  const { stats: profileStats, loading: statsLoading, error: statsError } = useProfileStats(user?.id);
  const { history: wineHistory, loading: historyLoading, getRecentTastings } = useWineHistory();

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [contactsPermission, setContactsPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Animations pour le header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE + 60],
    extrapolate: 'clamp',
  });

  // Utiliser l'historique des dégustations depuis le nouveau hook
  const tastingHistory = useMemo(() => {
    if (!wineHistory || !wines) return [];
    
    const recentTastings = getRecentTastings(20); // Limiter à 20 dégustations récentes
    
    return recentTastings.map(tasting => {
      // Trouver le vin correspondant
      const wine = wines.find(w => w.id === tasting.wineId);
      if (!wine) return null;
      
      return {
        wine,
        date: tasting.eventDate,
        type: tasting.eventType as 'tasted' | 'removed',
        rating: tasting.rating,
        previousStock: tasting.previousAmount
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [wineHistory, wines, getRecentTastings]);

  // Calcul de la préférence dynamique basée sur les vins
  const userPreference = useMemo(() => {
    if (!wines || wines.length === 0) return null;
    
    const cellarWines = wines.filter(wine => wine.origin === 'cellar');
    if (cellarWines.length === 0) return null;
    
    // Compter les vins par couleur
    const colorCount = cellarWines.reduce((acc, wine) => {
      acc[wine.color] = (acc[wine.color] || 0) + wine.stock;
      return acc;
    }, {} as Record<string, number>);
    
    // Trouver la couleur dominante
    const dominantColor = Object.entries(colorCount).reduce((a, b) => 
      (colorCount[a[0]] || 0) > (colorCount[b[0]] || 0) ? a : b
    )[0];
    
    return dominantColor;
  }, [wines]);

  // Icônes pour les couleurs de vin
  const colorIcons = {
    red: <Ionicons name="wine" size={16} color="#FF4F8B" />,
    white: <Ionicons name="cafe" size={16} color="#FFF8DC" />,
    rose: <Ionicons name="color-palette" size={16} color="#FFB6C1" />,
    sparkling: <Ionicons name="wine" size={16} color="#FFD700" />,
  };

  // Labels pour les couleurs
  const colorLabels = {
    red: 'rouge',
    white: 'blanc',
    rose: 'rosé',
    sparkling: 'effervescent',
  };

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

  // const handleFriendsPress = () => {
  //   router.push('/friends');
  // };

  const handleSettingsPress = () => {
    router.push('/settings');
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

  // Fonction pour demander les permissions des contacts
  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status);
      if (status === 'granted') {
        // Recharger les suggestions après avoir obtenu les permissions
        setTimeout(() => {
          loadSuggestedFriends();
        }, 500);
      }
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permissions contacts:', error);
      return false;
    }
  };

  // Fonction pour charger les amis suggérés
  const loadSuggestedFriends = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Début du chargement des amis suggérés pour user:', user.id);
      
      // Vérifier les permissions d'abord
      const { status } = await Contacts.getPermissionsAsync();
      console.log('📱 Statut des permissions contacts:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permissions contacts non accordées');
        setSuggestedFriends([]);
        return;
      }
      
      // Récupérer les contacts
      const { data: contacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.FirstName, Contacts.Fields.LastName],
      });

      console.log('📞 Contacts récupérés:', contacts?.data?.length || 0);
      
      if (contacts && contacts.data && contacts.data.length > 0) {
        // Afficher quelques contacts pour debug
        const sampleContacts = contacts.data.slice(0, 3);
        console.log('📋 Exemples de contacts:', sampleContacts.map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          emails: c.emails?.map(e => e.email)
        })));
        
        // Récupérer les utilisateurs Veeni
        const { data: users, error } = await supabase
          .from('User')
          .select('id, first_name, email, avatar')
          .neq('id', user.id);

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          setSuggestedFriends([]);
          return;
        }

        console.log('👥 Utilisateurs Veeni trouvés:', users?.length || 0);
        
        if (users && users.length > 0) {
          // Afficher quelques utilisateurs pour debug
          const sampleUsers = users.slice(0, 3);
          console.log('👤 Exemples d\'utilisateurs:', sampleUsers.map(u => ({
            name: u.first_name,
            email: u.email
          })));
          
          // Filtrer les utilisateurs qui sont dans les contacts
          const suggested = users.filter(user => 
            contacts.data.some(contact => 
              contact.emails && contact.emails.some(email => 
                email.email?.toLowerCase() === user.email?.toLowerCase()
              )
            )
          );
          
          console.log('✅ Amis suggérés trouvés:', suggested.length);
          if (suggested.length > 0) {
            console.log('🎯 Amis suggérés:', suggested.map(s => s.first_name));
          }
          
          setSuggestedFriends(suggested);
        } else {
          console.log('❌ Aucun utilisateur Veeni trouvé');
          setSuggestedFriends([]);
        }
      } else {
        console.log('❌ Aucun contact trouvé');
        setSuggestedFriends([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des amis suggérés:', error);
      setSuggestedFriends([]);
    }
  };

  // Fonction pour partager l'app
  const handleShareApp = async () => {
    try {
      const shareUrl = 'https://veeni.app'; // URL de l'app
      const message = 'Découvre Veeni, l\'app pour gérer ta cave à vin ! 🍷';
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUrl, {
          mimeType: 'text/plain',
          dialogTitle: 'Partager Veeni',
        });
      } else {
        // Fallback pour les plateformes qui ne supportent pas Sharing
        Alert.alert('Partage', `${message}\n\n${shareUrl}`);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      // Fallback simple
      Alert.alert(
        'Partager Veeni', 
        'Découvre Veeni, l\'app pour gérer ta cave à vin ! 🍷\n\nhttps://veeni.app'
      );
    }
  };

  // Charger les permissions et amis suggérés au montage
  useEffect(() => {
    checkContactsPermission();
    loadSuggestedFriends();
  }, [user]);

  // Charger les IDs des amis
  const loadFriendIds = async () => {
    if (!user) return;
    
    try {
      setFriendsLoading(true);
      const { data, error } = await supabase
        .from('friend')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Erreur lors du chargement des amis:', error);
        return;
      }

      const ids = data?.map(f => f.friend_id) || [];
      setFriendIds(ids);
      console.log('🔍 IDs des amis chargés:', ids);
    } catch (error) {
      console.error('Erreur lors du chargement des IDs amis:', error);
    } finally {
      setFriendsLoading(false);
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

  // Filtrer les vins récents (dégustés)
  const recentWines = wines?.filter(wine => wine.origin === 'cellar').slice(0, 5) || [];

  // Suggestions d'amis : utilisateurs non amis et non soi-même
  // useEffect(() => {
  //   async function fetchSuggestions() {
  //     if (!user) return;
  //     setSuggestionsLoading(true);
  //     try {
  //       const { data, error } = await supabase
  //         .from('User')
  //         .select('id, name, first_name, email, avatar')
  //         .neq('id', user.id);
  //       if (error) throw error;
  //       // Exclure déjà amis
  //       const notFriends = (data || []).filter(u => !(user.friends || []).includes(u.id));
  //       setSuggestions(notFriends);
  //     } catch (e) {
  //       setSuggestions([]);
  //     } finally {
  //       setSuggestionsLoading(false);
  //     }
  //   }
  //   fetchSuggestions();
  // }, [user]);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixe */}
      <View style={styles.fixedHeader}>
        <View style={{flex:1}} />
        <TouchableOpacity 
          style={styles.headerIconRight}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section profil */}
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
          {userPreference ? (
            <View style={styles.preferenceContainer}>
              <Text style={styles.userPreference}>
                A une préférence pour le vin{' '}
              </Text>
              <View style={styles.preferenceIcon}>
                {colorIcons[userPreference as keyof typeof colorIcons]}
              </View>
              <Text style={styles.userPreference}>
                {' '}{colorLabels[userPreference as keyof typeof colorLabels]}
              </Text>
            </View>
          ) : (
            <Text style={styles.userPreference}>Amateur de vins</Text>
          )}
        </View>

        {/* Barre de statistiques */}
        <View style={styles.statsBar}>
          <ProfileStatsBar stats={profileStats} loading={statsLoading} />
        </View>

        {/* Section Amis */}
        <View style={styles.section}>
          {/* Bouton Inviter des amis */}
          <View style={styles.inviteButtonContainer}>
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={handleShareApp}
            >
              <Ionicons name="add" size={20} color="#222" />
              <Text style={styles.inviteButtonText}>Inviter des amis</Text>
            </TouchableOpacity>
          </View>

          {/* Section Amis */}
          <View style={styles.friendsSubsection}>
            <Text style={styles.subsectionTitle}>Amis</Text>
            {friends.length === 0 ? (
              <Text style={styles.emptyFriendsText}>
                Tu n'as pas encore d'amis sur Veeni. Invite-en pour partager ta passion !
              </Text>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <View key={friend.id} style={styles.friendItem}>
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
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section Amis suggérés */}
          <View style={styles.friendsSubsection}>
            <Text style={styles.subsectionTitle}>Suggestions d'amis</Text>
            {contactsPermission !== 'granted' ? (
              <View style={styles.contactsPermissionBox}>
                <Text style={styles.contactsPermissionText}>
                  Active l'accès à tes contacts pour retrouver tes amis déjà sur Veeni.
                </Text>
                <TouchableOpacity 
                  style={styles.contactsPermissionButton}
                  onPress={requestContactsPermission}
                >
                  <Text style={styles.contactsPermissionButtonText}>
                    Activer l'accès aux contacts
                  </Text>
                </TouchableOpacity>
              </View>
            ) : suggestedFriends.length === 0 ? (
              <Text style={styles.emptySuggestionsText}>
                Aucun de tes contacts n'est encore sur Veeni.
              </Text>
            ) : (
              <View style={styles.suggestedFriendsList}>
                {suggestedFriends.map((friend) => (
                  <View key={friend.id} style={styles.suggestedFriendItem}>
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
                    <TouchableOpacity style={styles.addFriendButton}>
                      <Ionicons name="add" size={16} color="#F6A07A" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section historique */}
        {tastingHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des dégustations</Text>
            
            {tastingHistory.map((item, index) => (
              <WineCard
                key={`${item.wine.id}-${index}`}
                wine={item.wine}
                onPress={() => router.push(`/wine/${item.wine.id}`)}
                showStockButtons={false}
                footer={
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyDate}>
                      Dégusté le {new Date(item.date).toLocaleDateString('fr-FR')}
                    </Text>
                    {item.rating && (
                      <Text style={styles.historyRating}>
                        Note : {item.rating}/5
                      </Text>
                    )}
                    {item.type === 'removed' && item.previousStock && (
                      <Text style={styles.historyStock}>
                        Stock précédent : {item.previousStock}
                      </Text>
                    )}
                  </View>
                }
              />
            ))}
          </View>
        )}
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
    paddingBottom: 32,
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
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholderUnified: {
    width: 84,
    height: 84,
    borderRadius: 42,
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
    marginBottom: Spacing.base,
    width: '100%',
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
    fontWeight: Typography.weight.semibold,
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
    color: '#F6A07A',
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterCircleActive: {
    borderColor: '#F6A07A',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: '#F6A07A',
    borderColor: '#F6A07A',
  },
  filterOptionText: {
    color: '#FFF',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#222',
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
    color: '#F6A07A',
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
    backgroundColor: '#F6A07A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  contactsPermissionButtonText: {
    color: '#222',
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
    backgroundColor: '#333',
    borderRadius: 8,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: '#F6A07A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  shareButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6A07A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  inviteButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsSubsection: {
    flex: 1,
    paddingVertical: 16,
  },
  subsectionTitle: {
    color: VeeniColors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
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
    backgroundColor: '#333',
    borderRadius: 8,
  },
  friendAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  addFriendButton: {
    padding: 4,
  },
  emptySuggestionsText: {
    color: VeeniColors.text.tertiary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: 16,
  },
}); 