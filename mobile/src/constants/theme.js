// Thème sombre Indigo - Fond bleu nuit #0D1B2A, accent cyan #00C8FF, verre dépoli
export const colors = {
  bg: '#0D1B2A',
  bgSecondary: '#111827',
  surface: '#152232',
  border: 'rgba(0, 200, 255, 0.15)',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A0B4C8',
  textTertiary: 'rgba(160, 180, 200, 0.7)',
  accent: '#00C8FF',
  accentLight: '#E0F7FF',
  green: '#00E5A0',
  greenLight: '#E0FFF0',
  red: '#FF4D6D',
  whiteMuted: 'rgba(160, 180, 200, 0.7)',
  violet: '#6366F1',
  orange: '#F97316',
  glassWhite: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.25)',
  glassDark: 'rgba(0,0,0,0.2)',
  inputBg: '#1A2A3A',
  inputBorder: 'rgba(0, 200, 255, 0.2)',
  inputBorderFocus: '#00C8FF',
  // Tokens textes sur fonds sombres (overlays, glass sur BlurBackground)
  textWhite: '#FFFFFF',
  textWhiteMuted: 'rgba(255,255,255,0.7)',
  // Tokens utilitaires (utilisés dans plusieurs composants)
  slate: '#2D2D32',
  mid: '#A0B4C8',
  muted: 'rgba(160, 180, 200, 0.6)',
  // Tokens feedback — visibles sur tous les fonds
  danger: '#FF4D6D',
  warning: '#F97316',
  success: '#00E5A0',
}

// === GLASS (verre dépoli) ===
export const glass = {
  bg: 'rgba(255,255,255,0.12)',
  bgLight: 'rgba(255,255,255,0.06)',
  bgHeavy: 'rgba(255,255,255,0.20)',
  border: 'rgba(255,255,255,0.10)',
  borderLight: 'rgba(255,255,255,0.05)',
  blur: 30,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.12)',
  darkBgHeavy: 'rgba(0,0,0,0.25)',
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
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
