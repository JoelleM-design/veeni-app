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
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [pendingOutgoingIds, setPendingOutgoingIds] = useState<string[]>([]);
  const [pendingIncomingIds, setPendingIncomingIds] = useState<string[]>([]);

  // Load friend relationships (accepted, pending in/out)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [accFrom, accTo, pendOut, pendIn] = await Promise.all([
          supabase.from('friend').select('friend_id').eq('user_id', user.id).eq('status', 'accepted'),
          supabase.from('friend').select('user_id').eq('friend_id', user.id).eq('status', 'accepted'),
          supabase.from('friend').select('friend_id').eq('user_id', user.id).eq('status', 'pending'),
          supabase.from('friend').select('user_id').eq('friend_id', user.id).eq('status', 'pending'),
        ]);
        if (cancelled) return;
        const accepted = Array.from(new Set<string>([
          ...((accFrom.data || []).map((r: any) => String(r.friend_id))),
          ...((accTo.data || []).map((r: any) => String(r.user_id))),
        ]));
        const pendOutIds = ((pendOut.data || []).map((r: any) => String(r.friend_id)));
        const pendInIds = ((pendIn.data || []).map((r: any) => String(r.user_id)));
        setAcceptedIds(accepted);
        setPendingOutgoingIds(pendOutIds);
        setPendingIncomingIds(pendInIds);
      } catch (e) {
        setAcceptedIds([]);
        setPendingOutgoingIds([]);
        setPendingIncomingIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch suggestions excluding already accepted friends
  useEffect(() => {
    async function fetchSuggestions() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, first_name, email, avatar')
          .neq('id', user.id);
        if (error) throw error;
        const acceptedSet = new Set(acceptedIds);
        let candidates = (data || []).filter(u => !acceptedSet.has(String(u.id)));
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          candidates = candidates.filter(u => (u.first_name || '').toLowerCase().includes(q));
        }
        setSuggestions(candidates);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [user, search, acceptedIds]);

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

  const handleAddFriend = async (targetUserId: string) => {
    if (!user) return;
    const acceptedSet = new Set(acceptedIds);
    const pendOutSet = new Set(pendingOutgoingIds);
    const pendInSet = new Set(pendingIncomingIds);
    if (acceptedSet.has(targetUserId) || pendOutSet.has(targetUserId)) return;

    try {
      // If there is an incoming pending request from the target, accept it
      if (pendInSet.has(targetUserId)) {
        await supabase
          .from('friend')
          .update({ status: 'accepted' })
          .eq('user_id', targetUserId)
          .eq('friend_id', user.id);
        await supabase
          .from('friend')
          .upsert({ user_id: user.id, friend_id: targetUserId, status: 'accepted' } as any, { onConflict: 'user_id,friend_id' });
        setPendingIncomingIds(prev => prev.filter(id => id !== targetUserId));
        setAcceptedIds(prev => (prev.includes(targetUserId) ? prev : [...prev, targetUserId]));
        setSuggestions(prev => prev.filter((u: any) => String(u.id) !== String(targetUserId)));
        return;
      }

      // Otherwise, send a new outgoing request (pending)
      const { error } = await supabase
        .from('friend')
        .upsert({ user_id: user.id, friend_id: targetUserId, status: 'pending' } as any, { onConflict: 'user_id,friend_id' });
      if (error) return;
      setPendingOutgoingIds(prev => (prev.includes(targetUserId) ? prev : [...prev, targetUserId]));
    } catch (e) {
      // swallow
    }
  };

  // Realtime: when other user accepts our request, remove from suggestions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('add-friends-realtime')
      // Incoming requests to me updated to accepted
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friend', filter: `friend_id=eq.${user.id}` }, (payload: any) => {
        const newRow = payload?.new as any;
        if (!newRow) return;
        if (newRow.status === 'accepted') {
          const otherId = String(newRow.user_id);
          setAcceptedIds(prev => (prev.includes(otherId) ? prev : [...prev, otherId]));
          setPendingIncomingIds(prev => prev.filter(id => id !== otherId));
          setPendingOutgoingIds(prev => prev.filter(id => id !== otherId));
          setSuggestions(prev => prev.filter((u: any) => String(u.id) !== otherId));
        }
      })
      // My outgoing pending request accepted (row where I am user_id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'friend', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const newRow = payload?.new as any;
        if (!newRow) return;
        if (newRow.status === 'accepted') {
          const otherId = String(newRow.friend_id);
          setAcceptedIds(prev => (prev.includes(otherId) ? prev : [...prev, otherId]));
          setPendingOutgoingIds(prev => prev.filter(id => id !== otherId));
          setSuggestions(prev => prev.filter((u: any) => String(u.id) !== otherId));
        }
      })
      // Also catch inserts that directly create an accepted relation
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const newRow = payload?.new as any;
        if (!newRow) return;
        if (newRow.status === 'accepted') {
          const otherId = String(newRow.friend_id);
          setAcceptedIds(prev => (prev.includes(otherId) ? prev : [...prev, otherId]));
          setSuggestions(prev => prev.filter((u: any) => String(u.id) !== otherId));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend', filter: `friend_id=eq.${user.id}` }, (payload: any) => {
        const newRow = payload?.new as any;
        if (!newRow) return;
        if (newRow.status === 'accepted') {
          const otherId = String(newRow.user_id);
          setAcceptedIds(prev => (prev.includes(otherId) ? prev : [...prev, otherId]));
          setSuggestions(prev => prev.filter((u: any) => String(u.id) !== otherId));
        }
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [user]);

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
              <Text style={styles.suggestionName}>{sugg.first_name}</Text>
              <Text style={styles.suggestionMeta}>0 amis sur Veeni</Text>
            </View>
            {(() => {
              const id = String(sugg.id);
              const isAccepted = acceptedIds.includes(id);
              const isPendingOut = pendingOutgoingIds.includes(id);
              const label = isAccepted ? 'Ami' : isPendingOut ? 'En attente' : '+ Ajouter';
              return (
                <TouchableOpacity
                  style={[styles.addBtn, (isAccepted || isPendingOut) ? styles.addBtnDisabled : undefined]}
                  disabled={isAccepted || isPendingOut}
                  onPress={() => handleAddFriend(id)}
                >
                  <Text style={styles.addBtnText}>{label}</Text>
                </TouchableOpacity>
              );
            })()}
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