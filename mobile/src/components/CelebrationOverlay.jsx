// Overlay de célébration après un achat réussi
// Affiche "Paiement réussi !" avec animation spring + émojis qui tombent
import { useEffect, useRef, useMemo, useCallback } from 'react'
import { Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { fonts } from '../constants/theme'
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
  const mountedRef = useRef(true)
  // Stocke les animations pour pouvoir les arrêter au cleanup
  const animsRef = useRef([])

  const stopperTout = useCallback(() => {
    clearTimeout(timerRef.current)
    animsRef.current.forEach(a => a.stop())
    animsRef.current = []
  }, [])

  const timerRef = useRef(null)
  // Évite la fuite mémoire si onFinish change entre render
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  useEffect(() => {
    if (!visible) {
      stopperTout()
      return
    }

    mountedRef.current = true
    animsRef.current = []

    // Reset des valeurs d'animation
    scaleAnim.setValue(0)
    opacityAnim.setValue(0)
    particules.forEach((_, i) => {
      fallAnims[i].setValue(-50)
      fadeAnims[i].setValue(0)
    })

    hapticSuccess()

    // Animation du texte: scale bounce
    const springAnim = Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    })
    springAnim.start()
    animsRef.current.push(springAnim)

    // Opacité de fond
    const fadeInAnim = Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    })
    fadeInAnim.start()
    animsRef.current.push(fadeInAnim)

    // Lancer les particules avec délai
    particules.forEach((_, i) => {
      const anim = Animated.sequence([
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
      ])
      anim.start()
      animsRef.current.push(anim)
    })

    // Disparaître après 2s
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      const fadeOutAnim = Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
      fadeOutAnim.start(() => {
        if (mountedRef.current) onFinishRef.current?.()
      })
      animsRef.current.push(fadeOutAnim)
    }, 2000)

    return () => {
      mountedRef.current = false
      stopperTout()
    }
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
