// Champ de saisie de numéro de téléphone avec formatage automatique
// Format : +221 XX XXX XX XX (9 chiffres après l'indicatif)
import { useState } from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'

// Indicateur du Sénégal
const INDICATIF = '+221'
// Champ de téléphone sénégalais (+221) avec masque XX XXX XX XX et validation
// Props : onValide (callback appelé avec le numéro à 9 chiffres, ou null si incomplet)
export default function InputTel({ onValide }) {
  const [chiffres, setChiffres] = useState('')

  // Formate les 9 chiffres en groupes : XX XXX XX XX
  // Les espaces sont insérés après les positions 2, 5 et 7
  const formater = (texte) => {
    const nettoye = texte.replace(/\D/g, '').slice(0, 9)
    let formate = ''
    for (let i = 0; i < nettoye.length; i++) {
      if (i === 2 || i === 5 || i === 7) formate += ' '
      formate += nettoye[i]
    }
    return formate
  }

  // Met à jour l'affichage et notifie le parent si le numéro est complet (9 chiffres)
  const handleChangement = (texte) => {
    const formate = formater(texte)
    setChiffres(formate)
    const digits = formate.replace(/\s/g, '')
    if (digits.length === 9) {
      onValide?.(digits)
    } else {
      onValide?.(null)
    }
  }

  return (
    <View style={styles.conteneur}>
      {/* Indicatif pays (Sénégal) */}
      <Text style={styles.indicatif}>{INDICATIF}</Text>
      {/* Champ masque : l'utilisateur voit +221 XX XXX XX XX */}
      <TextInput
        style={styles.input}
        value={chiffres}
        onChangeText={handleChangement}
        keyboardType="phone-pad"
        placeholder="XX XXX XX XX"
        placeholderTextColor="#94a3b8"
        maxLength={12}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#edf0f5',
    paddingHorizontal: 16,
    height: 56,
  },
  indicatif: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    color: '#0f172a',
    height: '100%',
  },
})
