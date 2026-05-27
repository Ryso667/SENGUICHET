// Champ de saisie à 6 chiffres individuels avec focus automatique
// Utile pour les codes de validation (OTP)
import { useRef, useState } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
// Composant de saisie OTP à chiffres individuels avec auto-focus
// Props : longueur (number, défaut 6), onComplet (callback appelé quand tous les chiffres sont saisis)
export default function InputOTP({ longueur = 6, onComplet }) {
  const [codes, setCodes] = useState(Array(longueur).fill(''))
  const refs = useRef([])

  // Gère la saisie d'un chiffre et passe automatiquement au champ suivant
  const handleChangement = (texte, index) => {
    const chiffre = texte.replace(/\D/g, '').slice(-1)
    const nouveau = [...codes]
    nouveau[index] = chiffre
    setCodes(nouveau)

    if (chiffre && index < longueur - 1) {
      refs.current[index + 1]?.focus()
    }

    const saisi = nouveau.join('')
    if (saisi.length === longueur) {
      onComplet?.(saisi)
    }
  }

  // Si on tape sur une case vide, redirige vers la première case vide
  const handleTouche = (index) => {
    if (!codes[index] && index > 0) {
      const dernierRempli = codes.reduce((last, v, i) => v ? i : last, -1)
      const cible = dernierRempli + 1
      refs.current[cible]?.focus()
    }
  }

  return (
    <View style={styles.conteneur}>
      {codes.map((val, i) => (
        <TextInput
          key={i}
          ref={(ref) => { refs.current[i] = ref }}
          style={[styles.case, val ? styles.caseRemplie : null]}
          value={val}
          onChangeText={(t) => handleChangement(t, i)}
          onPress={() => handleTouche(i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  case: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#edf0f5',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#0f172a',
  },
  caseRemplie: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
})
