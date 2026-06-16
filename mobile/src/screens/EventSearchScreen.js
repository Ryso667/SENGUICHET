// Écran de recherche d'événements — version Apple Invites
// Fond : images Unsplash en mosaïque
// Barre de recherche glass, chips catégories, grille 2 colonnes
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, useWindowDimensions, ScrollView, Image, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import EmptyState from '../components/EmptyState'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { fetchEvenementsPublics } from '../services/eventService'
import { formaterPourEventCard } from '../utils/eventUtils'
import { optimiserUrlCloudinary } from '../components/BlurBackground'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Theatre', 'Conference']

// Composant stable pour le header de la FlatList — évite les remounts sur chaque render
function SearchHeader({ search, setSearch, activeCat, setActiveCat, filtresActifs, onOpenFilters, colors, styles }) {
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
        <TouchableOpacity onPress={onOpenFilters} style={styles.filterBtn}>
          <Feather name="sliders" size={16} color={filtresActifs > 0 ? colors.accent : colors.textSecondary} />
          {filtresActifs > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filtresActifs}</Text>
            </View>
          )}
        </TouchableOpacity>
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
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Tout')
  const [events, setEvents] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [filtres, setFiltres] = useState({ dateDebut: '', dateFin: '', prixMin: '', prixMax: '', lieu: '' })
  const { width } = useWindowDimensions()

  const nbFiltresActifs = [filtres.dateDebut, filtres.dateFin, filtres.prixMin, filtres.prixMax, filtres.lieu].filter(Boolean).length

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
      const matchLieu = !filtres.lieu || e.lieu?.toLowerCase().includes(filtres.lieu.toLowerCase())
      // Filtre par date
      const dateEvent = e.date ? new Date(e.date) : null
      const matchDateDebut = !filtres.dateDebut || !dateEvent || dateEvent >= new Date(filtres.dateDebut.split('/').reverse().join('-'))
      const matchDateFin = !filtres.dateFin || !dateEvent || dateEvent <= new Date(filtres.dateFin.split('/').reverse().join('-'))
      // Filtre par prix (priceMin est le prix minimum du billet)
      const prix = e.priceMin || 0
      const matchPrixMin = !filtres.prixMin || prix >= parseInt(filtres.prixMin)
      const matchPrixMax = !filtres.prixMax || prix <= parseInt(filtres.prixMax)
      return matchCat && matchSearch && matchLieu && matchDateDebut && matchDateFin && matchPrixMin && matchPrixMax
    })
  }, [events, activeCat, search, filtres])

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
        ListHeaderComponent={<SearchHeader search={search} setSearch={setSearch} activeCat={activeCat} setActiveCat={setActiveCat} filtresActifs={nbFiltresActifs} onOpenFilters={() => setShowFilters(true)} colors={colors} styles={styles} />}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="Aucun résultat"
            subtitle="Essaie un autre mot-clé ou catégorie"
          />
        }
      />

      {/* Modal filtres */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitre}>Filtres</Text>
              <TouchableOpacity onPress={() => { setFiltres({ dateDebut: '', dateFin: '', prixMin: '', prixMax: '', lieu: '' }) }}>
                <Text style={styles.modalReset}>Tout effacer</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Période</Text>
            <View style={styles.filterRow}>
              <TextInput style={[styles.filterInput, { flex: 1 }]} placeholder="Du (JJ/MM/AAAA)" placeholderTextColor={colors.textTertiary} value={filtres.dateDebut} onChangeText={v => setFiltres(f => ({ ...f, dateDebut: v }))} />
              <TextInput style={[styles.filterInput, { flex: 1 }]} placeholder="Au (JJ/MM/AAAA)" placeholderTextColor={colors.textTertiary} value={filtres.dateFin} onChangeText={v => setFiltres(f => ({ ...f, dateFin: v }))} />
            </View>

            <Text style={styles.filterLabel}>Budget</Text>
            <View style={styles.filterRow}>
              <TextInput style={[styles.filterInput, { flex: 1 }]} placeholder="Min (FCFA)" placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={filtres.prixMin} onChangeText={v => setFiltres(f => ({ ...f, prixMin: v }))} />
              <TextInput style={[styles.filterInput, { flex: 1 }]} placeholder="Max (FCFA)" placeholderTextColor={colors.textTertiary} keyboardType="numeric" value={filtres.prixMax} onChangeText={v => setFiltres(f => ({ ...f, prixMax: v }))} />
            </View>

            <Text style={styles.filterLabel}>Lieu</Text>
            <TextInput style={[styles.filterInput]} placeholder="Ville ou lieu" placeholderTextColor={colors.textTertiary} value={filtres.lieu} onChangeText={v => setFiltres(f => ({ ...f, lieu: v }))} />

            <TouchableOpacity style={styles.modalValider} onPress={() => setShowFilters(false)}>
              <Text style={styles.modalValiderText}>Appliquer ({events.filter(e => {
                const matchCat = activeCat === 'Tout' || e.category === activeCat
                const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
                const matchLieu = !filtres.lieu || e.lieu?.toLowerCase().includes(filtres.lieu.toLowerCase())
                const dateEvent = e.date ? new Date(e.date) : null
                const matchDateDebut = !filtres.dateDebut || !dateEvent || dateEvent >= new Date(filtres.dateDebut.split('/').reverse().join('-'))
                const matchDateFin = !filtres.dateFin || !dateEvent || dateEvent <= new Date(filtres.dateFin.split('/').reverse().join('-'))
                const prix = e.priceMin || 0
                const matchPrixMin = !filtres.prixMin || prix >= parseInt(filtres.prixMin)
                const matchPrixMax = !filtres.prixMax || prix <= parseInt(filtres.prixMax)
                return matchCat && matchSearch && matchLieu && matchDateDebut && matchDateFin && matchPrixMin && matchPrixMax
              }).length} résultats)</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
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
  filterBtn: { marginLeft: 8, position: 'relative' },
  filterBadge: { position: 'absolute', top: -6, right: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitre: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: colors.text },
  modalReset: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: colors.accent },
  filterLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 12 },
  filterInput: { backgroundColor: colors.inputBg, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text, marginBottom: 12 },
  modalValider: { backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  modalValiderText: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
})
