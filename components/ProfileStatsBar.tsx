import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileStats } from '../hooks/useProfileStats';
import { useUser } from '../hooks/useUser';

interface ProfileStatsBarProps {
  style?: any; // No longer takes stats as prop
  userId?: string; // ID de l'utilisateur dont on affiche les stats
  viewerId?: string; // ID de l'utilisateur qui regarde (pour les permissions)
}

export default function ProfileStatsBar({ style, userId, viewerId }: ProfileStatsBarProps) {
  const router = useRouter();
  const { user } = useUser();
  const targetUserId = userId || user?.id || null;
  const { stats: profileStats } = useProfileStats(targetUserId, viewerId);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => {
            if (targetUserId) {
              router.push({
                pathname: '/wines-with-memories',
                params: {
                  userId: targetUserId,
                  viewerId: viewerId || user?.id
                }
              });
            }
          }}
        >
          <Text style={styles.statNumber}>{profileStats?.memoriesCount ?? 0}</Text>
          <Text style={styles.statLabel}>Souvenirs</Text>
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats?.inspiredCount ?? 0}</Text>
          <Text style={styles.statLabel}>Inspirés par vous</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats?.tastedCount ?? 0}</Text>
          <Text style={styles.statLabel}>Dégustés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profileStats?.favoritesCount ?? 0}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
}); 