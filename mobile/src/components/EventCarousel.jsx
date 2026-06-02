// Carousel horizontal Apple-style pour les événements
// Carte principale centrée (80% largeur), cartes adjacentes visibles
// Fond : image Unsplash par catégorie, overlay dégradé, badge glass, avatars
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, Animated, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing, textShadow, borderRadius } from '../constants/theme'
import { formaterDateLisible } from '../utils/dateUtils'

const CARD_WIDTH_RATIO = 0.8
const SIDE_VISIBLE_RATIO = 0.12
const CARD_RADIUS = 28
const SCALE_INACTIVE = 0.92

const CATEGORY_QUERIES = {
  Concert: 'concert crowd music senegal dakar',
  Festival: 'festival celebration dance africa',
  Theatre: 'theatre stage performance africa',
  Sport: 'stadium football competition africa',
  Conference: 'conference hall seminar africa',
  Atelier: 'workshop creative craft africa',
  Exposition: 'african art gallery exhibition',
  'Club / Soirée': 'nightclub party celebration africa',
  Gala: 'gala event ceremony africa',
}

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY
const imageCache = new Map()

function EventCarousel({ events, onPress }) {
  const { width: screenWidth } = useWindowDimensions()
  const scrollX = useRef(new Animated.Value(0)).current
  const [images, setImages] = useState({})

  const cardWidth = screenWidth * CARD_WIDTH_RATIO
  const sideVisible = screenWidth * SIDE_VISIBLE_RATIO
  const itemWidth = cardWidth + sideVisible
  const paddingLeft = (screenWidth - cardWidth) / 2

  // Charge les images Unsplash par catégorie au montage
  useEffect(() => {
    const loadImages = async () => {
      if (!ACCESS_KEY) return
      const cats = [...new Set(events.map(e => e.category).filter(Boolean))]
      const newImages = { ...images }
      for (const cat of cats) {
        if (imageCache.has(cat)) {
          newImages[cat] = imageCache.get(cat)
          continue
        }
        try {
          const query = CATEGORY_QUERIES[cat] || 'event celebration senegal'
          const res = await fetch(
            `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=800`,
            { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
          )
          if (res.ok) {
            const data = await res.json()
            const url = data.urls?.regular || null
            if (url) {
              imageCache.set(cat, url)
              newImages[cat] = url
            }
          }
        } catch {}
      }
      setImages(newImages)
    }
    loadImages()
  }, [events])

  // Évite les recalculs si les événements n'ont pas changé
  const eventIds = events.map(e => e.id).join(',')

  const renderCard = useCallback((item, index) => {
    const catColor = '#6366F1'
    const imageUrl = images[item.category] || null

    const scale = scrollX.interpolate({
      inputRange: [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
      ],
      outputRange: [SCALE_INACTIVE, 1, SCALE_INACTIVE],
      extrapolate: 'clamp',
    })

    const opacity = scrollX.interpolate({
      inputRange: [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
      ],
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    })

    const parallax = scrollX.interpolate({
      inputRange: [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
      ],
      outputRange: [-20, 0, 20],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        key={item.id || index}
        style={[
          styles.cardOuter,
          { width: cardWidth, marginRight: sideVisible, transform: [{ scale }], opacity },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => onPress?.(item)}
          style={styles.cardTouch}
        >
          <View style={[styles.card, { borderRadius: CARD_RADIUS }]}>
            {imageUrl ? (
              <Animated.Image
                source={{ uri: imageUrl }}
                style={[styles.cardImage, { transform: [{ translateX: parallax }] }]}
              />
            ) : (
              <View style={[styles.cardFallback, { backgroundColor: catColor }]}>
                <Text style={styles.fallbackEmoji}>{item.emoji || '🎉'}</Text>
              </View>
            )}

            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']}
              locations={[0, 0.4, 1]}
              style={styles.gradient}
              pointerEvents="none"
            />

            <View style={styles.badge}>
              <View style={styles.badgeInner}>
                <Feather name="star" size={8} color="#fff" />
                <Text style={styles.badgeText}>
                  {item.category || 'Événement'}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>
                  {item.date ? formaterDateLisible(item.date) : ''}
                </Text>
              </View>
              {item.location && (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}
              {item.priceLabel && item.priceLabel !== '—' && (
                <View style={styles.priceWrap}>
                  <Text style={styles.priceText}>{item.priceLabel}</Text>
                </View>
              )}

              <View style={styles.avatars}>
                <View style={[styles.avatar, { backgroundColor: '#6366F1', zIndex: 3 }]}>
                  <Feather name="user" size={10} color="#fff" />
                </View>
                <View style={[styles.avatar, styles.avatar2, { backgroundColor: '#EC4899', zIndex: 2 }]}>
                  <Feather name="user" size={10} color="#fff" />
                </View>
                <View style={[styles.avatar, styles.avatar3, { backgroundColor: '#00E5A0', zIndex: 1 }]}>
                  <Feather name="user" size={10} color="#fff" />
                </View>
                <Text style={styles.avatarCount}>
                  +{Math.floor(Math.random() * 40) + 10}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [scrollX, cardWidth, sideVisible, itemWidth, images, onPress])

  if (!events || events.length === 0) return null

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: paddingLeft }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {events.map((item, index) => renderCard(item, index))}
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  cardOuter: {
    height: 420,
    paddingVertical: spacing.md,
  },
  cardTouch: {
    flex: 1,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
    letterSpacing: -0.5,
    ...textShadow,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  priceWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  priceText: {
    fontSize: 11,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatar2: {
    marginLeft: -8,
  },
  avatar3: {
    marginLeft: -8,
  },
  avatarCount: {
    fontSize: 11,
    fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
  },
})

export default EventCarousel
