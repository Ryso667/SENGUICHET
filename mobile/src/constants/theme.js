// Thème Indigo doux - Fond #1C2166, primary #5C6BC0, accent #7986CB
// Palette professionnelle reposante, fatigue visuelle minimale
export const colors = {
  bg: '#1C2166',
  bgSecondary: '#252B7A',
  surface: '#252B7A',
  border: 'rgba(121, 134, 203, 0.15)',
  primary: '#5C6BC0',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#C5CAE9',
  textTertiary: '#B0BEC5',
  accent: '#7986CB',
  accentLight: 'rgba(121, 134, 203, 0.15)',
  green: '#66BB6A',
  greenLight: 'rgba(102, 187, 106, 0.15)',
  red: '#FF4D6D',
  violet: '#9575CD',
  orange: '#FFA726',
  cyan: '#4DD0E1',
  glassWhite: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassDark: 'rgba(0,0,0,0.15)',
  inputBg: '#2A3190',
  inputBorder: '#3F4DB0',
  inputBorderFocus: '#7986CB',
  textWhite: '#FFFFFF',
  textWhiteMuted: 'rgba(255,255,255,0.7)',
  slate: '#252B7A',
  mid: '#C5CAE9',
  muted: '#9FA8DA',
  placeholder: '#9FA8DA',
  navInactive: '#9FA8DA',
  navActive: '#FFFFFF',
  danger: '#FF4D6D',
  warning: '#FFA726',
  success: '#66BB6A',
}

// === GLASS (verre dépoli) ===
export const glass = {
  bg: 'rgba(255,255,255,0.08)',
  bgLight: 'rgba(255,255,255,0.04)',
  bgHeavy: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',
  blur: 30,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.08)',
  darkBgHeavy: 'rgba(0,0,0,0.15)',
}

export const gradients = {
  primary: ['#5C6BC0', '#7986CB'],
  organisateur: ['#5C6BC0', '#7986CB'],
  success: ['#66BB6A', '#5C6BC0'],
  error: ['#FF4D6D', '#FF6B8A'],
}

// Dégradés par catégorie d'événement — style Apple Music
export const categoryGradients = {
  Concert: ['rgba(109,29,217,0.55)', 'rgba(109,29,217,0.15)'],
  Festival: ['rgba(5,150,105,0.55)', 'rgba(5,150,105,0.15)'],
  Theatre: ['rgba(185,28,28,0.55)', 'rgba(185,28,28,0.15)'],
  Sport: ['rgba(37,99,235,0.55)', 'rgba(37,99,235,0.15)'],
  Conference: ['rgba(30,41,59,0.6)', 'rgba(30,41,59,0.2)'],
  Atelier: ['rgba(217,119,6,0.55)', 'rgba(217,119,6,0.15)'],
  Exposition: ['rgba(124,58,237,0.55)', 'rgba(124,58,237,0.15)'],
  'Club / Soirée': ['rgba(219,39,119,0.55)', 'rgba(219,39,119,0.15)'],
  Gala: ['rgba(202,138,4,0.55)', 'rgba(202,138,4,0.15)'],
  default: ['rgba(99,102,241,0.5)', 'rgba(236,72,153,0.2)'],
}

// Ombre portée pour lisibilité du texte blanc
export const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
}

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40,
}

export const borderRadius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 9999,
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
}

export const fonts = {
  outfit: {
    black: 'Outfit_900Black',
    extraBold: 'Outfit_800ExtraBold',
    bold: 'Outfit_700Bold',
    semiBold: 'Outfit_600SemiBold',
    medium: 'Outfit_500Medium',
    regular: 'Outfit_400Regular',
  },
  jakarta: {
    semiBold: 'PlusJakartaSans_600SemiBold',
    medium: 'PlusJakartaSans_500Medium',
    regular: 'PlusJakartaSans_400Regular',
  },
}

export const animations = {
  spring: { friction: 6, tension: 80 },
  timing: { duration: 300 },
  stagger: 80,
  pulse: { duration: 2000, minScale: 1, maxScale: 1.02 },
  scalePress: { toValue: 0.96, friction: 8, tension: 100 },
}
