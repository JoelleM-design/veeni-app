import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Text style={styles.headerTitle}>Confidentialité</Text>
        </View>
        {/* Espace réservé pour équilibrer le header */}
        <View style={{ width: 36 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Politique de confidentialité – Veeni</Text>
        <Text style={styles.date}>Dernière mise à jour : 7 juillet 2025</Text>
        
        <Text style={styles.text}>
          La présente politique de confidentialité décrit comment <Text style={styles.bold}>Veeni</Text>, éditée par <Text style={styles.bold}>PolyMorph</Text>, collecte, utilise et protège vos données personnelles, conformément au <Text style={styles.bold}>Règlement Général sur la Protection des Données (RGPD)</Text>.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identité du responsable de traitement</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Responsable</Text> : PolyMorph, SASU immatriculée au RCS de Pontoise sous le numéro 939 394 912{'\n'}
            • <Text style={styles.bold}>Email de contact</Text> : hello@veeni.fr
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Données personnelles collectées</Text>
          <Text style={styles.text}>
            Lors de l'utilisation de l'application Veeni, nous pouvons collecter les données suivantes :{'\n\n'}
            • Informations de compte : nom, prénom, email, photo de profil, date de naissance (si fournie){'\n'}
            • Données de cave : fiches de vins, photos, stock, notes de dégustation{'\n'}
            • Données de wishlist : souhaits, origines sociales{'\n'}
            • Données de scan OCR : photos d'étiquettes, textes extraits{'\n'}
            • Données de connexion : type de terminal, logs techniques{'\n'}
            • Données analytiques : parcours utilisateur (via Matomo ou équivalent){'\n'}
            • Données sociales : relations d'amis, actions sociales dans l'app
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Finalités du traitement</Text>
          <Text style={styles.text}>
            Les données sont traitées pour les finalités suivantes :{'\n\n'}
            • Créer et gérer votre compte utilisateur{'\n'}
            • Permettre la gestion de votre cave et de votre wishlist{'\n'}
            • Proposer des fonctionnalités sociales (amis, partages){'\n'}
            • Améliorer les services et l'expérience utilisateur{'\n'}
            • Assurer la sécurité de l'application{'\n'}
            • Répondre à nos obligations légales
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Base légale du traitement</Text>
          <Text style={styles.text}>
            • <Text style={styles.bold}>Exécution contractuelle</Text> : pour fournir les fonctionnalités de l'app{'\n'}
            • <Text style={styles.bold}>Consentement</Text> : pour l'utilisation de la caméra, galerie, géolocalisation{'\n'}
            • <Text style={styles.bold}>Intérêt légitime</Text> : pour l'analyse de l'usage (statistiques, amélioration continue)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Destinataires des données</Text>
          <Text style={styles.text}>
            Vos données ne sont jamais revendues.{'\n\n'}
            Elles peuvent être partagées avec :{'\n'}
            • Nos prestataires techniques (ex : Supabase, Google Vision){'\n'}
            • Les autorités compétentes en cas d'obligation légale
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Durée de conservation</Text>
          <Text style={styles.text}>
            • Vos données sont conservées tant que votre compte est actif.{'\n'}
            • En cas de suppression de compte, les données sont effacées sous 6 mois, sauf obligation légale.{'\n'}
            • Certaines données anonymisées peuvent être conservées à des fins statistiques.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Vos droits RGPD</Text>
          <Text style={styles.text}>
            Vous disposez des droits suivants :{'\n'}
            • Droit d'accès{'\n'}
            • Droit de rectification{'\n'}
            • Droit à l'effacement{'\n'}
            • Droit à la portabilité{'\n'}
            • Droit d'opposition{'\n'}
            • Droit à la limitation du traitement{'\n\n'}
            Vous pouvez exercer ces droits à l'adresse suivante : hello@veeni.fr
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Sécurité</Text>
          <Text style={styles.text}>
            Les données sont hébergées dans un environnement sécurisé (Supabase), avec chiffrement des flux et protection des accès.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modifications</Text>
          <Text style={styles.text}>
            Cette politique peut être mise à jour. En cas de modification majeure, vous en serez informé directement dans l'application.
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