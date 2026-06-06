// Fond d'écran plein écran avec image par catégorie + dégradé (style Apple Music)
// Affiche l'image derrière un dégradé + overlay de lisibilité
// Le dégradé s'affiche immédiatement, l'image se superpose en fondu dès qu'elle est chargée
// Les URLs Cloudinary sont optimisées (w_400,q_auto,f_webp) pour un chargement rapide
// Props : category, intensityOverlay, showImage, afficheUrl
import { useEffect, useRef } from 'react'
import { View, Animated, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { categoryGradients } from '../constants/theme'
import { getCategoryImageUrl } from '../config/images'

// Optimise les URLs Cloudinary pour un chargement plus rapide
export function optimiserUrlCloudinary(url) {
  if (!url || !url.includes('cloudinary')) return url
  return url.replace('/upload/', '/upload/w_200,q_auto,f_webp/')
}

export default function BlurBackground({ category, intensityOverlay = true, showImage = true, afficheUrl }) {
  const gradient = categoryGradients[category] || categoryGradients.default
  // Priorité : afficheUrl de l'événement → image par catégorie (Unsplash)
  const imageUrl = showImage ? (afficheUrl || (category ? getCategoryImageUrl(category) : null)) : null
  const imageOpacity = useRef(new Animated.Value(0)).current
  const loadKey = useRef(0)

  // Le dégradé s'affiche immédiatement.
  // L'image se télécharge en arrière-plan et apparaît en fondu via onLoad
  // loadKey incrémenté force le remount même pour une URL déjà vue (cache)
  useEffect(() => {
    if (imageUrl) {
      imageOpacity.setValue(0)
      loadKey.current += 1
    }
  }, [imageUrl])

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.baseBg} />
      {imageUrl && (
        <Animated.Image
          key={`bg-${loadKey.current}`}
          source={{ uri: optimiserUrlCloudinary(imageUrl) }}
          style={[StyleSheet.absoluteFill, { opacity: imageOpacity, transform: [{ scale: 1.1 }] }]}
          resizeMode="cover"
          blurRadius={20}
          onLoad={() => {
            Animated.timing(imageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
          }}
        />
      )}
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      {intensityOverlay && (
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  baseBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a1a',
  },
})
