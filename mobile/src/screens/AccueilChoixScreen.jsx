// Écran de sélection du rôle (Acheteur / Contrôleur / Organisateur)
// Design glass immersif : fond indigo + cartes glass avec accent par rôle
// Palette : violet doux (acheteur), cyan (contrôleur), vert doux (organisateur)
import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts, spacing, borderRadius, shadows, categoryGradients } from '../constants/theme'
import GlassContainer from '../components/GlassContainer'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    key: 'acheteur',
    title: 'Acheteur',
    subtitle: "Achète tes billets\nen un clic",
    icon: 'ticket-outline',
    accent: '#00BCD4',
    borderColor: '#00BCD4',
    screen: null,
  },
  {
    key: 'controleur',
    title: 'Contrôleur',
    subtitle: "Scanne les billets\nà l'entrée",
    icon: 'qrcode-scan',
    accent: '#3D5AFE',
    borderColor: '#3D5AFE',
    screen: 'ConnexionControleur',
  },
  {
    key: 'organisateur',
    title: 'Organisateur',
    subtitle: 'Crée et gère\ntes événements',
    icon: 'calendar-star',
    accent: '#4CAF50',
    borderColor: '#4CAF50',
    screen: 'ConnexionOrganisateur',
  },
]

export default function AccueilChoixScreen({ navigation }) {
  const { role } = useAuth()
  const insets = useSafeAreaInsets()
  const anims = useRef(ROLES.map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.stagger(120, anims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
    )).start()
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Fond dégradé doux catégorie par défaut */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: categoryGradients.default[0] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: `https://backend-beta-six-39.vercel.app/uploads/logo.jpg` }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Senguichet</Text>
      </View>

      {/* Cartes glass */}
      <View style={styles.cards}>
        {ROLES.map((r, i) => {
          const scale = anims[i].interpolate({
            inputRange: [0, 1], outputRange: [0.92, 1],
          })
          const opacity = anims[i].interpolate({
            inputRange: [0, 1], outputRange: [0, 1],
          })
          return (
            <Animated.View key={r.key} style={[styles.cardWrap, { opacity, transform: [{ scale }] }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                  onPress={() => {
                    // Si déjà connecté avec ce rôle, retour direct sans ré-authentification
                    if (r.key === role) {
                      const homeMap = { acheteur: 'Home', controleur: 'ControleurTabs', organisateur: 'OrganisateurTabs' }
                      navigation.navigate(homeMap[r.key])
                    } else {
                      const target = r.screen || 'SocialAuth'
                      navigation.navigate(target)
                    }
                  }}
              >
                <GlassContainer borderLeftColor={r.borderColor} style={styles.card}>
                  <View style={styles.cardContent}>
                    <MaterialCommunityIcons name={r.icon} size={32} color={r.accent} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{r.title}</Text>
                      <Text style={styles.cardSubtitle}>{r.subtitle}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.navInactive} />
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: spacing.xl },
  logo: { width: 88, height: 88, marginBottom: spacing.sm, borderRadius: 20 },
  title: { fontSize: 32, fontFamily: fonts.outfit.bold, color: colors.text, letterSpacing: 1 },
  cards: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: 60 },
  cardWrap: { borderRadius: borderRadius.xl },
  card: {
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.md,
  },
  cardContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, gap: spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 20, fontFamily: fonts.outfit.bold, color: colors.text, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: 2 },
})
