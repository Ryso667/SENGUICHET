// Fond d'écran plein écran avec image de fête par catégorie + dégradé (style Apple Music)
// Affiche l'image Unsplash de la catégorie derrière un dégradé + overlay de lisibilité
// Props : category, intensityOverlay, showImage
import { View, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { categoryGradients } from '../constants/theme'
import { getCategoryImageUrl } from '../config/images'

export default function BlurBackground({ category, intensityOverlay = true, showImage = true, afficheUrl }) {
  const gradient = categoryGradients[category] || categoryGradients.default
  // Priorité : afficheUrl de l'événement → image par catégorie (Unsplash)
  const imageUrl = showImage ? (afficheUrl || (category ? getCategoryImageUrl(category) : null)) : null

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.baseBg} />
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
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
