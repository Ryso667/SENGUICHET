import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, StatusBar, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { viderTickets } from '../database/database'
import { colors, gradients, shadows, spacing, borderRadius, fonts } from '../constants/theme'

const ROLES = [
  {
    key: 'acheteur',
    title: 'Acheteur',
    subtitle: "Achète tes billets\nen un clic",
    icon: '🎟️',
    gradient: gradients.acheteur,
    screen: 'EntrerNumero',
  },
  {
    key: 'controleur',
    title: 'Contrôleur',
    subtitle: "Scanne les billets\nà l'entrée",
    icon: '📸',
    gradient: gradients.controleur,
    screen: 'ConnexionControleur',
  },
  {
    key: 'organisateur',
    title: 'Organisateur',
    subtitle: 'Crée et gère\ntes événements',
    icon: '🎪',
    gradient: gradients.organisateur,
    screen: 'ConnexionOrganisateur',
  },
]

export default function AccueilChoixScreen({ navigation }) {
  const animations = useRef(ROLES.map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.stagger(120, animations.map(a =>
      Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
    )).start()
  }, [])

  return (
    <LinearGradient colors={gradients.hero} style={s.container}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <Text style={s.logo}>🎫</Text>
        <Text style={s.title}>Senguichet</Text>
        <Text style={s.tagline}>Billets & Événements</Text>
      </View>
      <View style={s.cards}>
        {ROLES.map((role, i) => {
          const scale = animations[i].interpolate({
            inputRange: [0, 1], outputRange: [0.9, 1],
          })
          const opacity = animations[i].interpolate({
            inputRange: [0, 1], outputRange: [0, 1],
          })
          return (
            <Animated.View key={role.key} style={[s.cardWrap, { opacity, transform: [{ scale }] }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate(role.screen)}
              >
                <LinearGradient
                  colors={role.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.card}
                >
                  <Text style={s.cardIcon}>{role.icon}</Text>
                  <Text style={s.cardTitle}>{role.title}</Text>
                  <Text style={s.cardSubtitle}>{role.subtitle}</Text>
                  <View style={s.arrow}>
                    <Text style={s.arrowText}>→</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
      <TouchableOpacity
        style={s.reset}
        onPress={() => {
          Alert.alert('Réinitialiser', 'Effacer toutes les données ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'OK', onPress: async () => {
              const keys = await AsyncStorage.getAllKeys()
              const appKeys = keys.filter(k => k.startsWith('@senguichet_'))
              await AsyncStorage.multiRemove(appKeys)
              await viderTickets()
              Alert.alert('✅ Fait', 'Données effacées. Redémarre l\'app.')
            }},
          ])
        }}
      >
        <Text style={s.resetText}>Réinitialiser</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: spacing.xl },
  logo: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 32, fontFamily: fonts.outfit.bold, color: colors.slate },
  tagline: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.mid, marginTop: 4 },
  cards: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  cardWrap: { borderRadius: borderRadius.xl, ...shadows.lg },
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, minHeight: 140, justifyContent: 'center' },
  cardIcon: { fontSize: 36, marginBottom: spacing.xs },
  cardTitle: { fontSize: 22, fontFamily: fonts.outfit.bold, color: colors.white },
  cardSubtitle: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  arrow: { position: 'absolute', right: spacing.lg, top: '50%', marginTop: -12 },
  arrowText: { fontSize: 24, color: 'rgba(255,255,255,0.6)' },
  reset: { alignItems: 'center', paddingBottom: 40 },
  resetText: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.muted, textDecorationLine: 'underline' },
})
