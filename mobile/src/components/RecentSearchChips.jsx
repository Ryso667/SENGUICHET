// Ligne horizontale de chips "Recherches récentes" avec icône clock et bouton X
// Props : recherches (string[]), onSelect (function), onDelete (function)
import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

export default function RecentSearchChips({ recherches, onSelect, onDelete }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  if (!recherches || recherches.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recherches récentes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recherches.map((r, i) => (
          <TouchableOpacity
            key={`${r}-${i}`}
            style={styles.chip}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={13} color={colors.textSecondary} />
            <Text style={styles.chipText} numberOfLines={1}>{r}</Text>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onDelete(i)}
            >
              <Feather name="x" size={12} color={colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginRight: spacing.sm,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 13,
    color: colors.text,
    maxWidth: 120,
  },
})
