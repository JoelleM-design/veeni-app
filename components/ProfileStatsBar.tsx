import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStats } from '../hooks/useStats';
import { useWineHistory } from '../hooks/useWineHistory';

interface ProfileStatsBarProps {
  style?: any; // No longer takes stats as prop
}

export default function ProfileStatsBar({ style }: ProfileStatsBarProps) {
  const { stats, isLoading, error } = useStats();
  const { tastedWines } = useWineHistory();
  
  // Calculer le total des dégustations comme dans l'onglet "Dégustés"
  const totalTastings = useMemo(() => {
    return tastedWines.reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
  }, [tastedWines]);
  
  console.log('🔄 ProfileStatsBar: isLoading =', isLoading, 'stats =', stats, 'error =', error);
  console.log('🔄 ProfileStatsBar: totalTastings calculé =', totalTastings, 'tastedWines =', tastedWines.length);

  // Forcer la mise à jour du composant quand les stats changent
  useEffect(() => {
    if (stats) {
      console.log('🔄 ProfileStatsBar: Stats mises à jour:', {
        totalBottlesInCellar: stats.total_bottles_in_cellar,
        favoriteWinesCount: stats.favorite_wines_count,
        totalTastedWines: totalTastings, // Utiliser notre calcul local
        sharedWinesWithFriends: stats.shared_wines_with_friends
      });
    }
  }, [stats, totalTastings]);

  if (isLoading || !stats) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total_bottles_in_cellar}</Text>
          <Text style={styles.statLabel}>Vins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.wishlist_count}</Text>
          <Text style={styles.statLabel}>Envies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalTastings}</Text>
          <Text style={styles.statLabel}>Dégustés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.favorite_wines_count}</Text>
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