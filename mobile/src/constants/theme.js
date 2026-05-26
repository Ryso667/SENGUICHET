// Couleurs de l'application (charte graphique Option A : Iris & Pêche)
// Fond : #F8F9FD (blanc soyeux teinté bleu-gris)
// Surface : #FFFFFF (blanc pur)
// Texte : #0F172A (ardoise foncé)
// Primaire : #6366F1 (Indigo / Iris)
// Accent : #EC4899 (Rose / Pêche)
export const colors = {
  bg: '#f8f9fc',
  white: '#FFFFFF',
  slate: '#0f172a',
  mid: '#64748b',
  muted: '#94a3b8',
  border: '#edf0f5',
  accent: '#6366F1',
  accentLight: '#EEF2FF',
  rose: '#EC4899',
  green: '#10B981',
  greenLight: '#ECFDF5',
  red: '#ef4444',
  cyan: '#06B6D4',
  violet: '#8B5CF6',
  orange: '#F97316',
}

// Verre (glassmorphism)
export const glass = {
  bg: 'rgba(255,255,255,0.7)',
  darkBg: 'rgba(15,23,42,0.05)',
  border: 'rgba(255,255,255,0.3)',
  blur: 20,
  radius: 20,
}

// Dégradés par rôle
export const gradients = {
  primary: ['#6366F1', '#EC4899'],
  acheteur: ['#6366F1', '#06B6D4'],
  controleur: ['#8B5CF6', '#EC4899'],
  organisateur: ['#EC4899', '#F97316'],
  hero: ['rgba(99,102,241,0.04)', 'rgba(236,72,153,0.04)'],
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

// Rayons de bordure (cartes = 16px, boutons = ovale avec 28px+)
export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
}

// Ombres teintées indigo (colored shadows)
export const shadows = {
  sm: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
}

// Polices : Outfit pour les titres, Plus Jakarta Sans pour les textes
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
