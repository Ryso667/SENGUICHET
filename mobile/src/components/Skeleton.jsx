// Squelette de chargement avec effet shimmer animé
// Variantes : text (ligne), card (carte), circle (cercle), event-card (carousel),
//             ticket-row (ligne ticket), image (placeholder image)
// Adapté au thème sombre Indigo — fond semi-transparent
import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const SHIMMER_WIDTH = 200

// Dimensions par défaut pour chaque variante
const VARIANTS = {
  text: { width: '100%', height: 16, borderRadius: 4 },
  card: { width: '100%', height: 120, borderRadius: 16 },
  circle: { width: 48, height: 48, borderRadius: 9999 },
  'event-card': { width: '100%', height: 400, borderRadius: 20 },
  'ticket-row': { width: '100%', height: 88, borderRadius: 16 },
  image: { width: '100%', height: 200, borderRadius: 16 },
}

// Squelette de chargement avec effet shimmer
// Props : width, height, borderRadius, type (parmi VARIANTS), count (défaut 1), style
// Si type est fourni, les dimensions sont reprises de VARIANTS et surchargeables
export default function Skeleton({ width, height, borderRadius: br, type, count = 1, style }) {
  const anim = useRef(new Animated.Value(0)).current

  const variant = VARIANTS[type]
  const finalWidth = width ?? variant?.width ?? '100%'
  const finalHeight = height ?? variant?.height ?? 20
  const finalBorderRadius = br ?? variant?.borderRadius ?? 4

  // Boucle infinie : va-et-vient du reflet lumineux
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

  // Défilement horizontal du reflet
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, 500],
  })

  // Rendu d'un squelette individuel
  const renderSkeleton = (key) => (
    <View
      key={key}
      style={[
        s.base,
        { width: finalWidth, height: finalHeight, borderRadius: finalBorderRadius },
        style,
      ]}
    >
      <Animated.View style={[s.shimmer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.06)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )

  if (count > 1) {
    // Groupe de squelettes avec espacement prédéfini
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
    backgroundColor: 'rgba(0,0,0,0.03)',
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
