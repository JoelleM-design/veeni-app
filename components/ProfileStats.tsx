import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useProfileStats } from '../hooks/useProfileStats';

interface ProfileStatsProps {
  userId: string;
  viewerId?: string;
  showLabels?: boolean;
  showDetails?: boolean;
}

export function ProfileStats({ 
  userId, 
  viewerId, 
  showLabels = true,
  showDetails = false
}: ProfileStatsProps) {
  const { stats, loading, error } = useProfileStats(userId, viewerId);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#F6A07A" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tastedCount}</Text>
          <Text style={styles.statLabel}>Dégustés</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.favoritesCount}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.wishlistCount}</Text>
          <Text style={styles.statLabel}>Liste d'envie</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.cellarCount}</Text>
          <Text style={styles.statLabel}>Cave</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.memoriesCount}</Text>
          <Text style={styles.statLabel}>Souvenirs</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.inspiredCount}</Text>
          <Text style={styles.statLabel}>Inspirés</Text>
        </View>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Détails des statistiques</Text>
          <Text style={styles.detailsText}>
            • Dégustés: Basés sur wine_history (event_type = 'tasted')
          </Text>
          <Text style={styles.detailsText}>
            • Favoris: Vins marqués comme favoris
          </Text>
          <Text style={styles.detailsText}>
            • Liste d'envie: Vins en liste de souhaits (même si amount = 0)
          </Text>
          <Text style={styles.detailsText}>
            • Cave: Vins en cave (même si amount = 0)
          </Text>
          <Text style={styles.detailsText}>
            • Souvenirs: Souvenirs créés par l'utilisateur
          </Text>
          <Text style={styles.detailsText}>
            • Inspirés: Vins ajoutés par d'autres grâce à vous
          </Text>
        </View>
      )}
      
      {showLabels && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: {stats.tastedCount + stats.favoritesCount + stats.wishlistCount + stats.cellarCount + stats.memoriesCount} interactions
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(246, 160, 122, 0.1)',
    borderRadius: 12,
    margin: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    margin: 8,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F6A07A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 160, 122, 0.3)',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F6A07A',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  totalContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 160, 122, 0.3)',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F6A07A',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
});
