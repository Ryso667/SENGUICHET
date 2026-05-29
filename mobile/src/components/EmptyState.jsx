// Écran vide lorsque aucune donnée n'est disponible
// Affiche une icône, un titre, un sous-titre optionnel et un bouton d'action
import { useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { colors, fonts, spacing } from '../constants/theme'

// État vide avec animation de fondu au montage
// Props : icon (string, emoji), title (string), subtitle (string, optionnel),
//         actionLabel (string, optionnel), onAction (function, optionnel)
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 18,
    color: colors.slate,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.mid,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 28,
    marginTop: spacing.sm,
  },
  buttonLabel: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
})
