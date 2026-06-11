// Écran de recherche d'événements — version Apple Invites
// Fond : images Unsplash en mosaïque
// Barre de recherche glass, chips catégories, grille 2 colonnes
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, useWindowDimensions, ScrollView, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing, glass, colors } from '../constants/theme'
import OrganisateurLayout from '../components/OrganisateurLayout'
import BlurBackground, { optimiserUrlCloudinary } from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import EmptyState from '../components/EmptyState'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { fetchEvenementsPublics } from '../services/eventService'
import { formaterPourEventCard } from '../utils/eventUtils'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Theatre', 'Conference']

// Composant stable pour le header de la FlatList — évite les remounts sur chaque render
function SearchHeader({ search, setSearch, activeCat, setActiveCat }) {
  return (
    <>
      <GlassContainer style={styles.searchBar} blurType="light" intensity={60}>
        <Feather name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Concert à Dakar..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Feather name="x" size={16} color={colors.textSecondary} onPress={() => setSearch('')} />
        )}
      </GlassContainer>
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
    </>
  )
}

export default function EventSearchScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Tout')
  const [events, setEvents] = useState([])
  const { width } = useWindowDimensions()

  useFocusEffect(useCallback(() => {
    (async () => {
      const data = await fetchEvenementsPublics()
      const formatted = data.map(formaterPourEventCard)
      setEvents(formatted)
      if (formatted.length > 0) {
        setActiveEvent(formatted[0])
        // Précharge toutes les images pour éviter le délai au scroll
        formatted.forEach(ev => { if (ev.affiche_url) Image.prefetch(optimiserUrlCloudinary(ev.affiche_url)) })
      }
    })()
  }, []))

  const [activeEvent, setActiveEvent] = useState(null)

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchCat = activeCat === 'Tout' || e.category === activeCat
      const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [events, activeCat, search])

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      // Trier par pourcentage de visibilité — meilleur event actif avec grille 2 colonnes
      const sorted = [...viewableItems].sort((a, b) => b.percent - a.percent)
      setActiveEvent(sorted[0].item)
    }
  }).current

  // Précharge toutes les images filtrées dès que la liste change
  useEffect(() => {
    filtered.forEach(ev => { if (ev.affiche_url) Image.prefetch(optimiserUrlCloudinary(ev.affiche_url)) })
  }, [filtered])

  // Initialisation de l'event actif au changement de filtrage
  useEffect(() => {
    if (filtered.length > 0) {
      setActiveEvent(filtered[0])
    } else {
      setActiveEvent(null)
    }
  }, [filtered])

  return (
    <View style={styles.container}>
      <OrganisateurLayout />
      <BlurBackground
        category={activeEvent?.category || (activeCat === 'Tout' ? null : activeCat)}
        showImage={!!activeEvent?.affiche_url}
        afficheUrl={activeEvent?.affiche_url}
      />
      <FlatList
        data={filtered}
        renderItem={({ item, index }) => (
          <View style={{ width: (width - spacing.lg * 2 - 12) / 2, marginBottom: 12 }}>
            <AnimatedEventCard
              event={item}
              index={index}
              cardStyle={{ width: '100%', marginRight: 0 }}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
            />
          </View>
        )}
        numColumns={2}
        keyExtractor={(item) => item.id?.toString()}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={<SearchHeader search={search} setSearch={setSearch} activeCat={activeCat} setActiveCat={setActiveCat} />}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="Aucun résultat"
            subtitle="Essaie un autre mot-clé ou catégorie"
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.text,
    padding: 0,
  },
  chipsRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  chipsContent: { paddingHorizontal: spacing.lg, gap: 8 },
  columnWrapper: {
    gap: 12,
  },
})
