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
  green: '#22c55e',
  greenLight: '#f0fdf4',
  red: '#ef4444',
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

// Ombres douces et diffuses comme spécifié dans la charte
export const shadows = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
