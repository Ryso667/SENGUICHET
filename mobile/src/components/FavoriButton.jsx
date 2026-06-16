// Bouton cœur favori ❤️ avec animation bounce et haptique
// Props : eventId (string/number requis), eventData (object optionnel pour stockage)
//         size (number, défaut 22), onToggle (callback optionnel)
import { useRef, useState, useEffect } from 'react'
import { TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { estFavori, basculerFavori } from '../utils/favorisStorage'
import { hapticSelection } from '../utils/haptics'

export default function FavoriButton({ eventId, eventData = {}, size = 22, inactiveColor = 'rgba(255,255,255,0.8)', onToggle, style }) {
  const { colors } = useTheme()
  const [estActif, setEstActif] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    estFavori(eventId).then(setEstActif)
  }, [eventId])

  const handlePress = async () => {
    hapticSelection?.()
    const nouveauStatut = await basculerFavori(eventId, eventData)
    setEstActif(nouveauStatut)
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3, tension: 200 }),
    ]).start()
    onToggle?.(nouveauStatut)
  }

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={10} style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialCommunityIcons
          name={estActif ? 'heart' : 'heart-outline'}
          size={size}
          color={estActif ? colors.red : inactiveColor}
        />
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
})
