// Carte événement avec animations springIn, stagger, et scalePress
// Remplace EventCard.js — design glass avec image de fond
// Props : event, onPress, index (pour stagger), style
import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, borderRadius, animations } from '../constants/theme'
import { getDefaultImage, getCategoryImageUrl } from '../config/images'
import useSpringAnimation from '../hooks/useSpringAnimation'

// Carte événement animée avec apparition spring, feedback press, image de fond
// event : objet { title, month, day, bg, emoji, category, location, time, priceLabel }
// onPress : fonction callback
// index : nombre pour le délai stagger (défaut 0)
// cardStyle : style supplémentaire sur le wrapper
// height : hauteur de la carte (défaut 220)
export default function AnimatedEventCard({ event, onPress, index = 0, cardStyle, height = 220 }) {
  const spring = useRef(new Animated.Value(0)).current
  const { value: scale, scalePressIn, scalePressOut } = useSpringAnimation(1)
  const def = event.category ? getDefaultImage(event.category) : null
  const iconName = def?.icon || null
  const [imageError, setImageError] = useState(false)
  // Priorité : affiche_url de l'événement → image par catégorie (Unsplash)
  const imageUrl = event.affiche_url || (event.category ? getCategoryImageUrl(event.category) : null)

  useEffect(() => {
    const delay = index * animations.stagger
    const timeout = setTimeout(() => {
      Animated.spring(spring, {
        toValue: 1,
        friction: animations.spring.friction,
        tension: animations.spring.tension,
        delay: 0,
        useNativeDriver: true,
      }).start()
    }, delay)
    return () => clearTimeout(timeout)
  }, [spring, index])

  const handlePressIn = () => { scalePressIn() }
  const handlePressOut = () => { scalePressOut() }

  const animatedStyle = {
    opacity: spring.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { scale },
      {
        translateY: spring.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
      },
    ],
  }

  return (
    <Animated.View style={[styles.wrapper, { height }, cardStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={event.estPasse ? undefined : onPress}
        onPressIn={event.estPasse ? undefined : handlePressIn}
        onPressOut={event.estPasse ? undefined : handlePressOut}
        activeOpacity={event.estPasse ? 1 : 0.9}
        style={styles.touch}
      >
        <View style={[styles.card, { backgroundColor: event.bg || '#6366F1' }, event.estPasse && styles.cardPasse]}>
          {imageUrl && !imageError && (
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[styles.cardImage, event.estPasse && styles.imagePasse]}
              onError={() => setImageError(true)}
            />
          )}
          {/* Overlay gradient renforcé — fond légèrement plus opaque en bas pour garantir la lisibilité du texte blanc sur toutes les images */}
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
            style={styles.overlay}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeMonth}>{event.month}</Text>
            <Text style={styles.badgeDay}>{event.day}</Text>
          </View>

          {event.estPasse && (
            <View style={styles.passeBadge}>
              <Text style={styles.passeText}>Passé</Text>
            </View>
          )}

          {iconName ? (
            <MaterialCommunityIcons name={iconName} size={28} color="rgba(255,255,255,0.6)" style={styles.icon} />
          ) : (
            <Text style={styles.emoji}>{event.emoji}</Text>
          )}

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={9} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText} numberOfLines={1}>{event.location || 'À venir'}</Text>
            </View>
            {event.priceLabel && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{event.priceLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 180,
    marginRight: 12,
  },
  touch: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: 'center',
    zIndex: 1,
  },
  badgeMonth: {
    fontSize: 7,
    fontFamily: fonts.jakarta.semiBold,
    textTransform: 'uppercase',
    color: '#fff',
    letterSpacing: 0.8,
  },
  badgeDay: {
    fontSize: 12,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
  },
  icon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  emoji: { fontSize: 24, position: 'absolute', right: 10, top: 10 },
  body: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 3,
  },
  title: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.jakarta.regular,
    flex: 1,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  priceText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },
  cardPasse: {
    opacity: 0.75,
  },
  imagePasse: {
    tintColor: 'grayscale',
  },
  passeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  passeText: {
    fontSize: 9,
    fontFamily: fonts.jakarta.semiBold,
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
