// Fond d'écran plein écran avec gradient doux par catégorie (style Apple Music)
// Affiche un dégradé de couleurs atténuées correspondant à la catégorie d'événement
// Props : category, posterUrl (optionnel, pour effet Apple Music avec image), intensityOverlay
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { categoryGradients, glass } from '../constants/theme'

// Fond immersif avec gradient doux par catégorie
// category : catégorie d'événement (Concert, Festival, etc.) — définit les couleurs du fond
// intensityOverlay : booléen, overlay sombre pour lisibilité (défaut true)
export default function BlurBackground({ category, intensityOverlay = true }) {
  const gradient = categoryGradients[category] || categoryGradients.default

  return (
    <LinearGradient
      colors={gradient}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
    >
      {intensityOverlay && (
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)']}
          locations={[0, 0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </LinearGradient>
  )
}
