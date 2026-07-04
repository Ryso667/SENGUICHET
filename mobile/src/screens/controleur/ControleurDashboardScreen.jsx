// Dashboard contrôleur : page d'accueil après connexion du contrôleur
// Affiche les infos de session, navigation vers Scanner/Historique et déconnexion
import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { hapticLight, hapticWarning } from '../../utils/haptics'
import { useAuth } from '../../context/AuthContext'
import GlassContainer from '../../components/GlassContainer'

import { spacing, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

const THEME_OPTIONS = [
  { key: 'system', Icon: MaterialCommunityIcons, icon: 'theme-light-dark', label: 'Système' },
  { key: 'dark', Icon: Feather, icon: 'moon', label: 'Sombre' },
  { key: 'light', Icon: Feather, icon: 'sun', label: 'Clair' },
]

export default function ControleurDashboardScreen({ navigation }) {
  const { colors, mode, setTheme } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { deconnecter } = useAuth()
  const insets = useSafeAreaInsets()
  const [showTheme, setShowTheme] = useState(false)

  return (
    <View style={styles.safe}>
      <View style={[styles.conteneur, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <GlassContainer style={styles.card}>
          <Feather name="shield" size={48} color={colors.accent} />
          <Text style={styles.titre}>Mode Contrôleur</Text>
          <Text style={styles.sousTitre}>Connecté avec succès</Text>
        </GlassContainer>

        <TouchableOpacity style={styles.scanBtn} onPress={() => { hapticLight(); navigation.navigate('Scanner') }} activeOpacity={0.8}>
          <Feather name="camera" size={24} color="#fff" />
          <Text style={styles.scanBtnTexte}>Scanner un billet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.histLien} onPress={() => { hapticLight(); navigation.navigate('Historique') }}>
          <Feather name="clock" size={16} color={colors.textSecondary} />
          <Text style={styles.histLienTexte}>Historique des scans</Text>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.themeBtn} onPress={() => { hapticLight(); setShowTheme(true) }}>
          <Feather name={mode === 'dark' ? 'moon' : 'sun'} size={18} color={colors.accent} />
          <Text style={styles.themeBtnTexte}>Thème : {THEME_OPTIONS.find(o => o.key === mode)?.label || mode}</Text>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <View style={styles.separateur} />
        <TouchableOpacity style={styles.boutonDeconnexion} onPress={() => { hapticWarning(); deconnecter() }} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color={colors.red} />
          <Text style={styles.boutonDeconnexionTexte}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showTheme} transparent animationType="fade" onRequestClose={() => setShowTheme(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowTheme(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.bg }]}>
            <Text style={[styles.sheetTitre, { color: colors.text }]}>Thème</Text>
            {THEME_OPTIONS.map(({ key, Icon, icon, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.opt, { backgroundColor: colors.bgSecondary }]}
                onPress={() => { hapticLight(); setTheme(key); setShowTheme(false) }}
              >
                <Icon name={icon} size={20} color={mode === key ? colors.accent : colors.textSecondary} />
                <Text style={[styles.optTexte, { color: colors.text }]}>{label}</Text>
                {mode === key && <Feather name="check" size={18} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: colors.bg,
  },
  conteneur: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: spacing.lg,
  },
  scanBtn: {
    width: '100%', paddingVertical: 18, borderRadius: 16,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  scanBtnTexte: {
    fontFamily: fonts.outfit.bold, fontSize: 17, color: '#FFFFFF',
  },
  histLien: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10,
  },
  histLienTexte: {
    fontFamily: fonts.outfit.medium, fontSize: 14, color: colors.textSecondary,
  },
  card: { padding: spacing.xl, alignItems: 'center', gap: 12, width: '100%' },
  titre: {
    fontFamily: fonts.outfit.bold,
    fontSize: 22,
    color: colors.text,
  },
  sousTitre: {
    fontFamily: fonts.outfit.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.glassWhite,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  themeBtnTexte: {
    fontFamily: fonts.outfit.medium, fontSize: 14, color: colors.text,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 12 },
  sheetTitre: { fontSize: 18, fontFamily: fonts.outfit.bold, marginBottom: 8, textAlign: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  optTexte: { flex: 1, fontSize: 16, fontFamily: fonts.jakarta.semiBold },
  separateur: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  boutonDeconnexion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 14,
    backgroundColor: colors.red + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red + '20',
  },
  boutonDeconnexionTexte: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: colors.red,
  },
})
