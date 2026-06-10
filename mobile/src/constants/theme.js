// Thème bleu foncé profond — Fond #1A1F6E, cartes #252B80, accent #3D5AFE
// Aucune surface blanche ou gris clair — tout dans la palette marine bleutée
export const colors = {
  bg: '#1A1F6E',
  bgSecondary: '#1A1F6E',
  surface: '#252B80',
  border: '#252B80',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textTertiary: '#90A4AE',
  accent: '#3D5AFE',
  accentLight: '#90CAF9',
  green: '#4CAF50',
  greenLight: '#E8F5E9',
  red: '#EF5350',
  whiteMuted: '#B0BEC5',
  violet: '#7C4DFF',
  orange: '#FF6D00',
  glassWhite: '#252B80',
  glassBorder: '#252B80',
  glassDark: '#1A1F6E',
  inputBg: '#2E3591',
  inputBorder: '#4A5280',
  inputBorderFocus: '#3D5AFE',
  textWhite: '#FFFFFF',
  textWhiteMuted: '#B0BEC5',
  // Bordures colorées par type de carte
  cardCyan: '#00BCD4',
  cardGreen: '#4CAF50',
  cardViolet: '#7C4DFF',
  cardOrange: '#FF6D00',
  // Couleurs nav
  navActive: '#FFFFFF',
  navInactive: '#5C6BC0',
  // Tokens utilitaires
  slate: '#252B80',
  mid: '#B0BEC5',
  muted: '#90A4AE',
  danger: '#EF5350',
  warning: '#FF6D00',
  success: '#4CAF50',
}

// === SURFACE SOLIDE (ex-verre dépoli) ===
export const glass = {
  bg: '#252B80',
  bgLight: '#2E3591',
  bgHeavy: '#1A1F6E',
  border: '#252B80',
  borderLight: '#1A1F6E',
  blur: 20,
  radius: 20,
  darkBg: '#1A1F6E',
  darkBgHeavy: '#1A1F6E',
}

export const gradients = {
  primary: ['#3D5AFE', '#4A90D9'],
  organisateur: ['#3D5AFE', '#4A90D9'],
  success: ['#4CAF50', '#66BB6A'],
  error: ['#EF5350', '#E53935'],
  background: ['#0F1460', '#1A1F6E', '#252B80'],
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
