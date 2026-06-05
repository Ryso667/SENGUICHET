// Composant de notification temporaire (toast)
// Apparaît en haut de l'écran, disparaît automatiquement après 3 secondes
// Supporte le balayage vers le haut pour fermer
import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, PanResponder, View } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'

// Couleur de fond selon le type de toast
const TYPE_COLORS = {
  success: colors.green,
  error: colors.red,
  info: colors.accent,
}

const AUTODISMISS_MS = 3000
const HAUTEUR_INITIALE = -150

// Toast avec animation de glissement depuis le haut
// Props : message (string), type ("success"|"error"|"info"), onDismiss (function)
export default function Toast({ message, type = 'info', onDismiss }) {
  const translateY = useRef(new Animated.Value(HAUTEUR_INITIALE)).current
  const opacity = useRef(new Animated.Value(0)).current

  // Référence mutable pour que PanResponder puisse appeler dismiss
  const dismissRef = useRef(null)

  // Animation d'entrée : glisse depuis le haut avec fondu
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start()

    // Disparition automatique après délai
    const timer = setTimeout(() => {
      if (dismissRef.current) dismissRef.current()
    }, AUTODISMISS_MS)

    return () => clearTimeout(timer)
  }, [])

  // Animation de disparition puis callback
  dismissRef.current = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HAUTEUR_INITIALE,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss()
    })
  }

  // PanResponder pour le balayage vers le haut (swipe to dismiss)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -50) {
          // Balayé vers le haut → fermer
          if (dismissRef.current) dismissRef.current()
        } else {
          // Pas assez balayé → retour à la position initiale
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const bgColor = TYPE_COLORS[type] || colors.accent

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, transform: [{ translateY }], opacity },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    elevation: 10,
  },
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.jakarta.medium,
    textAlign: 'center',
  },
})
