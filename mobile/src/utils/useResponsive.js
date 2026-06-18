// Hook React pour le scaling responsive — utilise useWindowDimensions
// Retourne scale/fontScale/isPad qui se mettent à jour au changement d'orientation
// À utiliser dans les composants qui changent de layout selon la largeur d'écran
import { useWindowDimensions, Platform, PixelRatio } from 'react-native'

const BASE_WIDTH = 375

export default function useResponsive() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const scale = (size) => Math.min((screenWidth / BASE_WIDTH) * size, size * 2.0)
  const fontScale = (size) => Math.min((screenWidth / BASE_WIDTH) * size, size * 1.3)
  const lineHeightScale = (size) => Math.min((screenWidth / BASE_WIDTH) * size, size * 1.5)
  const isPad = Platform.isPad
    || (Platform.OS === 'android' && Math.min(screenWidth, screenHeight) / PixelRatio.get() >= 600)

  return { scale, fontScale, lineHeightScale, isPad, screenWidth }
}
