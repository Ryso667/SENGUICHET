// Fond d'écran plein écran avec gradient par catégorie (style Apple Music)
// Fond sombre + dégradé de couleurs par catégorie + overlay pour lisibilité
// Props : category, intensityOverlay
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { categoryGradients } from '../constants/theme'

export default function BlurBackground({ category, intensityOverlay = true }) {
  const gradient = categoryGradients[category] || categoryGradients.default

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.baseBg} />
      <LinearGradient
        colors={gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      {intensityOverlay && (
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.55)']}
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
