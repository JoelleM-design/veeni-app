import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Text style={styles.headerTitle}>Conditions générales</Text>
        </View>
        {/* Espace réservé pour équilibrer le header */}
        <View style={{ width: 36 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Conditions Générales d'Utilisation – Veeni</Text>
        <Text style={styles.date}>Dernière mise à jour : 7 juillet 2025</Text>
        
        <Text style={styles.text}>
          Bienvenue sur <Text style={styles.bold}>Veeni</Text>, l'application mobile de gestion de cave à vin personnelle et sociale, éditée par <Text style={styles.bold}>PolyMorph</Text>.
        </Text>
        
        <Text style={styles.text}>
          En utilisant l'application, vous acceptez les présentes <Text style={styles.bold}>Conditions Générales d'Utilisation (CGU)</Text>.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations légales</Text>
          <Text style={styles.text}>
            • Éditeur : PolyMorph, SASU immatriculée au RCS de Pontoise sous le numéro 939 394 912{'\n'}
            • Contact : hello@veeni.fr
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Accès à l'application</Text>
          <Text style={styles.text}>
            L'inscription est réservée aux personnes majeures (18 ans et plus). L'utilisateur s'engage à fournir des informations exactes et à jour.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Fonctionnalités proposées</Text>
          <Text style={styles.text}>
            • Gestion de cave à vin personnelle (ajout, édition, consommation){'\n'}
            • Création et suivi d'une wishlist{'\n'}
            • Scan d'étiquettes via OCR{'\n'}
            • Accès aux caves et wishlists d'amis (lecture seule){'\n'}
            • Partage de fiches vin
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Obligations de l'utilisateur</Text>
          <Text style={styles.text}>
            L'utilisateur s'engage à :{'\n'}
            • Utiliser Veeni uniquement dans un cadre personnel et légal{'\n'}
            • Ne pas publier de contenu offensant, trompeur ou illégal{'\n'}
            • Respecter les droits des autres utilisateurs{'\n'}
            • Ne pas détourner l'usage de l'application à des fins commerciales
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Permissions techniques</Text>
          <Text style={styles.text}>
            L'application peut demander l'accès :{'\n'}
            • À la caméra et la galerie (pour le scan ou les photos de vin){'\n'}
            • À la connexion réseau (fonctionnement en ligne){'\n\n'}
            Ces accès sont optionnels et peuvent être désactivés depuis les paramètres du téléphone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Modération et sécurité</Text>
          <Text style={styles.text}>
            Nous nous réservons le droit de supprimer un compte ou un contenu en cas :{'\n'}
            • De non-respect des CGU{'\n'}
            • D'abus ou comportement nuisible à la communauté{'\n\n'}
            Tout contenu inapproprié peut être signalé via un bouton dédié. Nos équipes modèrent sous 24h.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Responsabilités</Text>
          <Text style={styles.text}>
            L'utilisateur est seul responsable du contenu qu'il ajoute (texte, photo). Veeni ne garantit pas l'exactitude des informations partagées entre utilisateurs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Modification des CGU</Text>
          <Text style={styles.text}>
            Nous nous réservons le droit de modifier les CGU. En cas de changement majeur, l'utilisateur sera informé lors de sa prochaine connexion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact</Text>
          <Text style={styles.text}>
            Pour toute question ou réclamation liée à l'application, contactez-nous à :{'\n'}
            hello@veeni.fr
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23262A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  headerBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.0)',
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  date: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
  },
}); 