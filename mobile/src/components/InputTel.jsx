// Champ de saisie de numéro de téléphone avec formatage automatique
// Format : +221 XX XXX XX XX (9 chiffres après l'indicatif)
import { useState, useMemo } from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

// Indicateur du Sénégal
const INDICATIF = '+221'
// Champ de téléphone sénégalais (+221) avec masque XX XXX XX XX et validation
// Props : onValide (callback appelé avec le numéro à 9 chiffres, ou null si incomplet)
export default function InputTel({ onValide }) {
  const { colors } = useTheme()
  const [chiffres, setChiffres] = useState('')
  const styles = useMemo(() => makeStyles(colors), [colors])

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
        placeholderTextColor={colors.textTertiary}
        maxLength={12}
      />
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  indicatif: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 18,
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.outfit.regular,
    fontSize: 18,
    color: colors.text,
    height: '100%',
  },
})
