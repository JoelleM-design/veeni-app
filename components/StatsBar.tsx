import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStats } from '../hooks/useStats';
import { useWineHistory } from '../hooks/useWineHistory';

interface StatsBarProps {
  values: { red: number; white: number; rose: number; sparkling: number; total: number };
  labels?: { red: string; white: string; rose: string; sparkling: string };
  totalLabel?: string;
  style?: any;
}

export const StatsBar: React.FC<StatsBarProps> = ({ values, labels, totalLabel = 'vins', style }) => {
  console.log('🔄 StatsBar: Re-rendu avec valeurs:', values); // Debug log
  
  // Récupérer les stats globales
  const { stats } = useStats();
  const { tastedWines } = useWineHistory();
  
  // Calculer le total des dégustations
  const totalTastings = tastedWines.reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.total_wines || 0}</Text>
          <Text style={styles.statLabel}>Vins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.wishlist_count || 0}</Text>
          <Text style={styles.statLabel}>Envies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalTastings}</Text>
          <Text style={styles.statLabel}>Dégustés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.favorite_wines_count || 0}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
      </View>
    </View>
  );
};

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
}); 