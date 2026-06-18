// Hub Compte — écran central du profil et des accès utilisateur
// S'adapte selon le rôle : invité ou acheteur connecté
// (organisateur/controleur ont leur propre drawer)
import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { spacing, borderRadius, fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const THEME_ICONS = {
  system: <MaterialCommunityIcons name="theme-light-dark" size={20} />,
  dark: <Feather name="moon" size={20} />,
  light: <Feather name="sun" size={20} />,
}
const LABELS = { system: 'Système', dark: 'Sombre', light: 'Clair' }

export default function ProfilScreen({ navigation }) {
  const { colors, mode, setTheme } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [showThemeModal, setShowThemeModal] = useState(false)
  const insets = useSafeAreaInsets()
  const { role, email, deconnecter } = useAuth()
  const estAcheteur = role === 'acheteur'
  const nomAffiche = email || 'Utilisateur'

  if (!role) {
    // Guest : boutons connexion/inscription (inchangé)
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <View style={styles.avatar}>
              <Feather name="user" size={32} color={colors.primary} />
            </View>
            <Text style={styles.titre}>Compte</Text>
            <Text style={styles.sousTitre}>Connecte-toi pour accéder à tes billets</Text>
          </View>
          <Text style={styles.sectionLabel}>Acheteur</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SocialAuth')}>
            <Feather name="log-in" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Se connecter</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Organisateur</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionOrganisateur')}>
            <Feather name="briefcase" size={20} color={colors.accent} />
            <Text style={styles.actionBtnText}>Se connecter</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InscriptionOrganisateur')}>
            <Feather name="user-plus" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Créer un compte</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Contrôleur</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ConnexionControleur')}>
            <Feather name="shield" size={20} color={colors.accent} />
            <Text style={styles.actionBtnText}>Mode contrôleur</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Thème</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowThemeModal(true)}>
            {THEME_ICONS[mode] ? React.cloneElement(THEME_ICONS[mode], { color: colors.accent }) : null}
            <Text style={styles.actionBtnText}>{LABELS[mode]}</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
        <ThemeModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} mode={mode} setTheme={setTheme} colors={colors} />
      </View>
    )
  }

  if (estAcheteur) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Feather name="user" size={28} color={colors.primary} />
            </View>
            <Text style={styles.titre}>{nomAffiche}</Text>
            <Text style={styles.sousTitre}>Acheteur</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MesTickets')}>
            <Ionicons name="ticket-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Mes billets</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MesFavoris')}>
            <MaterialCommunityIcons name="heart-outline" size={20} color={colors.red} />
            <Text style={styles.actionBtnText}>Mes favoris</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Thème</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowThemeModal(true)}>
            {THEME_ICONS[mode] ? React.cloneElement(THEME_ICONS[mode], { color: colors.accent }) : null}
            <Text style={styles.actionBtnText}>{LABELS[mode]}</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Support')}>
            <Feather name="headphones" size={20} color={colors.primary} />
            <Text style={styles.actionBtnText}>Support</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={deconnecter}>
            <Feather name="log-out" size={20} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
        <ThemeModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} mode={mode} setTheme={setTheme} colors={colors} />
      </View>
    )
  }

  // Si role === organisateur ou controleur (ne devrait pas arriver dans cette screen)
  return null
}

function ThemeModal({ visible, onClose, mode, setTheme, colors }) {
  const sModal = useMemo(() => makeModalStyles(colors), [colors])
  const options = [
    { key: 'system', Icon: MaterialCommunityIcons, icon: 'theme-light-dark', label: 'Système' },
    { key: 'dark', Icon: Feather, icon: 'moon', label: 'Sombre' },
    { key: 'light', Icon: Feather, icon: 'sun', label: 'Clair' },
  ]
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sModal.overlay} onPress={onClose}>
        <Pressable style={[sModal.sheet, { backgroundColor: colors.bg }]}>
          <Text style={[sModal.title, { color: colors.text }]}>Thème</Text>
          {options.map(({ key, Icon, icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[sModal.option, { backgroundColor: colors.bgSecondary }]}
              onPress={() => { setTheme(key); onClose() }}
            >
              <Icon name={icon} size={20} color={mode === key ? colors.accent : colors.textSecondary} />
              <Text style={[sModal.optionText, { color: colors.text }]}>{label}</Text>
              {mode === key && <Feather name="check" size={18} color={colors.accent} />}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const makeModalStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 12 },
  title: { fontSize: 18, fontFamily: fonts.outfit.bold, marginBottom: 8, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  optionText: { flex: 1, fontSize: 16, fontFamily: fonts.jakarta.semiBold },
})

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  headerSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titre: {
    fontSize: 22, fontFamily: fonts.outfit.bold,
    color: colors.text, marginBottom: spacing.xs,
  },
  sousTitre: {
    fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  actionBtnText: {
    flex: 1, fontSize: 15, fontFamily: fonts.jakarta.semiBold,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontSize: 13, fontFamily: fonts.jakarta.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
})
