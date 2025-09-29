import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../hooks/useUser';

/**
 * Exemple d'utilisation du composant WineDetailsScreenV2
 * 
 * Ce composant démontre comment utiliser WineDetailsScreenV2 avec les 3 contextes :
 * - cellar : vin dans ma cave
 * - wishlist : vin dans ma liste d'envie  
 * - tasted : vin dégusté
 */
export default function WineDetailsScreenV2Example() {
  const { user } = useUser();
  
  // Exemple de vins pour les différents contextes
  const exampleWines = [
    {
      id: 'wine-1',
      name: 'Château Margaux 2015',
      context: 'cellar' as const,
      description: 'Vin dans ma cave avec stock'
    },
    {
      id: 'wine-2', 
      name: 'Domaine de la Romanée-Conti 2018',
      context: 'wishlist' as const,
      description: 'Vin dans ma liste d\'envie'
    },
    {
      id: 'wine-3',
      name: 'Château Petrus 2016', 
      context: 'tasted' as const,
      description: 'Vin dégusté récemment'
    }
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Veuillez vous connecter pour voir les exemples</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exemples WineDetailsScreenV2</Text>
      
      {exampleWines.map((wine) => (
        <View key={wine.id} style={styles.wineExample}>
          <Text style={styles.wineName}>{wine.name}</Text>
          <Text style={styles.wineDescription}>{wine.description}</Text>
          <Text style={styles.contextText}>Contexte: {wine.context}</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              // Navigation vers WineDetailsScreenV2
              // En réalité, vous utiliseriez un router pour naviguer
              console.log(`Navigation vers WineDetailsScreenV2 avec:`, {
                wineId: wine.id,
                viewerUserId: user.id,
                contextOwnerUserId: user.id, // Même utilisateur pour cet exemple
                context: wine.context
              });
            }}
          >
            <Text style={styles.buttonText}>Voir la fiche détaillée</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.usageExample}>
        <Text style={styles.usageTitle}>Exemple d'utilisation :</Text>
        <Text style={styles.codeText}>
{`<WineDetailsScreenV2
  wineId="wine-123"
  viewerUserId="user-456" 
  contextOwnerUserId="user-456"
  context="cellar"
/>`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  wineExample: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  wineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  wineDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F6A07A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  usageExample: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 4,
  },
});


