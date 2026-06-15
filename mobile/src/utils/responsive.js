import { Dimensions, Platform } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const BASE_WIDTH = 375 // iPhone 14 base

export const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size

export const fontScale = (size) => {
  const scaled = (SCREEN_WIDTH / BASE_WIDTH) * size
  return Math.min(scaled, size * 1.3) // cap at 1.3x to avoid absurdly large fonts
}

export const isPad = Platform.isPad || (Platform.OS === 'android' && Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600)
