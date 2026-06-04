// Écran de sélection du rôle (Acheteur / Contrôleur / Organisateur)
// Design glass immersif (Apple Invites) : fond sombre + cartes glass avec accent par rôle
import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fonts, spacing, borderRadius, glass, categoryGradients } from '../constants/theme'
import GlassContainer from '../components/GlassContainer'

const ROLES = [
  {
    key: 'acheteur',
    title: 'Acheteur',
    subtitle: "Achète tes billets\nen un clic",
    icon: 'ticket-outline',
    accent: '#6366F1',
    screen: null,
  },
  {
    key: 'organisateur',
    title: 'Organisateur',
    subtitle: 'Crée et gère\ntes événements',
    icon: 'calendar-star',
    accent: '#00E5A0',
    screen: 'ConnexionOrganisateur',
  },
]

export default function AccueilChoixScreen({ navigation }) {
  const { role, nettoyerSession } = useAuth()
  const insets = useSafeAreaInsets()
  const anims = useRef(ROLES.map(() => new Animated.Value(0))).current
  const [redirection, setRedirection] = useState(null)

  useEffect(() => {
    Animated.stagger(120, anims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
    )).start()
  }, [])

  // Si on vient de changer de rôle, on navigue vers l'écran cible
  useFocusEffect(() => {
    if (redirection) {
      const target = redirection
      setRedirection(null)
      navigation.navigate(target)
    }
  })

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Fond dégradé doux catégorie par défaut */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b0b20' }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: categoryGradients.default[0] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo_app.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Senguichet</Text>
      </View>

      {/* Cartes glass */}
      <View style={styles.cards}>
        {ROLES.map((role, i) => {
          const scale = anims[i].interpolate({
            inputRange: [0, 1], outputRange: [0.92, 1],
          })
          const opacity = anims[i].interpolate({
            inputRange: [0, 1], outputRange: [0, 1],
          })
          return (
            <Animated.View key={role.key} style={[styles.cardWrap, { opacity, transform: [{ scale }] }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                  onPress={async () => {
                    const target = role.screen || 'SocialAuth'
                    if (role) {
                      setRedirection(target)
                      await nettoyerSession()
                    } else {
                      navigation.navigate(target)
                    }
                  }}
              >
                <GlassContainer style={styles.card} blurType="light" intensity={60}>
                  <View style={[styles.accentBar, { backgroundColor: role.accent }]} />
                  <View style={styles.cardContent}>
                    <MaterialCommunityIcons name={role.icon} size={32} color={role.accent} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{role.title}</Text>
                      <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
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
  title: { fontSize: 32, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: 1 },
  cards: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: 60 },
  cardWrap: { borderRadius: borderRadius.xl },
  card: { borderRadius: borderRadius.xl, flexDirection: 'row', overflow: 'hidden' },
  accentBar: { width: 4, borderTopLeftRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.xl },
  cardContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, gap: spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 20, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
})
