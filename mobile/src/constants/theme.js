// Thème clair SENGUICHET
export const lightColors = {
  bg: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#F4F6F9',
  border: '#E5E7EB',
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#6B7280',
  accent: '#10B981',
  accentLight: '#D1FAE5',
  green: '#047857',
  greenLight: '#D1FAE5',
  red: '#EF4444',
  violet: '#7C3AED',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  cyan: '#06B6D4',
  glassWhite: 'rgba(255,255,255,0.8)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassDark: 'rgba(0,0,0,0.04)',
  inputBg: '#F3F4F6',
  inputBorder: 'transparent',
  inputBorderFocus: '#10B981',
  slate: '#1E293B',
  mid: '#6B7280',
  muted: '#9CA3AF',
  placeholder: '#9CA3AF',
  navInactive: '#9CA3AF',
  navActive: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
}

// Palette sombre SENGUICHET
export const darkColors = {
  bg: '#0F172A',
  bgSecondary: '#1E293B',
  surface: '#1E293B',
  card: '#273548',
  border: '#334155',
  primary: '#34D399',
  primaryLight: '#064E3B',
  white: '#FFFFFF',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  accent: '#34D399',
  accentLight: '#064E3B',
  green: '#34D399',
  greenLight: '#064E3B',
  red: '#F87171',
  violet: '#A78BFA',
  orange: '#FB923C',
  orangeLight: '#431407',
  cyan: '#22D3EE',
  glassWhite: 'rgba(30,41,59,0.8)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassDark: 'rgba(255,255,255,0.04)',
  inputBg: '#1E293B',
  inputBorder: 'transparent',
  inputBorderFocus: '#34D399',
  slate: '#F1F5F9',
  mid: '#94A3B8',
  muted: '#64748B',
  placeholder: '#64748B',
  navInactive: '#64748B',
  navActive: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
}

// Garde un export colors par défaut pour backward compat
export const colors = lightColors

// === GLASS (verre dépoli) ===
export const glass = {
  bg: 'rgba(255,255,255,0.8)',
  bgLight: 'rgba(255,255,255,0.6)',
  bgHeavy: 'rgba(255,255,255,0.95)',
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.03)',
  blur: 20,
  radius: 16,
  darkBg: 'rgba(0,0,0,0.03)',
  darkBgHeavy: 'rgba(0,0,0,0.06)',
}

export const gradients = {
  primary: ['#10B981', '#059669'],
  organisateur: ['#10B981', '#059669'],
  success: ['#10B981', '#059669'],
  error: ['#EF4444', '#DC2626'],
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

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40,
}

export const borderRadius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 9999,
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
