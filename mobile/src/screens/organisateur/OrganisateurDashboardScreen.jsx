// Dashboard organisateur : liste des événements, stats globales, ventes par catégorie
// Recharge les données à chaque focus de l'écran
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, glass, gradients, shadows, spacing, borderRadius, fonts } from '../../constants/theme'
import { getAllEvenements, getEvenementStats, supprimerEvenement, ajouterAudit } from '../../services/eventService'
import { useAuth } from '../../context/AuthContext'
import BoutonPrincipal from '../../components/BoutonPrincipal'

// Mini carte de statistique (icône + valeur + label)
function StatCard({ icon, value, label, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

export default function OrganisateurDashboardScreen({ navigation }) {
  const { email, deconnecter } = useAuth()
  const [events, setEvents] = useState([])
  const [expandedId, setExpandedId] = useState(null) // événement déplié
  const [stats, setStats] = useState({})              // stats par événement

  // Charge les données au montage + au focus (after achat/navigation)
  useEffect(() => {
    loadData()
    const unsubscribe = navigation.addListener('focus', loadData)
    return unsubscribe
  }, [navigation])

  async function loadData() {
    const evts = await getAllEvenements()
    const actifs = evts.filter(e => !e.supprime)
    setEvents(actifs)
    const s = {}
    for (const e of actifs) {
      s[e.id] = await getEvenementStats(e.id)
    }
    setStats(s)
  }

  const totalVendus = events.reduce((sum, e) => sum + (stats[e.id]?.totalVendus || 0), 0)
  const totalRecettes = events.reduce((sum, e) => sum + (stats[e.id]?.recettes || 0), 0)

  return (
    <ScrollView style={s.container}>
      <LinearGradient colors={gradients.hero} style={s.hero}>
        <Text style={s.greeting}>Bonjour 👋</Text>
        <Text style={s.email}>{email || 'Organisateur'}</Text>
      </LinearGradient>

      <View style={s.statsRow}>
        <StatCard icon="🎟️" value={events.length} label="Événements" color={colors.accent} />
        <StatCard icon="🎫" value={totalVendus} label="Billets vendus" color={colors.green} />
        <StatCard icon="💰" value={`${(totalRecettes / 1000).toFixed(0)}k`} label="Recettes CFA" color={colors.rose} />
      </View>

      {events.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyText}>Aucun événement pour le moment</Text>
        </View>
      ) : (
        events.map(evt => {
          const st = stats[evt.id]
          const isOpen = expandedId === evt.id
          return (
            <TouchableOpacity key={evt.id} style={s.eventCard} onPress={() => setExpandedId(isOpen ? null : evt.id)} activeOpacity={0.8}>
              <View style={s.eventHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventName}>{evt.nom}</Text>
                  <Text style={s.eventDate}>{evt.date} · Code: {evt.code}</Text>
                </View>
                <Text style={s.chevron}>{isOpen ? '▼' : '▶'}</Text>
              </View>

              {isOpen && st && (
                <View style={s.eventDetails}>
                  <Text style={s.sectionTitle}>🎟️ Ventes par type</Text>
                  {st.vendusParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.vendus / Math.max(c.capacite, 1)) * 100}%`, backgroundColor: colors.accent }]} />
                      </View>
                      <Text style={s.barCount}>{c.vendus}/{c.capacite}</Text>
                    </View>
                  ))}

                  <Text style={s.sectionTitle}>📸 Scans par type</Text>
                  {st.scannesParCategorie.map((c, i) => (
                    <View key={i} style={s.barRow}>
                      <Text style={s.barLabel}>{c.nom}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${(c.scannes / Math.max(c.vendus, 1)) * 100}%`, backgroundColor: colors.green }]} />
                      </View>
                      <Text style={s.barCount}>{c.scannes}/{c.vendus}</Text>
                    </View>
                  ))}

                  <TouchableOpacity style={s.voirTicketsBtn}
                    onPress={() => navigation.navigate('VoirTickets', { eventId: evt.id })}>
                    <Text style={s.voirTicketsText}>Voir les tickets →</Text>
                  </TouchableOpacity>

                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={s.editBtn}
                      onPress={() => navigation.navigate('CreerEvenement', { event: evt })}
                    >
                      <Text style={s.editBtnText}>✏️ Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => {
                        Alert.alert(
                          'Supprimer',
                          `Supprimer "${evt.nom}" ? Cette action est irréversible.`,
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Supprimer', style: 'destructive', onPress: async () => {
                              await supprimerEvenement(evt.id)
                              await ajouterAudit('suppression', { eventId: evt.id, eventNom: evt.nom, par: email })
                              loadData()
                            }},
                          ]
                        )
                      }}
                    >
                      <Text style={s.deleteBtnText}>🗑️ Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )
        })
      )}

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <BoutonPrincipal titre="Créer un événement" onPress={() => navigation.navigate('CreerEvenement')} />
        <TouchableOpacity onPress={deconnecter}>
          <Text style={s.logout}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { padding: spacing.xl, paddingTop: 60 },
  greeting: { fontSize: 28, fontFamily: fonts.outfit.bold, color: colors.slate },
  email: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: -spacing.lg },
  statCard: {
    ...glass, borderRadius: borderRadius.lg, padding: spacing.md, flex: 1,
    ...shadows.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontFamily: fonts.outfit.bold, marginTop: spacing.xs },
  statLabel: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: spacing.sm },
  eventCard: {
    ...glass, borderRadius: borderRadius.lg, marginHorizontal: spacing.lg,
    marginTop: spacing.md, padding: spacing.md, ...shadows.sm,
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventName: { fontSize: 17, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  eventDate: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 2 },
  chevron: { fontSize: 14, color: colors.mid },
  eventDetails: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  sectionTitle: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm, marginTop: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  barLabel: { width: 70, fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.mid },
  barBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: 8, borderRadius: 4 },
  barCount: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: fonts.outfit.semiBold, color: colors.slate },
  voirTicketsBtn: { marginTop: spacing.md, alignSelf: 'flex-end' },
  voirTicketsText: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
  logout: { textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.red, marginBottom: spacing.xxl },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: '#eef2ff' },
  editBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#6366f1' },
  deleteBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: '#fef2f2' },
  deleteBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#ef4444' },
})
