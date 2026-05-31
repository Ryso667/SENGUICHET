// Bouton principal de l'application
// Utilise un dégradé Cyan → Bleu (thème officiel)
// Si desactive = true, passe en gris (muted)
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
// Bouton principal avec dégradé Cyan→Bleu et état de chargement intégré
// Props : titre (string), chargement (bool), desactive (bool), onPress (function)
export default function BoutonPrincipal({ titre, chargement, desactive, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={desactive || chargement}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={desactive ? ['#94a3b8', '#94a3b8'] : ['#00C8FF', '#0077FF']}
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
})
