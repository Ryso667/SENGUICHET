// Écran liste des tickets achetés (acheteur)
// Affiche les tickets actifs et supprimés, avec soft delete au long press
import { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../hooks/useTickets'
import { formaterDateLisible } from '../utils/dateUtils'

const STATUTS = {
  valide: { label: 'VALIDE', color: '#059669', dot: '#059669' },
  utilise: { label: 'UTILISÉ', color: '#64748b', dot: '#64748b' },
  expire: { label: 'EXPIRÉ', color: '#dc2626', dot: '#dc2626' },
}

export default function MesTicketsScreen({ navigation }) {
  const { tickets, ticketsSupprimes, refresh, softDelete, restore } = useTickets()
  const { deconnecter } = useAuth()

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refresh)
    return unsubscribe
  }, [navigation, refresh])

  const handleDelete = (t) => {
    Alert.alert(
      'Supprimer le billet',
      `Veux-tu supprimer "${t.numero}" ?\nTu pourras le restaurer plus tard.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => softDelete(t.id) },
      ]
    )
  }

  const handleRestore = (t) => {
    Alert.alert(
      'Restaurer le billet',
      `Réactiver "${t.numero}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Restaurer', onPress: () => restore(t.id) },
      ]
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mes tickets</Text>
          <Text style={s.sub}>{tickets.length} actif(s)</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Déconnexion', 'Revenir à l\'authentification ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'OK', onPress: deconnecter },
        ])}>
          <Feather name="log-out" size={18} color={colors.mid} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {tickets.length === 0 && ticketsSupprimes.length === 0 && (
          <View style={s.empty}>
            <Feather name="credit-card" size={40} color={colors.border} />
            <Text style={s.emptyTitle}>Aucun ticket</Text>
            <Text style={s.emptySub}>Achète ton premier ticket depuis l'accueil</Text>
          </View>
        )}

        {tickets.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={s.card}
            onPress={() => navigation.navigate('Ticket', { ticket: t })}
            onLongPress={() => handleDelete(t)}
            activeOpacity={0.7}
          >
            <View style={[s.emojiBox, { backgroundColor: colors.greenLight }]}>
              <Text style={s.emoji}>🎫</Text>
            </View>
            <View style={s.info}>
              <Text style={s.eventNom}>{t.eventNom}</Text>
              <Text style={s.meta}>{t.categorie} · {formaterDateLisible(t.eventDate)}</Text>
              <Text style={s.num}>{t.numero}</Text>
            </View>
            <View style={s.badge}>
              <View style={[s.dot, { backgroundColor: (STATUTS[t.statut]?.dot || '#059669') }]} />
              <Text style={[s.badgeText, { color: (STATUTS[t.statut]?.color || '#059669') }]}>
                {STATUTS[t.statut]?.label || 'VALIDE'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {ticketsSupprimes.length > 0 && (
          <>
            <View style={s.divider}>
              <Feather name="archive" size={14} color={colors.muted} />
              <Text style={s.dividerText}>Supprimés ({ticketsSupprimes.length})</Text>
            </View>
            {ticketsSupprimes.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[s.card, { opacity: 0.55 }]}
                onLongPress={() => handleRestore(t)}
                activeOpacity={0.7}
              >
                <View style={[s.emojiBox, { backgroundColor: colors.border }]}>
                  <Text style={s.emoji}>🗑️</Text>
                </View>
                <View style={s.info}>
                  <Text style={[s.eventNom, { color: colors.muted }]}>{t.eventNom}</Text>
                  <Text style={[s.meta, { color: colors.muted }]}>{t.categorie} · {formaterDateLisible(t.eventDate)}</Text>
                  <Text style={[s.num, { color: colors.muted }]}>{t.numero}</Text>
                </View>
                <Text style={s.restoreHint}>Appui long → restaurer</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  title: { fontSize: 22, fontFamily: fonts.outfit.black, color: colors.slate, letterSpacing: -0.8 },
  sub: { fontSize: 11, color: colors.muted, fontFamily: fonts.jakarta.regular, marginTop: 2 },
  scroll: { padding: spacing.lg, paddingTop: 0 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.slate, marginTop: spacing.md },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: 14, marginBottom: spacing.sm, ...shadows.sm,
  },
  emojiBox: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  eventNom: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, letterSpacing: -0.1 },
  meta: { fontSize: 11, color: colors.mid, fontFamily: fonts.jakarta.regular, marginTop: 2 },
  num: { fontSize: 10, color: colors.muted, fontFamily: fonts.jakarta.regular, marginTop: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  badgeText: { fontSize: 10, fontFamily: fonts.jakarta.semiBold, color: '#16a34a' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, marginBottom: spacing.sm },
  dividerText: { fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.muted },
  restoreHint: { fontSize: 10, color: colors.muted, fontFamily: fonts.jakarta.regular },
})
