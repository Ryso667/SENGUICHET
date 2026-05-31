// Paramètres organisateur (lecture seule)
// Profil, sécurité, notifications
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

const NOTIF_KEYS = {
  smsVente: '@senguichet_notif_sms_vente',
  emailRecap: '@senguichet_notif_email_recap',
  stockFaible: '@senguichet_notif_stock_faible',
}

export default function ParametresScreen() {
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
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Mon profil</Text>
        <View style={s.card}>
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
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Sécurité</Text>
        <View style={s.card}>
          <Text style={s.infoText}>
            Pour modifier ton mot de passe, connecte-toi à la version web.
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>SMS à chaque vente</Text>
            <Switch
              value={notifications.smsVente}
              onValueChange={() => toggleNotif('smsVente')}
              trackColor={{ true: '#00C8FF', false: colors.border }}
              thumbColor={notifications.smsVente ? colors.accent : colors.muted}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Email récapitulatif quotidien</Text>
            <Switch
              value={notifications.emailRecap}
              onValueChange={() => toggleNotif('emailRecap')}
              trackColor={{ true: '#00C8FF', false: colors.border }}
              thumbColor={notifications.emailRecap ? colors.accent : colors.muted}
            />
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Alertes stock faible</Text>
            <Switch
              value={notifications.stockFaible}
              onValueChange={() => toggleNotif('stockFaible')}
              trackColor={{ true: '#00C8FF', false: colors.border }}
              thumbColor={notifications.stockFaible ? colors.accent : colors.muted}
            />
          </View>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontFamily: fonts.outfit.semiBold, color: colors.slate, marginBottom: spacing.sm },
  card: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: spacing.md, elevation: 2, shadowColor: '#00C8FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: 14, fontFamily: fonts.jakarta.regular, color: colors.slate },
  value: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: colors.slate, textAlign: 'right', flex: 1, marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
  infoText: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.mid, lineHeight: 20 },
})
