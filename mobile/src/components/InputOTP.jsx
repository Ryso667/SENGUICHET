// Champ de saisie à chiffres individuels avec auto-focus et gestion backspace
// Utile pour les codes PIN (contrôleur) et OTP (acheteur)
// Props : longueur (number, défaut 6), onComplet (callback appelé quand tous les chiffres sont saisis), autoFocus (bool)
// Ref exposée : { reinitialiser() } pour vider et refocus la première case
import { forwardRef, useRef, useState, useMemo, useEffect, useImperativeHandle } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

const InputOTP = forwardRef(({ longueur = 6, onComplet, autoFocus = false }, ref) => {
  const { colors } = useTheme()
  const [codes, setCodes] = useState(Array(longueur).fill(''))
  const refs = useRef([])
  const styles = useMemo(() => makeStyles(colors), [colors])

  // Expose une méthode reinitialiser() pour vider le formulaire depuis le parent
  useImperativeHandle(ref, () => ({
    reinitialiser() {
      setCodes(Array(longueur).fill(''))
      setTimeout(() => refs.current[0]?.focus(), 100)
    },
  }))

  // Auto-focus la première case au montage
  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      const delai = setTimeout(() => refs.current[0]?.focus(), 400)
      return () => clearTimeout(delai)
    }
  }, [autoFocus])

  // Gère la saisie : filtre les non-chiffres, avance automatiquement
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

  // Redirige le focus vers la première case vide si on tape sur une case arbitraire
  const handleTouche = (index) => {
    if (!codes[index] && index > 0) {
      const dernierRempli = codes.reduce((last, v, i) => (v ? i : last), -1)
      const cible = dernierRempli + 1
      if (cible < longueur) refs.current[cible]?.focus()
    }
  }

  // Backspace sur case vide → efface la case précédente et recule le curseur
  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !codes[index] && index > 0) {
      const nouveau = [...codes]
      nouveau[index - 1] = ''
      setCodes(nouveau)
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <View style={styles.conteneur}>
      {codes.map((val, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r }}
          style={[styles.case, val ? styles.caseRemplie : null]}
          value={val}
          onChangeText={(t) => handleChangement(t, i)}
          onFocus={() => handleTouche(i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  )
})

export default InputOTP

const makeStyles = (colors) => StyleSheet.create({
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
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    textAlign: 'center',
    fontFamily: fonts.outfit.bold,
    fontSize: 24,
    color: colors.text,
  },
  caseRemplie: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    color: colors.text,
  },
})