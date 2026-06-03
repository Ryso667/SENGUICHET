// Thème sombre du dashboard organisateur
// Fond : #0D1B2A (bleu nuit), Accent : #00C8FF (cyan vif)
export const colors = {
  bg: '#0D1B2A',
  surface: '#152232',
  border: 'rgba(0, 200, 255, 0.15)',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A0B4C8',
  accent: '#00C8FF',
  blue: '#0077FF',
  success: '#00E5A0',
  error: '#FF4D6D',
  warning: '#FFB347',
  muted: '#6B7280',
}

export const glass = {
  bg: 'rgba(0, 200, 255, 0.05)',
  darkBg: 'rgba(0, 200, 255, 0.08)',
  border: 'rgba(0, 200, 255, 0.15)',
  blur: 20,
  radius: 12,
}

export const gradients = {
  primary: ['#00C8FF', '#0077FF'],
  organisateur: ['#00C8FF', '#0077FF'],
  success: ['#00E5A0', '#00C8FF'],
  error: ['#FF4D6D', '#FF6B8A'],
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
}

export const fonts = {
  outfit: {
    black: 'Outfit_900Black',
    extraBold: 'Outfit_800ExtraBold',
    bold: 'Outfit_700Bold',
    semiBold: 'Outfit_600SemiBold',
    regular: 'Outfit_400Regular',
  },
  jakarta: {
    semiBold: 'PlusJakartaSans_600SemiBold',
    medium: 'PlusJakartaSans_500Medium',
    regular: 'PlusJakartaSans_400Regular',
  },
}
