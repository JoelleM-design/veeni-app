import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Spacing, Typography, VeeniColors } from '../constants/Colors';
import { useUser } from '../hooks/useUser';
import { supabase } from '../lib/supabase';

export default function AddFriendsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactsPermission, setContactsPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, name, first_name, email, avatar, friends')
          .neq('id', user.id);
        if (error) throw error;
        let notFriends = (data || []).filter(u => !(user.friends || []).includes(u.id));
        if (search.trim()) {
          notFriends = notFriends.filter(u =>
            (u.first_name || u.name || '').toLowerCase().includes(search.trim().toLowerCase())
          );
        }
        setSuggestions(notFriends);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [user, search]);

  // Vérifier la permission au montage
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.getPermissionsAsync();
      setContactsPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    })();
  }, []);

  // Handler pour demander la permission
  const handleAskContactsPermission = async () => {
    setContactsError(null);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      setContactsPermission('granted');
    } else {
      setContactsPermission('denied');
      setContactsError("Permission refusée. Impossible d'accéder à tes contacts.");
    }
  };

  // Partage via Share API
  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Rejoins-moi sur Veeni ! https://veeni.app/invite',
      });
    } catch (error) {}
  };

  // Copier le lien
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync('https://veeni.app/invite');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={VeeniColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter des amis</Text>
        <View style={{ width: 36 }} />
      </View>
      {/* Encart autorisation contacts (affiché si pas encore accordé) */}
      {contactsPermission !== 'granted' && (
        <View style={styles.contactsBox}>
          <Text style={styles.contactsWarningTitle}>⚠️  Autorise l'accès à tes contacts</Text>
          <Text style={styles.contactsWarningText}>Synchronise tes contacts pour savoir quels amis sont déjà là.</Text>
          <TouchableOpacity style={styles.contactsButton} onPress={handleAskContactsPermission}>
            <Text style={styles.contactsButtonText}>Autoriser les contacts</Text>
          </TouchableOpacity>
          {contactsError && <Text style={styles.contactsError}>{contactsError}</Text>}
        </View>
      )}
      {/* Champ de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des amis…"
          placeholderTextColor={VeeniColors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Boutons de partage */}
      <View style={styles.shareRow}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleCopyLink}>
          <Ionicons name="link" size={22} color={VeeniColors.accent.primary} />
          <Text style={styles.shareBtnLabel}>Copier le lien</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={22} color={VeeniColors.accent.primary} />
          <Text style={styles.shareBtnLabel}>Partager</Text>
        </TouchableOpacity>
      </View>
      {/* Suggestions d'amis */}
      <ScrollView style={styles.suggestionsList} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
        <Text style={styles.suggestionsTitle}>Suggestions d'amis</Text>
        {loading ? (
          <Text style={styles.loadingText}>Chargement…</Text>
        ) : suggestions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune suggestion</Text>
        ) : suggestions.map(sugg => (
          <View key={sugg.id} style={styles.suggestionRow}>
            {sugg.avatar ? (
              <Image source={{ uri: sugg.avatar }} style={styles.suggestionAvatar} />
            ) : (
              <View style={styles.suggestionAvatarPlaceholder}>
                <Text style={styles.suggestionAvatarInitial}>{sugg.first_name?.charAt(0).toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionName}>{sugg.first_name || sugg.name}</Text>
              <Text style={styles.suggestionMeta}>{(sugg.friends?.length || 0)} amis sur Veeni</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {copied && (
        <Text style={styles.copiedText}>Lien copié !</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VeeniColors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.base, backgroundColor: VeeniColors.background.primary },
  backButton: { padding: 4, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.0)', marginRight: 8 },
  headerTitle: { color: VeeniColors.text.primary, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, flex: 1, textAlign: 'center' },
  searchContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  searchInput: { backgroundColor: VeeniColors.background.tertiary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg, fontSize: Typography.size.base, color: VeeniColors.text.primary },
  shareRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: Spacing.base },
  shareBtn: { alignItems: 'center', flexDirection: 'row', backgroundColor: VeeniColors.background.secondary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.sm },
  shareBtnLabel: { color: VeeniColors.text.primary, fontSize: Typography.size.base, marginLeft: 8, fontWeight: Typography.weight.medium },
  suggestionsList: { flex: 1, paddingHorizontal: Spacing.base },
  suggestionsTitle: { color: VeeniColors.text.secondary, fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, marginVertical: Spacing.base },
  loadingText: { color: VeeniColors.text.primary, fontSize: Typography.size.base, textAlign: 'center', marginTop: Spacing.lg },
  emptyText: { color: VeeniColors.text.tertiary, fontSize: Typography.size.base, textAlign: 'center', marginTop: Spacing.lg },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: VeeniColors.border.primary },
  suggestionAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: Spacing.base },
  suggestionAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: VeeniColors.background.tertiary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.base },
  suggestionAvatarInitial: { color: VeeniColors.text.tertiary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  suggestionInfo: { flex: 1 },
  suggestionName: { color: VeeniColors.text.primary, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold },
  suggestionMeta: { color: VeeniColors.text.tertiary, fontSize: Typography.size.sm },
  addBtn: { backgroundColor: VeeniColors.accent.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, marginLeft: Spacing.base },
  addBtnText: { color: VeeniColors.background.primary, fontWeight: Typography.weight.bold, fontSize: Typography.size.base },
  contactsBox: {
    backgroundColor: VeeniColors.background.secondary,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: VeeniColors.accent.primary,
    alignItems: 'center',
  },
  contactsWarningTitle: {
    color: VeeniColors.accent.primary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.lg,
    marginBottom: 4,
    textAlign: 'center',
  },
  contactsWarningText: {
    color: VeeniColors.text.secondary,
    fontSize: Typography.size.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  contactsButton: {
    backgroundColor: VeeniColors.accent.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  contactsButtonText: {
    color: VeeniColors.background.primary,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.base,
  },
  contactsError: {
    color: VeeniColors.accent.error,
    fontSize: Typography.size.sm,
    marginTop: 8,
    textAlign: 'center',
  },
  copiedText: {
    color: VeeniColors.accent.primary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: Typography.weight.bold,
  },
}); 