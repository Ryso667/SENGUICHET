// Overlay de célébration après un achat réussi
// Affiche "Paiement réussi !" avec animation spring + émojis qui tombent
import { useEffect, useRef, useMemo } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { hapticSuccess } from '../utils/haptics'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const EMOJIS = ['🎫', '🎉', '✨', '🎊', '🎯']
const NUM_PARTICLES = 15

// Génère une configuration aléatoire pour une particule
function creerParticule() {
  return {
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 500,
    duree: 1000 + Math.random() * 1000,
    taille: 20 + Math.random() * 16,
  }
}

export default function CelebrationOverlay({ visible, onFinish }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const particules = useRef(Array.from({ length: NUM_PARTICLES }, creerParticule)).current
  const fallAnims = useRef(particules.map(() => new Animated.Value(-50))).current
  const fadeAnims = useRef(particules.map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (!visible) return

    hapticSuccess()

    // Animation du texte: scale bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start()

    // Opacité de fond
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    // Lancer les particules avec délai
    particules.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(particules[i].delay),
        Animated.parallel([
          Animated.timing(fallAnims[i], {
            toValue: SCREEN_HEIGHT + 50,
            duration: particules[i].duree,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fadeAnims[i], { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.delay(particules[i].duree - 200),
            Animated.timing(fadeAnims[i], { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
        ]),
      ]).start()
    })

    // Disparaître après 2s
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish?.())
    }, 2000)

    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} pointerEvents="none">
      <Animated.Text style={[styles.title, { transform: [{ scale: scaleAnim }] }]}>
        Paiement réussi !
      </Animated.Text>
      {particules.map((p, i) => (
        <Animated.View
          key={i}
          style={[styles.particle, {
            left: p.x,
            opacity: fadeAnims[i],
            transform: [{ translateY: fallAnims[i] }],
          }]}
        >
          <Text style={{ fontSize: p.taille }}>{p.emoji}</Text>
        </Animated.View>
      ))}
    </Animated.View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  title: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 28,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
})
