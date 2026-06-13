// Image avec chargement progressif : squelette animé → fondu de l'image
// Remplace le flash blanc par un placeholder élégant aux couleurs du thème
// Props : uri, style, resizeMode, skeletonType, ...props Image
import { useState, useRef, useCallback } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import Skeleton from './Skeleton'

export default function ProgressiveImage({ uri, style, resizeMode = 'cover', skeletonType, onLoad, onError, ...props }) {
  const [etat, setEtat] = useState('chargement') // chargement | chargée | erreur
  const opacity = useRef(new Animated.Value(0)).current

  // Passage en fondu une fois l'image chargée
  const handleLoad = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setEtat('chargée'))
    onLoad?.()
  }, [onLoad, opacity])

  // En cas d'erreur, on garde le squelette affiché
  const handleError = useCallback(() => {
    setEtat('erreur')
    onError?.()
  }, [onError])

  return (
    <View style={[s.container, style]}>
      {/* Squelette visible tant que l'image n'est pas chargée */}
      {etat !== 'chargée' && (
        <Skeleton type={skeletonType || 'image'} style={StyleSheet.absoluteFill} />
      )}
      {uri && (
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { opacity: etat === 'chargée' ? 1 : opacity }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
})
