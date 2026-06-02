// Fond d'écran plein écran avec image Unsplash + overlay dégradé
// Utilisé comme arrière-plan sur tous les écrans acheteur
// Props : category (pour Unsplash), showBlur, intensityOverlay
import { useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import useUnsplashImage from '../hooks/useUnsplashImage'
import { colors } from '../constants/theme'

// Fond immersif avec image Unsplash + overlay dégradé
// category : catégorie d'événement pour la recherche Unsplash
// showBlur : booléen, floute l'image (défaut false)
// intensityOverlay : booléen, force un overlay foncé pour la lisibilité (défaut true)
export default function BlurBackground({ category, showBlur = false, intensityOverlay = true }) {
  const { url } = useUnsplashImage(category)
  const [loaded, setLoaded] = useState(false)

  return (
    <View style={StyleSheet.absoluteFill}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={styles.image}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <LinearGradient
          colors={['#6366F1', '#EC4899']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {loaded && showBlur && (
        <BlurView tint="dark" intensity={10} style={StyleSheet.absoluteFill} />
      )}

      {intensityOverlay && (
        <LinearGradient
          colors={['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.1)', 'rgba(15,23,42,0.1)', 'rgba(15,23,42,0.4)']}
          locations={[0, 0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
})
