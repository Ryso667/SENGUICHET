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
  accentLight: '#E0F7FF',
  green: '#00E5A0',
  greenLight: '#E0FFF0',
  red: '#FF4D6D',
  cyan: '#00C8FF',
  violet: '#6366F1',
  orange: '#F97316',
  glassWhite: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.25)',
  glassDark: 'rgba(0,0,0,0.2)',
  textWhite: 'rgba(255,255,255,0.9)',
  textWhiteMuted: 'rgba(255,255,255,0.5)',
}

// === GLASS (verre dépoli) ===
export const glass = {
  bg: 'rgba(255,255,255,0.2)',
  bgLight: 'rgba(255,255,255,0.3)',
  bgHeavy: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.3)',
  borderLight: 'rgba(255,255,255,0.15)',
  blur: 20,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.3)',
  darkBgHeavy: 'rgba(0,0,0,0.55)',
}

export const gradients = {
  primary: ['#00C8FF', '#0077FF'],
  organisateur: ['#00C8FF', '#0077FF'],
  success: ['#00E5A0', '#00C8FF'],
  error: ['#FF4D6D', '#FF6B8A'],
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
  default: ['rgba(99,102,241,0.5)', 'rgba(236,72,153,0.2)'],
}

// Ombre portée pour lisibilité du texte blanc sur fond clair/glass
export const textShadow = {
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
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
