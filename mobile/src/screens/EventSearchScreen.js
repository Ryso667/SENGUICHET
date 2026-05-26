// Écran de recherche d'événements avec barre de recherche et filtrage
// Les événements sont mockés en dur pour le moment
import { useState, useMemo, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { getDefaultImage } from '../config/images'

const MOCKS = [
  {
    id: 'dmf-2026', title: 'Dakar Music Festival',
    emoji: '🎶', bg: '#6d28d9',
    priceLabel: '5 000F – 15 000F',
    location: 'Monument Renaissance',
    category: 'Concert', date: '24 Mai 2026', time: '19h00',
    desc: 'Le plus grand festival de musique à Dakar.',
    tickets: [
      { id: 'standard', name: 'Entrée Standard', price: 5000, desc: 'Générale' },
      { id: 'vip', name: 'VIP Carré Or', price: 15000, desc: 'Vue scène + Boisson' },
    ],
  },
  {
    id: 'starlight', title: 'Soirée Starlight',
    emoji: '✨', bg: '#0284c7',
    priceLabel: '10 000F',
    location: 'Grand Théâtre',
    category: 'Soirée', date: '02 Juin 2026', time: '21h00',
    desc: 'Une soirée magique sous les étoiles.',
    tickets: [
      { id: 'standard', name: 'Entrée Standard', price: 10000, desc: 'Accès soirée' },
    ],
  },
]

function formaterEvenement(e) {
  if (e.tickets) return e
  const def = getDefaultImage(e.categorie)
  const parts = (e.date || '').split(' ')
  const prices = (e.categories || []).map(c => c.prix).filter(p => p != null)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const priceLabel = prices.length > 1 ? `${min.toLocaleString()}F – ${max.toLocaleString()}F`
    : prices.length === 1 ? `${min.toLocaleString()}F`
    : '—'
  return {
    id: e.id, title: e.nom || '', month: parts[1]?.slice(0, 3).toUpperCase() || '', day: parts[0] || '',
    emoji: def.emoji, bg: def.bg, priceLabel, location: e.lieu || '',
    category: e.categorie || '', date: e.date || '', time: '', desc: e.description || '',
    tickets: (e.categories || []).map(c => ({ id: c.id, name: c.nom, price: c.prix, desc: '' })),
  }
}

export default function EventSearchScreen({ navigation }) {
  const [allEvents, setAllEvents] = useState(MOCKS)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const raw = await AsyncStorage.getItem('@senguichet_evenements')
        const stored = raw ? JSON.parse(raw) : []
        setAllEvents([...stored.map(formaterEvenement), ...MOCKS])
      } catch (e) {
        console.warn('Failed to load events', e)
      }
    })
    return unsubscribe
  }, [navigation])

  // Filtre les événements par titre, lieu ou catégorie (insensible à la casse)
  const results = useMemo(() => {
    if (!query.trim()) return allEvents
    const q = query.toLowerCase()
    return allEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
  }, [query, allEvents])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.slate} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={15} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="search" size={28} color={colors.border} />
            <Text style={styles.emptyText}>Aucun événement trouvé</Text>
          </View>
        ) : (
          results.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.card}
              onPress={() => navigation.navigate('EventDetail', { event })}
              activeOpacity={0.7}
            >
              <View style={[styles.cardBanner, { backgroundColor: event.bg }]}>
                <Text style={styles.cardEmoji}>{event.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <View style={styles.metaRow}>
                  <Feather name="calendar" size={9} color={colors.mid} />
                  <Text style={styles.metaText}>{event.date}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={9} color={colors.mid} />
                  <Text style={styles.metaText}>{event.location}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Feather name="clock" size={9} color={colors.mid} />
                  <Text style={styles.metaText}>{event.time}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Feather name="tag" size={9} color={colors.accent} />
                  <Text style={styles.price}>{event.priceLabel}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={15} color={colors.muted} style={styles.chevron} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.jakarta.regular,
    color: colors.slate,
    padding: 0,
    outlineStyle: 'none',
  },

  list: {
    padding: spacing.md,
    gap: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    ...shadows.sm,
  },
  cardBanner: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.slate,
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
  },
  price: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.accent,
  },
  chevron: {
    paddingRight: 14,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.jakarta.regular,
  },
})
