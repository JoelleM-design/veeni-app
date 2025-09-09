import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../hooks/useUser';
import { useUserStats } from '../../hooks/useUserStats';
import { useSharedWines } from '../../hooks/useSharedWines';
import { supabase } from '../../lib/supabase';

interface Friend {
  id: string;
  first_name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

// Fonction utilitaire pour obtenir la couleur du vin
function getWineColor(color: string): string {
  switch (color) {
    case 'red':
      return '#8B0000';
    case 'white':
      return '#F5F5DC';
    case 'rose':
      return '#FFB6C1';
    case 'sparkling':
      return '#FFF8DC';
    default:
      return '#8B0000';
  }
}

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les stats de l'ami
  const { stats: friendStats, isLoading: statsLoading } = useUserStats(friend?.id || null);
  
  // Récupérer les vins en commun
  const { sharedWines, isLoading: sharedWinesLoading } = useSharedWines(friend?.id || null);

  useEffect(() => {
    const fetchFriend = async () => {
      if (!id) {
        setError('ID de l\'ami manquant');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, first_name, email, avatar, created_at')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération de l\'ami:', error);
          setError('Impossible de charger les données de l\'ami');
        } else if (data) {
          setFriend(data);
        } else {
          setError('Ami non trouvé');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'ami:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchFriend();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Ami non trouvé'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profile}>
          <View style={styles.avatarContainer}>
            {friend.avatar ? (
              <Image source={{ uri: friend.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {friend.first_name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{friend.first_name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{friend.email}</Text>
          <Text style={styles.memberSince}>
            Membre depuis {new Date(friend.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {statsLoading ? '...' : (friendStats?.total_wines || 0)}
              </Text>
              <Text style={styles.statLabel}>Vins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {statsLoading ? '...' : (friendStats?.total_tasted_wines || 0)}
              </Text>
              <Text style={styles.statLabel}>Dégustations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {sharedWinesLoading ? '...' : sharedWines.length}
              </Text>
              <Text style={styles.statLabel}>En commun</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vins en commun</Text>
          {sharedWinesLoading ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : sharedWines.length > 0 ? (
            <View style={styles.winesList}>
              {sharedWines.map((wine) => (
                <View key={wine.id} style={styles.wineItem}>
                  <View style={styles.wineInfo}>
                    <Text style={styles.wineName}>{wine.name}</Text>
                    {wine.domaine && (
                      <Text style={styles.wineDomaine}>{wine.domaine}</Text>
                    )}
                    {wine.vintage && (
                      <Text style={styles.wineVintage}>{wine.vintage}</Text>
                    )}
                  </View>
                  <View style={[styles.wineColor, { backgroundColor: getWineColor(wine.color) }]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="wine" size={48} color="#666" />
              <Text style={styles.emptyText}>Aucun vin en commun pour le moment</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  profile: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  winesList: {
    gap: 12,
  },
  wineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  wineInfo: {
    flex: 1,
  },
  wineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  wineDomaine: {
    color: '#999',
    fontSize: 14,
    marginBottom: 2,
  },
  wineVintage: {
    color: '#666',
    fontSize: 12,
  },
  wineColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
}); 