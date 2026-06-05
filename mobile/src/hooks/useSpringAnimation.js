// Hook réutilisable pour les animations spring/timing avec Animated API
// Fournit : animated value, run(), reset(), callback on finish
// Utilise useNativeDriver: true pour les performances
import { useRef, useCallback } from 'react'
import { Animated } from 'react-native'
import { animations } from '../constants/theme'

// Hook d'animation spring générique
// initialValue : valeur de départ (défaut 0)
// Retourne : { value, springIn, fadeIn, slideUp, scalePressIn, scalePressOut, pulse, reset }
export default function useSpringAnimation(initialValue = 0) {
  const value = useRef(new Animated.Value(initialValue)).current

  const springIn = useCallback((toValue = 1, config = {}) => {
    return new Promise((resolve) => {
      Animated.spring(value, {
        toValue,
        friction: animations.spring.friction,
        tension: animations.spring.tension,
        useNativeDriver: true,
        ...config,
      }).start(resolve)
    })
  }, [value])

  const fadeIn = useCallback((duration = animations.timing.duration) => {
    return new Promise((resolve) => {
      Animated.timing(value, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(resolve)
    })
  }, [value])

  const slideUp = useCallback((duration = animations.timing.duration) => {
    return new Promise((resolve) => {
      Animated.timing(value, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start(resolve)
    })
  }, [value])

  const scalePressIn = useCallback(() => {
    Animated.spring(value, {
      toValue: animations.scalePress.toValue,
      friction: animations.scalePress.friction,
      tension: animations.scalePress.tension,
      useNativeDriver: true,
    }).start()
  }, [value])

  const scalePressOut = useCallback(() => {
    Animated.spring(value, {
      toValue: 1,
      friction: animations.scalePress.friction,
      tension: animations.scalePress.tension,
      useNativeDriver: true,
    }).start()
  }, [value])

  const pulse = useCallback((config = {}) => {
    const { minScale = 1, maxScale = 1.02, duration = 2000 } = config
    const sequence = Animated.sequence([
      Animated.timing(value, { toValue: maxScale, duration: duration / 2, useNativeDriver: true }),
      Animated.timing(value, { toValue: minScale, duration: duration / 2, useNativeDriver: true }),
    ])
    const loop = Animated.loop(sequence)
    loop.start()
    return loop
  }, [value])

  const reset = useCallback((toValue = initialValue) => {
    value.setValue(toValue)
  }, [value, initialValue])

  return { value, springIn, fadeIn, slideUp, scalePressIn, scalePressOut, pulse, reset }
}
