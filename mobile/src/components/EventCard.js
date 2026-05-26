import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, shadows, glass } from '../constants/theme'

export default function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.banner, { backgroundColor: event.bg }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeMonth}>{event.month}</Text>
          <Text style={styles.badgeDay}>{event.day}</Text>
        </View>
        <Text style={styles.emoji}>{event.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        {!!event.location && (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={9} color={colors.mid} />
            <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
        {!!event.time && (
          <View style={styles.metaRow}>
            <Feather name="clock" size={9} color={colors.mid} />
            <Text style={styles.metaText}>{event.time}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Feather name="tag" size={9} color={colors.accent} />
          <Text style={styles.price}>{event.priceLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    ...glass,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginRight: 12,
    ...shadows.md,
  },
  banner: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: 'center',
  },
  badgeMonth: {
    fontSize: 7,
    fontFamily: fonts.jakarta.semiBold,
    textTransform: 'uppercase',
    color: '#be123c',
    letterSpacing: 0.8,
  },
  badgeDay: {
    fontSize: 12,
    fontFamily: fonts.outfit.bold,
    color: colors.slate,
  },
  emoji: { fontSize: 28 },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  title: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 12,
    color: colors.slate,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: colors.mid,
    fontFamily: fonts.jakarta.regular,
    flex: 1,
  },
  price: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: colors.accent,
  },
})
