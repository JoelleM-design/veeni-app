import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
  
  // Récupérer les vins de l'ami pour calculer sa préférence
  const [friendWines, setFriendWines] = useState<any[]>([]);
  const [winesLoading, setWinesLoading] = useState(false);

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

  // Récupérer les vins de l'ami pour calculer sa préférence
  useEffect(() => {
    const fetchFriendWines = async () => {
      if (!friend?.id) return;

      setWinesLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_wine')
          .select(`
            id,
            wine_id,
            wine (
              id,
              wine_type
            )
          `)
          .eq('user_id', friend.id)
          .eq('origin', 'cellar');

        if (error) {
          console.error('Erreur récupération vins ami:', error);
        } else {
          setFriendWines(data || []);
        }
      } catch (err) {
        console.error('Erreur inattendue vins ami:', err);
      } finally {
        setWinesLoading(false);
      }
    };

    fetchFriendWines();
  }, [friend?.id]);

  // Calculer la préférence de l'ami
  const friendPreference = useMemo(() => {
    if (!friendWines || friendWines.length === 0) return null;
    
    const colorCounts = friendWines.reduce((acc, wine) => {
      const color = wine.wine?.wine_type;
      if (color) {
        acc[color] = (acc[color] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostCommonColor = Object.entries(colorCounts).reduce((a, b) => 
      colorCounts[a[0]] > colorCounts[b[0]] ? a : b
    )?.[0];

    return mostCommonColor;
  }, [friendWines]);

  // Icônes pour les couleurs
  const colorIcons = {
    red: <Ionicons name="wine" size={20} color="#8B0000" />,
    white: <Ionicons name="wine" size={20} color="#F5F5DC" />,
    rose: <Ionicons name="wine" size={20} color="#FFB6C1" />,
    sparkling: <Ionicons name="wine" size={20} color="#FFD700" />,
  };

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
          {!winesLoading && friendWines && friendWines.length > 0 && friendPreference ? (
            <View style={styles.preferenceContainer}>
              <Text style={styles.userPreference}>
                A une préférence pour le vin{' '}
              </Text>
              <View style={styles.preferenceIcon}>
                {colorIcons[friendPreference as keyof typeof colorIcons]}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.total_bottles_in_cellar || 0)}
              </Text>
              <Text style={styles.statLabel}>En cave</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.wishlist_count || 0)}
              </Text>
              <Text style={styles.statLabel}>À acheter</Text>
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
  preferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  userPreference: {
    fontSize: 14,
    color: '#999',
  },
  preferenceIcon: {
    marginLeft: 4,
  },
}); 