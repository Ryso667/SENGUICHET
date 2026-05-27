// Écran liste des tickets achetés (acheteur)
// Affiche les tickets actifs et supprimés avec statut, restauration et suppression
import { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../hooks/useTickets'
import { formaterDateLisible } from '../utils/dateUtils'
import BuyerLayout from '../components/BuyerLayout'

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
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <View>
            <LinearGradient colors={['#6366F1', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logoGradient}>
              <Text style={s.logoText}>Mes tickets</Text>
            </LinearGradient>
            {tickets.length > 0 && (
              <Text style={s.sub}>{tickets.length} actif{tickets.length > 1 ? 's' : ''}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Déconnexion', 'Revenir à l\'authentification ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'OK', onPress: deconnecter },
          ])}>
            <View style={s.logoutBtn}>
              <Feather name="log-out" size={16} color={colors.mid} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {tickets.length === 0 && ticketsSupprimes.length === 0 && (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Feather name="shopping-bag" size={36} color="#cbd5e1" />
              </View>
              <Text style={s.emptyTitle}>Aucun ticket</Text>
              <Text style={s.emptySub}>Achetez votre premier ticket depuis l'accueil.</Text>
              <TouchableOpacity style={s.emptyCta} onPress={() => navigation.navigate('Home')}>
                <Feather name="shopping-cart" size={14} color="#FFFFFF" />
                <Text style={s.emptyCtaText}>Acheter maintenant</Text>
              </TouchableOpacity>
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
              <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={s.emojiBox}>
                <Text style={s.emoji}>🎫</Text>
              </LinearGradient>
              <View style={s.info}>
                <Text style={s.eventNom}>{t.eventNom}</Text>
                <Text style={s.meta}>{t.categorie} · {formaterDateLisible(t.eventDate)}</Text>
                <Text style={s.num}>#{t.numero}</Text>
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
                    <Text style={[s.num, { color: colors.muted }]}>#{t.numero}</Text>
                  </View>
                  <Text style={s.restoreHint}>Appui long → restaurer</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  logoGradient: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logoText: {
    fontSize: 18,
    fontFamily: fonts.outfit.black,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sub: {
    fontSize: 11, color: colors.mid, fontFamily: fonts.jakarta.regular, marginTop: 6,
  },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  scroll: { padding: spacing.lg, paddingTop: 0 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  emptyTitle: {
    fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.slate, marginTop: spacing.lg,
  },
  emptySub: {
    fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid,
    marginTop: spacing.xs, textAlign: 'center', lineHeight: 18,
  },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.lg, backgroundColor: colors.accent,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.full,
    ...shadows.md,
  },
  emptyCtaText: {
    fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#FFFFFF',
  },
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
