// Écran liste des tickets achetés (acheteur)
// Charge depuis l'API backend uniquement — pas de fallback mock SQLite
import { useEffect, useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { formaterDateLisible } from '../utils/dateUtils'
import { mesBillets } from '../services/billetService'
import BuyerLayout from '../components/BuyerLayout'
import EmptyState from '../components/EmptyState'

const STATUTS = {
  valide: { label: 'VALIDE', color: '#059669', dot: '#059669' },
  utilise: { label: 'UTILISÉ', color: '#64748b', dot: '#64748b' },
  expire: { label: 'EXPIRÉ', color: '#dc2626', dot: '#dc2626' },
  en_attente: { label: 'EN ATTENTE', color: '#f59e0b', dot: '#f59e0b' },
}

export default function MesTicketsScreen({ navigation }) {
  const { deconnecter, numeroTel } = useAuth()

  const [tickets, setTickets] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const charger = useCallback(async () => {
    if (!numeroTel) return
    setChargement(true)
    setErreur(null)
    try {
      const data = await mesBillets(numeroTel)
      setTickets(Array.isArray(data) ? data : [])
    } catch (e) {
      setErreur(e.message)
      setTickets([])
    } finally {
      setChargement(false)
    }
  }, [numeroTel])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', charger)
    return unsubscribe
  }, [navigation, charger])

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await charger()
    setRefreshing(false)
  }, [charger])

  return (
    <BuyerLayout>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <View>
            <LinearGradient colors={['#00C8FF', '#0077FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logoGradient}>
              <Text style={s.logoText}>Mes tickets</Text>
            </LinearGradient>
            {tickets.length > 0 && (
              <Text style={s.sub}>{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Déconnexion', "Revenir à l'authentification ?", [
            { text: 'Annuler', style: 'cancel' },
            { text: 'OK', onPress: deconnecter },
          ])}>
            <View style={s.logoutBtn}>
              <Feather name="log-out" size={16} color={colors.mid} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C8FF']} />}
        >
          {chargement && tickets.length === 0 && (
            <View style={s.centre}><Text style={s.texteCentre}>Chargement...</Text></View>
          )}

          {erreur && tickets.length === 0 && (
            <View style={s.centre}>
              <Feather name="wifi-off" size={32} color={colors.muted} />
              <Text style={s.texteErreur}>{erreur}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={charger}>
                <Text style={s.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}

          {!chargement && tickets.length === 0 && !erreur && (
            <EmptyState
              icon={<MaterialCommunityIcons name="ticket-outline" size={48} color={colors.mid} />}
              title="Aucun ticket"
              subtitle="Achète tes premiers billets"
            />
          )}

          {tickets.map((t) => {
            const statut = (t.statut || 'en_attente').toLowerCase()
            return (
              <TouchableOpacity
                key={t.id}
                style={s.card}
                onPress={() => navigation.navigate('Ticket', { ticket: t })}
                activeOpacity={0.7}
              >
                <LinearGradient colors={['#E0FFF0', '#D1FAE5']} style={s.emojiBox}>
                  <MaterialCommunityIcons name="ticket-outline" size={20} color="#16a34a" />
                </LinearGradient>
                <View style={s.info}>
                  <Text style={s.eventNom}>{t.eventNom}</Text>
                  <Text style={s.meta}>{t.categorie} · {formaterDateLisible(t.eventDate)}</Text>
                  <Text style={s.num}>#{t.numero}</Text>
                </View>
                <View style={s.badge}>
                  <View style={[s.dot, { backgroundColor: STATUTS[statut]?.dot || '#059669' }]} />
                  <Text style={[s.badgeText, { color: STATUTS[statut]?.color || '#059669' }]}>
                    {STATUTS[statut]?.label || 'VALIDE'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
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
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  logoText: {
    fontSize: 18, fontFamily: fonts.outfit.black, color: '#FFFFFF', letterSpacing: 1,
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
  centre: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12,
  },
  texteCentre: {
    fontSize: 13, color: colors.mid, fontFamily: fonts.jakarta.regular,
  },
  texteErreur: {
    fontSize: 12, color: colors.red, fontFamily: fonts.jakarta.regular, textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  retryText: {
    fontSize: 12, fontFamily: fonts.outfit.semiBold, color: '#fff',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, padding: 14, marginBottom: spacing.sm, ...shadows.sm,
  },
  emojiBox: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  info: { flex: 1 },
  eventNom: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.slate, letterSpacing: -0.1 },
  meta: { fontSize: 11, color: colors.mid, fontFamily: fonts.jakarta.regular, marginTop: 2 },
  num: { fontSize: 10, color: colors.muted, fontFamily: fonts.jakarta.regular, marginTop: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.sm,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontFamily: fonts.jakarta.semiBold, color: '#16a34a' },
})
