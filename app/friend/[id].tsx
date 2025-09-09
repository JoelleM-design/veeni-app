import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../hooks/useUser';
import { useUserStats } from '../../hooks/useUserStats';
import { supabase } from '../../lib/supabase';

interface Friend {
  id: string;
  first_name: string;
  email: string;
  avatar?: string;
  created_at: string;
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
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.total_bottles_in_cellar || 0)}
              </Text>
              <Text style={styles.statLabel}>Vins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.wishlist_count || 0)}
              </Text>
              <Text style={styles.statLabel}>Envies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.total_tasted_wines || 0)}
              </Text>
              <Text style={styles.statLabel}>Dégustés</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.favorite_wines_count || 0)}
              </Text>
              <Text style={styles.statLabel}>Favoris</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vins favoris</Text>
          {statsLoading ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : (friendStats?.favorite_wines_count || 0) > 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="heart" size={48} color="#ff6b6b" />
              <Text style={styles.emptyText}>
                {friendStats?.favorite_wines_count} vin{friendStats?.favorite_wines_count > 1 ? 's' : ''} marqué{friendStats?.favorite_wines_count > 1 ? 's' : ''} comme favori{friendStats?.favorite_wines_count > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="heart-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>Aucun vin favori pour le moment</Text>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
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
}); 