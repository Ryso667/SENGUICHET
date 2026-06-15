import { Dimensions, Platform, PixelRatio } from 'react-native'

const BASE_WIDTH = 375 // iPhone 14 base
let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Permet au scaling de se mettre à jour au changement d'orientation iPad
try {
  Dimensions.addEventListener('change', ({ window }) => {
    SCREEN_WIDTH = window.width
    SCREEN_HEIGHT = window.height
  })
} catch (_) {}

// Layout scaling (dimensions, padding, gap…)
export const scale = (size) => Math.min((SCREEN_WIDTH / BASE_WIDTH) * size, size * 2.0)

// Font scaling (capped à 1.3× pour éviter des polices démesurées)
export const fontScale = (size) => {
  const scaled = (SCREEN_WIDTH / BASE_WIDTH) * size
  return Math.min(scaled, size * 1.3)
}

// Line-height scaling (capped à 1.5×)
export const lineHeightScale = (size) => Math.min((SCREEN_WIDTH / BASE_WIDTH) * size, size * 1.5)

// Détection iPad (iOS Platform.isPad + Android via largeur en dp)
export const isPad = Platform.isPad
  || (Platform.OS === 'android' && Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) / PixelRatio.get() >= 600)
