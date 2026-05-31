// Couleurs de l'application (charte graphique : thème Cyan/Bleu)
// Fond : #F8F9FC (blanc soyeux)
// Surface : #FFFFFF (blanc pur)
// Texte : #0F172A (ardoise foncé)
// Primaire : #00C8FF (Cyan vif)
// Accent : #0077FF (Bleu profond)
export const colors = {
  bg: '#f8f9fc',
  white: '#FFFFFF',
  slate: '#0f172a',
  mid: '#A0B4C8',
  muted: '#94a3b8',
  border: '#edf0f5',
  accent: '#00C8FF',
  accentLight: '#E0F7FF',
  rose: '#0077FF',
  green: '#00E5A0',
  greenLight: '#E0FFF0',
  red: '#FF4D6D',
  cyan: '#00C8FF',
  violet: '#0077FF',
  orange: '#F97316',
}

// Verre (glassmorphism)
export const glass = {
  bg: 'rgba(255,255,255,0.7)',
  darkBg: 'rgba(0,200,255,0.05)',
  border: 'rgba(0,200,255,0.15)',
  blur: 20,
  radius: 20,
}

// Dégradés par rôle - Cyan → Bleu
export const gradients = {
  primary: ['#00C8FF', '#0077FF'],
  acheteur: ['#00C8FF', '#0077FF'],
  controleur: ['#0077FF', '#00C8FF'],
  organisateur: ['#00C8FF', '#00E5A0'],
  hero: ['rgba(0,200,255,0.04)', 'rgba(0,119,255,0.04)'],
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

// Ombres teintées cyan (colored shadows)
export const shadows = {
  sm: {
    shadowColor: '#00C8FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#00C8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#00C8FF',
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
