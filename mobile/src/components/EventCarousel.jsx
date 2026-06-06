// Carousel horizontal Apple Invites pour la page d'accueil
// Carte principale centrée (80%), adjacentes visibles avec rotation oblique
// Utilise AnimatedEventCard pour la cohérence visuelle avec la grille de recherche
import { useRef, useCallback } from 'react'
import { View, Animated, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { spacing } from '../constants/theme'
import AnimatedEventCard from './AnimatedEventCard'

const CARD_WIDTH_RATIO = 0.8
const SIDE_PEEK = 0.08
const CARD_HEIGHT = 400
const SCALE_INACTIVE = 0.92
const TILT_ANGLE = 3

function EventCarousel({ events, onPress, onActiveIndexChange }) {
  const { width: screenWidth } = useWindowDimensions()
  const scrollX = useRef(new Animated.Value(0)).current
  const lastIndexRef = useRef(-1)

  const cardWidth = screenWidth * CARD_WIDTH_RATIO
  const itemWidth = cardWidth + screenWidth * SIDE_PEEK
  const paddingLeft = (screenWidth - cardWidth) / 2

  const renderCard = useCallback((item, index) => {
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

    const rotate = scrollX.interpolate({
      inputRange: [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
      ],
      outputRange: [`${TILT_ANGLE}deg`, '0deg', `-${TILT_ANGLE}deg`],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        key={item.id || index}
        style={[
          styles.cardOuter,
          {
            width: cardWidth,
            marginRight: screenWidth * SIDE_PEEK,
            transform: [{ translateY: -CARD_HEIGHT / 2 }, { rotateZ: rotate }, { translateY: CARD_HEIGHT / 2 }, { scale }],
            opacity,
          },
        ]}
      >
        <AnimatedEventCard
          event={item}
          height={CARD_HEIGHT}
          cardStyle={{ width: '100%', marginRight: 0 }}
          onPress={() => onPress?.(item)}
        />
      </Animated.View>
    )
  }, [scrollX, cardWidth, itemWidth, screenWidth, onPress])

  if (!events || events.length === 0) return null

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        snapToInterval={itemWidth}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: paddingLeft }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(event) => {
          if (!onActiveIndexChange) return
          const offsetX = event.nativeEvent.contentOffset.x
          const index = Math.round(offsetX / itemWidth)
          if (index !== lastIndexRef.current && index >= 0 && index < events.length) {
            lastIndexRef.current = index
            onActiveIndexChange(index)
          }
        }}
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
    height: CARD_HEIGHT + spacing.md * 2,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
})

export default EventCarousel
