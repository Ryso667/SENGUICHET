// Écran d'accueil — thème clair
// Affiche directement les événements disponibles
// Header : logo + icône profil + Contact
// Search bar, filtres catégories, carousel à la une, liste verticale
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import EventCarousel from '../components/EventCarousel'
import AnimatedEventCard from '../components/AnimatedEventCard'
import Skeleton from '../components/Skeleton'
import FavoriButton from '../components/FavoriButton'
import { formaterDateLisible, formaterCompteRebours } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'
import { useAuth } from '../context/AuthContext'
import * as Location from 'expo-location'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Théâtre', 'Conférence', 'Atelier']

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { role, email: authEmail, numeroTel, acheteurEmailSuggestion } = useAuth()
  const [evenements, setEvenements] = useState([])
  const [categorieActive, setCategorieActive] = useState('Tout')
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState(false)
  const [categoriesAchetees, setCategoriesAchetees] = useState([])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setChargement(true)
      try {
        const events = await fetchEvenementsPublics()
        const formatted = events.map(formaterPourEventCard)
        setEvenements(formatted)
      } catch (e) {
        console.warn('[Home] Erreur chargement:', e)
      } finally {
        setChargement(false)
      }
    })
    return unsubscribe
  }, [navigation])

  // Demande la permission de localisation au montage
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      setLocationPermission(true)
      const loc = await Location.getCurrentPositionAsync({})
      setUserLocation(loc.coords)
    })()
  }, [])

  // Récupère les catégories des billets déjà achetés pour les suggestions
  useEffect(() => {
    if (!role && !authEmail && !acheteurEmailSuggestion) return
    (async () => {
      try {
        const email = authEmail || acheteurEmailSuggestion
        const tickets = await mesBillets(numeroTel, email)
        const categories = [...new Set(tickets.map(t => t.categorie).filter(Boolean))]
        setCategoriesAchetees(categories)
      } catch (e) {
        console.warn('[Home] Erreur récupération catégories achetées:', e)
      }
    })()
  }, [role, authEmail, acheteurEmailSuggestion, numeroTel])

  const evenementsFiltres = evenements.filter(ev => {
    const matchCategorie = categorieActive === 'Tout' || ev.category === categorieActive
    const matchRecherche = !recherche || ev.title?.toLowerCase().includes(recherche.toLowerCase())
    return matchCategorie && matchRecherche
  })

  // Calcule la distance Haversine en km entre deux points GPS
  function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // Section "Incontournables" : top 3 par popularite (fallback premiers 3)
  const incontournables = evenements
    .filter(ev => ev.popularite !== undefined)
    .sort((a, b) => (b.popularite || 0) - (a.popularite || 0))
    .slice(0, 3)
  const fallbackIncontournables = evenements.slice(0, 3)

  // Section "Près de chez toi" : événements dans un rayon de 50 km
  const proximite = locationPermission && userLocation
    ? evenements
        .filter(ev => ev.latitude && ev.longitude)
        .map(ev => ({
          ...ev,
          distance: calculerDistance(userLocation.latitude, userLocation.longitude, ev.latitude, ev.longitude),
        }))
        .filter(ev => ev.distance <= 50)
        .sort((a, b) => a.distance - b.distance)
    : []

  // Section "Ça pourrait te plaire" : événements dont la catégorie correspond aux achats précédents
  const suggestions = categoriesAchetees.length > 0
    ? evenements.filter(ev => categoriesAchetees.includes(ev.category))
    : []

  const une = evenementsFiltres.slice(0, 5)
  const tous = evenementsFiltres.slice(5)

  const renderEventCard = (item, distance = null) => {
    const compteRebours = formaterCompteRebours(item.date)
    return (
    <TouchableOpacity
      key={item.id}
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      activeOpacity={0.7}
    >
      <View style={styles.eventCardImage}>
        <View style={[styles.eventCardImgBg, { backgroundColor: item.categoryColor || '#D1FAE5' }]}>
          <Text style={styles.eventCardEmoji}>{item.emoji || '\uD83C\uDFAB'}</Text>
        </View>
        {distance !== null && (
          <View style={styles.eventCardDistance}>
            <Feather name="map-pin" size={10} color="#065F46" />
            <Text style={styles.eventCardDistanceText}>{Math.round(distance)} km</Text>
          </View>
        )}
        {compteRebours && (
          <View style={styles.eventCardCountdown}>
            <Feather name="clock" size={10} color="#92400E" />
            <Text style={styles.eventCardCountdownText}>{compteRebours}</Text>
          </View>
        )}
        <View style={[styles.eventCardBadge, { backgroundColor: item.isPaid ? '#FFF7ED' : '#D1FAE5' }]}>
          <Text style={[styles.eventCardBadgeText, { color: item.isPaid ? '#F97316' : '#10B981' }]}>
            {item.isPaid ? item.prix + ' FCFA' : 'Gratuit'}
          </Text>
        </View>
        <FavoriButton
          eventId={item.id}
          eventData={{
            title: item.title,
            date: item.date,
            location: item.lieu,
            category: item.category,
            affiche_url: item.affiche_url,
            month: item.month,
            day: item.day,
            emoji: item.emoji,
            priceLabel: item.priceLabel,
          }}
          size={20}
          inactiveColor={colors.textTertiary}
          style={styles.favoriBtn}
        />
      </View>
      <View style={styles.eventCardBody}>
        <Text style={styles.eventCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.eventCardMeta}>
          {formaterDateLisible(item.date)} · {item.lieu}
        </Text>
      </View>
    </TouchableOpacity>
  )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo_app.jpeg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerSen}>SEN</Text><Text style={styles.headerGuichet}>GUICHET</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.headerIcon}>
            <Feather name="calendar" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.headerIcon}>
            <Feather name="user" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Support')} style={styles.headerContact}>
            <Text style={styles.headerContactText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor="#9CA3AF"
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categorieActive === cat && styles.catChipActive]}
              onPress={() => setCategorieActive(cat)}
            >
              <Text style={[styles.catChipText, categorieActive === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section À la une — EventCarousel conservé */}
        {chargement ? (
          <>
            <View style={styles.sectionHeader}>
              <Skeleton type="text" width={140} height={20} />
            </View>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Skeleton type="event-card" />
            </View>
          </>
        ) : une.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Événements à la une</Text>
            </View>
            <EventCarousel
              events={une}
              onPress={(event) => navigation.navigate('EventDetail', { eventId: event.id, event })}
            />
          </>
        )}

        {/* Section 🔥 Incontournables : top 3 en horizontal avec images réelles */}
        {!chargement && (incontournables.length >= 2 || fallbackIncontournables.length >= 2) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Incontournables</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
            >
              {(incontournables.length >= 2 ? incontournables : fallbackIncontournables).map(item => (
                <View key={item.id} style={{ width: 200 }}>
                  <AnimatedEventCard
                    event={item}
                    onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
                    cardStyle={{ width: 200 }}
                    height={260}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Section 💡 Ça pourrait te plaire : basé sur les catégories des achats précédents */}
        {!chargement && suggestions.length >= 2 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 Ça pourrait te plaire</Text>
            </View>
            <View style={styles.eventsList}>
              {suggestions.map(item => renderEventCard(item))}
            </View>
          </>
        )}

        {/* Section 📍 Près de chez toi : événements dans un rayon de 50 km */}
        {!chargement && proximite.length >= 2 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Près de chez toi</Text>
            </View>
            <View style={styles.eventsList}>
              {proximite.map(item => renderEventCard(item, item.distance))}
            </View>
          </>
        )}

        {/* Section Tous les événements */}
        {!chargement && tous.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tous les événements</Text>
            </View>
            <View style={styles.eventsList}>
              {tous.map(item => renderEventCard(item))}
            </View>
          </>
        )}

        {!chargement && evenementsFiltres.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun événement</Text>
            <Text style={styles.emptySub}>Aucun événement trouvé pour cette recherche</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit_800ExtraBold' },
  headerSen: { color: '#111827' },
  headerGuichet: { color: '#10B981' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerContact: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#D1FAE5' },
  headerContactText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#10B981' },
  scroll: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 24,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: '#111827', padding: 0 },
  catRow: { paddingHorizontal: 16, marginBottom: 12 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginRight: 8,
  },
  catChipActive: { backgroundColor: '#10B981' },
  catChipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#374151' },
  catChipTextActive: { color: '#FFFFFF' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#111827' },
  eventsList: { paddingHorizontal: 16, gap: 12 },
  eventCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'hidden', marginBottom: 4,
  },
  eventCardImage: { height: 140, position: 'relative' },
  eventCardImgBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eventCardEmoji: { fontSize: 40 },
  eventCardBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  eventCardBadgeText: { fontSize: 11, fontFamily: 'Outfit_700Bold' },
  favoriBtn: {
    position: 'absolute',
    top: 8,
    left: 10,
    zIndex: 10,
  },
  eventCardCountdown: {
    position: 'absolute',
    top: 42,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    zIndex: 10,
  },
  eventCardCountdownText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#92400E',
  },
  eventCardDistance: {
    position: 'absolute',
    top: 42,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    zIndex: 10,
  },
  eventCardDistanceText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#065F46',
  },
  eventCardBody: { padding: 14 },
  eventCardTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#111827', marginBottom: 4 },
  eventCardMeta: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#111827', marginTop: 12 },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 4, textAlign: 'center' },
})
