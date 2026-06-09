// Paramètres organisateur (lecture seule)
// Design glass (Apple Invites)
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, borderRadius, fonts, textShadow } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import OrganisateurLayout from '../../components/OrganisateurLayout'
import GlassContainer from '../../components/GlassContainer'

const NOTIF_KEYS = {
  smsVente: '@senguichet_notif_sms_vente',
  emailRecap: '@senguichet_notif_email_recap',
  stockFaible: '@senguichet_notif_stock_faible',
}

export default function ParametresScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({
    smsVente: true,
    emailRecap: true,
    stockFaible: false,
  })

  function toggleNotif(key) {
    const nouvelle = { ...notifications, [key]: !notifications[key] }
    setNotifications(nouvelle)
    AsyncStorage.setItem(NOTIF_KEYS[key], JSON.stringify(nouvelle[key]))
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <OrganisateurLayout />
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
          <Text style={s.sectionTitle}>Sécurité</Text>
          <TouchableOpacity style={s.securityBtn} onPress={() => navigation.navigate('ChangerMotDePasse')}>
            <Text style={s.securityBtnText}>Modifier le mot de passe →</Text>
          </TouchableOpacity>
        </GlassContainer>

        <GlassContainer blurType="light" style={s.section} intensity={35}>
          <Text style={s.sectionTitle}>Notifications</Text>
          <View style={s.row}>
            <Text style={s.label}>SMS à chaque vente</Text>
            <Switch
              value={notifications.smsVente}
              onValueChange={() => toggleNotif('smsVente')}
              trackColor={{ true: 'rgba(199,81,58,0.6)', false: 'rgba(255,255,255,0.2)' }}
              thumbColor={notifications.smsVente ? colors.accent : 'rgba(255,255,255,0.5)'}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Email récapitulatif quotidien</Text>
            <Switch
              value={notifications.emailRecap}
              onValueChange={() => toggleNotif('emailRecap')}
              trackColor={{ true: 'rgba(199,81,58,0.6)', false: 'rgba(255,255,255,0.2)' }}
              thumbColor={notifications.emailRecap ? colors.accent : 'rgba(255,255,255,0.5)'}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Alertes stock faible</Text>
            <Switch
              value={notifications.stockFaible}
              onValueChange={() => toggleNotif('stockFaible')}
              trackColor={{ true: 'rgba(199,81,58,0.6)', false: 'rgba(255,255,255,0.2)' }}
              thumbColor={notifications.stockFaible ? colors.accent : 'rgba(255,255,255,0.5)'}
            />
          </View>
        </GlassContainer>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: '#fff', marginBottom: spacing.sm, ...textShadow },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: '#fff' },
  value: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: 'rgba(255,255,255,0.8)', textAlign: 'right', flex: 1, marginLeft: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  infoText: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  securityBtn: {
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(199,81,58,0.12)', borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(199,81,58,0.25)',
    alignItems: 'center',
  },
  securityBtnText: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.accent },
})
