// Écran des notifications organisateur
// Affiche la liste des notifications (nouvelles ventes, etc.)
// Pull-to-refresh, marquer comme lue, compteur de non-lues
import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { fetchNotifications, marquerLue, marquerToutLu } from '../services/notificationService'
import { useFocusEffect } from '@react-navigation/native'

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [notifications, setNotifications] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Erreur chargement notifications:', err.message)
    } finally {
      setChargement(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { charger() }, [charger]))

  const handleRefresh = () => { setRefreshing(true); charger() }

  const handlePress = async (item) => {
    if (!item.lue) {
      await marquerLue(item.id)
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, lue: true } : n)
      )
    }
    if (item.evenement_id) {
      // Navigue via le stack Dashboard du drawer
      navigation.navigate('Dashboard', { screen: 'DetailEvenement', params: { id: item.evenement_id } })
    }
  }

  const handleToutLu = async () => {
    await marquerToutLu()
    setNotifications(prev => prev.map(n => ({ ...n, lue: true })))
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.lue && styles.notifNonLue]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.notifIcon}>
        <Feather name={item.type === 'vente' ? 'shopping-bag' : 'bell'} size={18} color={colors.primary} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, !item.lue && styles.notifMessageNonLue]}>
          {item.message}
        </Text>
        <Text style={styles.notifDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
      {!item.lue && <View style={styles.dot} />}
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.titre}>Notifications</Text>
        {notifications.some(n => !n.lue) && (
          <TouchableOpacity onPress={handleToutLu}>
            <Text style={styles.toutLu}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {chargement ? (
        <View style={styles.center}>
          <Feather name="bell" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bell-off" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  titre: { fontFamily: fonts.outfit.bold, fontSize: 22, color: colors.text },
  toutLu: { fontFamily: fonts.jakarta.semiBold, fontSize: 13, color: colors.accent },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md,
    marginBottom: spacing.sm, gap: spacing.md,
  },
  notifNonLue: { backgroundColor: colors.primaryLight },
  notifIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifMessage: { fontFamily: fonts.jakarta.regular, fontSize: 14, color: colors.text, marginBottom: 2 },
  notifMessageNonLue: { fontFamily: fonts.jakarta.semiBold },
  notifDate: { fontFamily: fonts.jakarta.regular, fontSize: 12, color: colors.textTertiary },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { fontFamily: fonts.jakarta.regular, fontSize: 15, color: colors.textTertiary },
})
