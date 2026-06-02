// Écran de recherche d'événements — version Apple Invites
// Fond : images Unsplash en mosaïque
// Barre de recherche glass, chips catégories, grille 2 colonnes
import { useState, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing, glass } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import EmptyState from '../components/EmptyState'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { fetchEvenementsPublics } from '../services/eventService'
import { formaterPourEventCard } from '../utils/eventUtils'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Theatre', 'Conference']

export default function EventSearchScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Tout')
  const [events, setEvents] = useState([])
  const { width } = useWindowDimensions()

  useFocusEffect(useCallback(() => {
    (async () => {
      const data = await fetchEvenementsPublics()
      setEvents(data.map(formaterPourEventCard))
    })()
  }, []))

  const filtered = events.filter((e) => {
    const matchCat = activeCat === 'Tout' || e.category === activeCat
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <View style={styles.container}>
      <BlurBackground category={activeCat === 'Tout' ? null : activeCat} />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <GlassContainer style={styles.searchBar} blurType="light" intensity={60}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Concert à Dakar..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Feather name="x" size={16} color="rgba(255,255,255,0.6)" onPress={() => setSearch('')} />
          )}
        </GlassContainer>

        {/* Chips catégories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          {CATEGORIES.map((cat) => (
            <GlassChip
              key={cat}
              label={cat}
              active={activeCat === cat}
              onPress={() => setActiveCat(cat)}
            />
          ))}
        </ScrollView>

        {/* Grille résultats */}
        <View style={styles.grid}>
          {filtered.map((event, i) => (
            <View key={event.id} style={{ width: (width - spacing.lg * 2 - 12) / 2 }}>
              <AnimatedEventCard
                event={event}
                index={i}
                cardStyle={{ width: '100%', marginRight: 0 }}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
              />
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="Aucun résultat"
            subtitle="Essaie un autre mot-clé ou catégorie"
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.jakarta.regular, color: '#fff',
    padding: 0,
  },
  chipsRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  chipsContent: { paddingHorizontal: spacing.lg, gap: 8 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, gap: 12,
    marginTop: spacing.sm,
  },
})
