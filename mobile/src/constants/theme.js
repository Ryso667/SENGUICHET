// Thème clair Warm Light — fond beige #F5F0EB, accent terracotta #C7513A, verre translucide
export const colors = {
  bg: '#F5F0EB',
  bgSecondary: '#EBE5DE',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  white: '#FFFFFF',
  text: '#1A1A1E',
  textSecondary: '#6B6560',
  textTertiary: '#9C9590',
  accent: '#C7513A',
  accentLight: '#F0DED8',
  green: '#2E7D5E',
  greenLight: '#E0F5EC',
  red: '#C73A3A',
  whiteMuted: '#9C9590',
  violet: '#7C6FA0',
  orange: '#D4835A',
  glassWhite: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.6)',
  glassDark: 'rgba(0,0,0,0.04)',
  textWhite: '#1A1A1E',
  textWhiteMuted: '#6B6560',
  inputBg: '#FFFFFF',
  inputBorder: '#D4CEC8',
  inputBorderFocus: '#C7513A',
}

// === GLASS (verre dépoli — version claire pour cohérence Warm Light) ===
export const glass = {
  bg: 'rgba(255,255,255,0.5)',
  bgLight: 'rgba(255,255,255,0.3)',
  bgHeavy: 'rgba(255,255,255,0.7)',
  border: 'rgba(255,255,255,0.6)',
  borderLight: 'rgba(255,255,255,0.4)',
  blur: 20,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.04)',
  darkBgHeavy: 'rgba(0,0,0,0.08)',
}

export const gradients = {
  primary: ['#C7513A', '#B84530'],
  organisateur: ['#C7513A', '#B84530'],
  success: ['#2E7D5E', '#3A8F6E'],
  error: ['#C73A3A', '#D45050'],
}

// Dégradés par catégorie d'événement — style Apple Music
// Couleurs saturées pour fond immersif premium avec lisibilité
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
  default: ['rgba(199,81,58,0.2)', 'rgba(245,240,235,0.9)'],
}

// Ombre portée pour lisibilité du texte blanc sur fond clair/glass
export const textShadow = {
  textShadowColor: 'rgba(0,0,0,0)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 0,
}

// Espacements cohérents dans toute l'app
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
    medium: 'Outfit_500Medium',
    regular: 'Outfit_400Regular',
  },
  jakarta: {
    semiBold: 'PlusJakartaSans_600SemiBold',
    medium: 'PlusJakartaSans_500Medium',
    regular: 'PlusJakartaSans_400Regular',
  },
}

// === ANIMATIONS (Animated API) ===
export const animations = {
  spring: {
    friction: 6,
    tension: 80,
  },
  timing: {
    duration: 300,
  },
  stagger: 80,
  pulse: {
    duration: 2000,
    minScale: 1,
    maxScale: 1.02,
  },
  scalePress: {
    toValue: 0.96,
    friction: 8,
    tension: 100,
  },
}
