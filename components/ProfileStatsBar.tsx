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
      <View style={styles.statsOutlineBox}>
        <View style={styles.statsRowOutline}>
          {/* Dégustés */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTastings}</Text>
            <Text style={styles.statLabel}> dégustés</Text>
          </View>
          <View style={styles.separator} />
          {/* Favoris */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favorite_wines_count}</Text>
            <Text style={styles.statLabel}> favoris</Text>
          </View>
          <View style={styles.separator} />
          {/* Partagés */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.shared_wines_count}</Text>
            <Text style={styles.statLabel}> partagés</Text>
          </View>
          <View style={styles.separator} />
          {/* Commun */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.shared_wines_with_friends}</Text>
            <Text style={styles.statLabel}> commun</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 2,
  },
  statLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: 0.1,
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: '#555',
    marginHorizontal: 10,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  statsContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  statsOutlineBox: {
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'center',
    width: 350,
  },
  statsRowOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    minHeight: 40,
    paddingHorizontal: 8,
  },
}); 