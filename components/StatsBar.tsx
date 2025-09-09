import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatsBarProps {
  values: { red: number; white: number; rose: number; sparkling: number; total: number };
  labels?: { red: string; white: string; rose: string; sparkling: string };
  totalLabel?: string;
  style?: any;
}

export const StatsBar: React.FC<StatsBarProps> = ({ values, labels, totalLabel = 'vins', style }) => {
  console.log('🔄 StatsBar: Re-rendu avec valeurs:', values); // Debug log
  const defaultLabels = {
    red: 'rouges',
    white: 'blancs',
    rose: 'rosés',
    sparkling: 'pétillants',
  };
  const l = labels || defaultLabels;
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.statsOutlineBox, style]}>
        <View style={styles.statsRowOutline}>
          <View style={styles.statItemOutline}>
            <Text style={styles.statValueOutline}>{values.red}</Text>
            <Text style={styles.statLabelOutline}>{l.red}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItemOutline}>
            <Text style={styles.statValueOutline}>{values.white}</Text>
            <Text style={styles.statLabelOutline}>{l.white}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItemOutline}>
            <Text style={styles.statValueOutline}>{values.rose}</Text>
            <Text style={styles.statLabelOutline}>{l.rose}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statItemOutline}>
            <Text style={styles.statValueOutline}>{values.sparkling}</Text>
            <Text style={styles.statLabelOutline}>{l.sparkling}</Text>
          </View>
        </View>
      </View>
      <View style={styles.totalRowOutline}>
        <Text style={styles.totalValueOutline}>{values.total}</Text>
        <Text style={styles.totalLabelOutline}> {totalLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
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
  statItemOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statValueOutline: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 2,
  },
  statLabelOutline: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 16,
  },
  totalRowOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalValueOutline: {
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
    color: '#FFF',
  },
  totalLabelOutline: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'System',
  },
  separator: {
    width: 1,
    height: '100%',
    backgroundColor: '#555',
    marginHorizontal: 10,
  },
}); 