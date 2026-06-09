// Bouton principal de l'application
// Utilise un dégradé Terracotta (thème officiel)
// Si desactive = true ou disabled = true, passe en gris (muted) avec opacité réduite
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { hapticMedium } from '../utils/haptics'
// Bouton principal avec dégradé Terracotta et état de chargement intégré
// Props : titre (string), chargement (bool), desactive (bool), disabled (bool), onPress (function)
export default function BoutonPrincipal({ titre, chargement, desactive, disabled, onPress }) {
  // Désactivé si l'une des props de désactivation est true
  const estDesactive = desactive || disabled || chargement
  // Handler qui déclenche le feedback haptique avant d'appeler onPress
  // N'appelle pas le haptique si le bouton est désactivé
  const handlePress = () => {
    if (estDesactive) return
    hapticMedium()
    onPress?.()
  }
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={estDesactive}
      activeOpacity={0.85}
      style={estDesactive && styles.desactive}
    >
      <LinearGradient
        colors={estDesactive ? ['#94a3b8', '#94a3b8'] : ['#C7513A', '#B84530']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bouton}
      >
        {chargement ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.texte}>{titre}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bouton: {
    height: 56,
    paddingHorizontal: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  // Style appliqué quand le bouton est désactivé (opacité 0.5)
  desactive: {
    opacity: 0.5,
  },
})
