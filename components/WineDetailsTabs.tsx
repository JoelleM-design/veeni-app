import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WineDetailsTabsProps {
  activeTab: 'info' | 'memories';
  onTabChange: (tab: 'info' | 'memories') => void;
  memoriesCount?: number;
  isReadOnlyMode?: boolean;
  hasMemories?: boolean;
}

export default function WineDetailsTabs({ 
  activeTab, 
  onTabChange, 
  memoriesCount = 0,
  isReadOnlyMode = false,
  hasMemories = false
}: WineDetailsTabsProps) {
  // En mode lecture seule (ami), on n'affiche l'onglet "Souvenir" que s'il y a des souvenirs
  if (isReadOnlyMode) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.tab,
            styles.activeTab
          ]}
          onPress={() => onTabChange('info')}
        >
          <Text style={[
            styles.tabText,
            styles.activeTabText
          ]}>
            Infos vin
          </Text>
        </TouchableOpacity>
        
        {hasMemories && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'memories' && styles.activeTab
            ]}
            onPress={() => onTabChange('memories')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'memories' && styles.activeTabText
            ]}>
              Souvenir
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'info' && styles.activeTab
        ]}
        onPress={() => onTabChange('info')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'info' && styles.activeTabText
        ]}>
          Infos vin
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'memories' && styles.activeTab
        ]}
        onPress={() => onTabChange('memories')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'memories' && styles.activeTabText
        ]}>
          Souvenir
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  tab: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#393C40',
    borderWidth: 0,
  },
  tabText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
