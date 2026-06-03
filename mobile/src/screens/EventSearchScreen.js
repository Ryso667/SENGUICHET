// Écran de recherche d'événements avec barre de recherche et filtrage
// Les événements sont chargés depuis l'API via fetchEvenementsPublics
import { useState, useMemo, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows } from '../constants/theme'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import BuyerLayout from '../components/BuyerLayout'

export default function EventSearchScreen({ navigation }) {
  const [allEvents, setAllEvents] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const events = await fetchEvenementsPublics()
      setAllEvents(events.map(formaterPourEventCard))
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
    <BuyerLayout>
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

        <ScrollView style={styles.flex} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
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
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
                activeOpacity={0.7}
              >
                <View style={[styles.cardBanner, { backgroundColor: event.bg }]}>
                  <Text style={styles.cardEmoji}>{event.emoji}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="calendar" size={9} color={colors.mid} />
                    <Text style={styles.metaText}>{formaterDateLisible(event.date)}</Text>
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
    </BuyerLayout>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
