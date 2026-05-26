import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

// Bouton principal de l'application
// Utilise un dégradé Indigo → Rose comme spécifié dans la charte graphique
// Si desactive = true, passe en gris (muted)
export default function BoutonPrincipal({ titre, chargement, desactive, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={desactive || chargement}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={desactive ? ['#94a3b8', '#94a3b8'] : ['#6366F1', '#EC4899']}
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
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
})
