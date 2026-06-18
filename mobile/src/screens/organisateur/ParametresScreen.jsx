// Paramètres organisateur (lecture seule)
// Design glass (Apple Invites)
import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { spacing, fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import GlassContainer from '../../components/GlassContainer'

const NOTIF_KEY_SMS = '@senguichet_notif_sms_vente'

export default function ParametresScreen({ navigation }) {
  const { colors, mode, setTheme } = useTheme()
  const s = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { user, deconnecter } = useAuth()
  const [smsVente, setSmsVente] = useState(true)
  const [showThemeModal, setShowThemeModal] = useState(false)

  function toggleSms() {
    const nouvelle = !smsVente
    setSmsVente(nouvelle)
    AsyncStorage.setItem(NOTIF_KEY_SMS, JSON.stringify(nouvelle))
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlassContainer blurType="light" style={s.section} intensity={35}>
          <Text style={s.sectionTitle}>Mon profil</Text>
          <View style={s.row}>
            <Text style={s.label}>Nom</Text>
            <Text style={s.value}>{user?.nom || '-'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Email</Text>
            <Text style={s.value}>{user?.email || '-'}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Téléphone</Text>
            <Text style={s.value}>{user?.telephone || '-'}</Text>
          </View>
        </GlassContainer>

        <GlassContainer blurType="light" style={s.section} intensity={35}>
          <Text style={s.sectionTitle}>Notifications</Text>
          <View style={s.row}>
            <Text style={s.label}>SMS à chaque vente</Text>
            <Switch
              value={smsVente}
              onValueChange={toggleSms}
              trackColor={{ true: '#10B981', false: 'rgba(0,0,0,0.15)' }}
              thumbColor={smsVente ? '#fff' : 'rgba(0,0,0,0.3)'}
            />
          </View>
        </GlassContainer>

        <GlassContainer blurType="light" style={s.section} intensity={35}>
          <Text style={s.sectionTitle}>Sécurité</Text>
          <TouchableOpacity style={s.securityRow} onPress={() => navigation.navigate('ChangerMotDePasse')}>
            <View style={s.securityIcon}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.accent} />
            </View>
            <Text style={s.securityLabel}>Modifier le mot de passe</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </GlassContainer>

        <GlassContainer blurType="light" style={s.section} intensity={35}>
          <Text style={s.sectionTitle}>Thème</Text>
          <TouchableOpacity style={s.securityRow} onPress={() => setShowThemeModal(true)}>
            <Feather name={mode === 'dark' ? 'moon' : mode === 'light' ? 'sun' : 'smartphone'} size={18} color={colors.accent} />
            <Text style={s.securityLabel}>{mode === 'dark' ? 'Sombre' : mode === 'light' ? 'Clair' : 'Système'}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </GlassContainer>

        <View style={s.spacer} />

        <TouchableOpacity style={s.logoutButton} onPress={() => deconnecter()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={22} color="#FF4D6D" />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ThemeModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} mode={mode} setTheme={setTheme} colors={colors} />
    </View>
  )
}

function ThemeModal({ visible, onClose, mode, setTheme, colors }) {
  const options = [
    { key: 'system', Icon: Feather, icon: 'smartphone', label: 'Système' },
    { key: 'dark', Icon: Feather, icon: 'moon', label: 'Sombre' },
    { key: 'light', Icon: Feather, icon: 'sun', label: 'Clair' },
  ]
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tm.overlay} onPress={onClose}>
        <Pressable style={[tm.sheet, { backgroundColor: colors.bg }]}>
          <Text style={[tm.title, { color: colors.text }]}>Thème</Text>
          {options.map(({ key, Icon, icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[tm.option, { backgroundColor: colors.bgSecondary }]}
              onPress={() => { setTheme(key); onClose() }}
            >
              <Icon name={icon} size={20} color={mode === key ? colors.accent : colors.textSecondary} />
              <Text style={[tm.optionText, { color: colors.text }]}>{label}</Text>
              {mode === key && <Feather name="check" size={18} color={colors.accent} />}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.text },
  value: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.textSecondary, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
  securityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: spacing.xs,
  },
  securityIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.accent + '1F',
    alignItems: 'center', justifyContent: 'center',
  },
  securityLabel: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.text, flex: 1 },
  spacer: { height: 32 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,77,109,0.2)',
  },
  logoutText: {
    fontSize: 17, fontFamily: fonts.outfit.semiBold, color: colors.danger,
  },
})

const tm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 12 },
  title: { fontSize: 18, fontFamily: fonts.outfit.bold, marginBottom: 8, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  optionText: { flex: 1, fontSize: 16, fontFamily: fonts.jakarta.semiBold },
})
