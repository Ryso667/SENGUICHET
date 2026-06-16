// Paramètres organisateur (lecture seule)
// Design glass (Apple Invites)
import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import GlassContainer from '../../components/GlassContainer'

const NOTIF_KEY_SMS = '@senguichet_notif_sms_vente'

export default function ParametresScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user, deconnecter } = useAuth()
  const [smsVente, setSmsVente] = useState(true)

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

        <View style={s.spacer} />

        <TouchableOpacity style={s.logoutButton} onPress={() => deconnecter()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={22} color="#FF4D6D" />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
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
    backgroundColor: 'rgba(121,134,203,0.12)',
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
    fontSize: 17, fontFamily: fonts.outfit.semiBold, color: '#FF4D6D',
  },
})
