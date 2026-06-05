// Squelette de chargement avec effet shimmer animé
// Trois variantes prédéfinies : text (ligne), card (carte), circle (cercle)
// Supporte le rendu multiple via la prop count
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const BASE_COLOR = '#E2E8F0'
const SHIMMER_COLOR = '#F1F5F9'
const SHIMMER_WIDTH = 200

// Variantes prédéfinies
// Sera complété par d'autres variantes si nécessaire
const VARIANTS = {
  text: { width: '100%', height: 16, borderRadius: 4 },
  card: { width: '100%', height: 120, borderRadius: 16 },
  circle: { width: 48, height: 48, borderRadius: 9999 },
}

// Squelette de chargement avec effet shimmer
// Props : width, height, borderRadius, type ('text'|'card'|'circle'), count (défaut 1)
// Si type est fourni, les dimensions sont reprises de VARIANTS et surchargeables
export default function Skeleton({ width, height, borderRadius: br, type, count = 1 }) {
  const anim = useRef(new Animated.Value(0)).current

  const variant = VARIANTS[type]
  const finalWidth = width ?? variant?.width ?? '100%'
  const finalHeight = height ?? variant?.height ?? 20
  const finalBorderRadius = br ?? variant?.borderRadius ?? 4

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, 500],
  })

  const renderSkeleton = (key) => (
    <View
      key={key}
      style={[s.base, { width: finalWidth, height: finalHeight, borderRadius: finalBorderRadius }]}
    >
      <Animated.View style={[s.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', SHIMMER_COLOR, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )

  if (count > 1) {
    return (
      <View style={s.group}>
        {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
      </View>
    )
  }

  return renderSkeleton('single')
}

const s = StyleSheet.create({
  base: {
    backgroundColor: BASE_COLOR,
    overflow: 'hidden',
  },
  shimmer: {
    width: SHIMMER_WIDTH,
    height: '100%',
  },
  group: {
    gap: 8,
  },
})
