// Composant DrawerContent — affiché dans le drawer hamburger
// Affiche l'avatar, nom, email de l'utilisateur + la liste des sections
// Supporte les badges de notifications (compteur non-lues)
import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { spacing, borderRadius, fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

// items = [{ label, icon, route, badge? }]
export default function DrawerContent({ items, navigation }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { email, deconnecter } = useAuth()

  const handlePress = (item) => {
    if (item.route === 'Deconnexion') {
      deconnecter()
      return
    }
    navigation.navigate(item.route)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header utilisateur */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={28} color={colors.primary} />
        </View>
        <Text style={styles.nom} numberOfLines={1}>{email || 'Utilisateur'}</Text>
      </View>

      <View style={styles.divider} />

      {/* Navigation items */}
      <View style={styles.menu}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handlePress(item)}
          >
            <Feather name={item.icon} size={20} color={item.danger ? colors.danger : colors.text} />
            <Text style={[styles.menuLabel, item.danger && { color: colors.danger }]}>
              {item.label}
            </Text>
            {item.badge != null && item.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, alignItems: 'center' },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  nom: {
    fontFamily: fonts.outfit.bold, fontSize: 18, color: colors.text,
    textAlign: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  menu: { paddingVertical: spacing.sm },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1, fontFamily: fonts.jakarta.semiBold, fontSize: 15, color: colors.text,
  },
  badge: {
    backgroundColor: colors.red, borderRadius: borderRadius.full,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontFamily: fonts.jakarta.bold },
})
