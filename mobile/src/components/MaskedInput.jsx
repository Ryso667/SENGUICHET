// Champ de saisie masqué pour téléphone et prix
// Utilise react-native-mask-input pour le formatage automatique
import { useState, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaskInput from 'react-native-mask-input'
import { colors, fonts, spacing, borderRadius } from '../../constants/theme'

// Masque téléphone sénégalais : +221 XX XXX XX XX
const PHONE_MASK = ['+', '2', '2', '1', ' ', /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, ' ', /\d/, /\d/]

// Formate un nombre avec espaces tous les 3 chiffres (ex: 1 500)
// Nettoie d'abord tout ce qui n'est pas un chiffre
const formatPrice = (text) => {
  const digits = text.replace(/\D/g, '')
  const parts = []
  for (let i = digits.length; i > 0; i -= 3) {
    parts.unshift(digits.slice(Math.max(0, i - 3), i))
  }
  return parts.join(' ')
}

// Champ de saisie avec masque intégré pour téléphone ou prix
// Props :
//   - mask    : 'phone' | 'price' | tableau personnalisé (optionnel, défaut 'phone')
//   - type    : alias de mask pour compatibilité
//   - value   : valeur contrôlée
//   - onChangeText : callback (valeur brute sans formatage pour price)
//   - label   : texte affiché au-dessus du champ (optionnel)
//   - error   : message d'erreur affiché en dessous (optionnel)
//   - hasError: force l'état erreur (booléen)
//   - ...rest : props passées à MaskInput (placeholder, keyboardType, etc.)
export default function MaskedInput({
  mask: maskProp,
  type,
  value,
  onChangeText,
  label,
  error,
  hasError,
  ...rest
}) {
  const [focus, setFocus] = useState(false)

  // Détermine le masque et le gestionnaire selon le type
  const resolvedType = maskProp || type || 'phone'
  const isPrice = resolvedType === 'price'
  const mask = isPrice ? undefined : (Array.isArray(resolvedType) ? resolvedType : PHONE_MASK)

  // Intercepte le changement pour le type price (formatage personnalisé)
  const handleChangeText = useCallback(
    (text) => {
      if (isPrice) {
        const raw = text.replace(/\D/g, '')
        onChangeText?.(raw)
      } else {
        onChangeText?.(text)
      }
    },
    [isPrice, onChangeText],
  )

  // Calcule la valeur affichée : formatée pour price, brute pour les autres
  const displayValue = isPrice ? formatPrice(value || '') : (value || '')

  // Détermine la couleur de bordure selon l'état
  const borderColor = hasError || error
    ? colors.red
    : focus
      ? colors.accent
      : '#E2E8F0'

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, { borderColor }]}>
        <MaskInput
          mask={mask}
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={colors.muted}
          style={styles.input}
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 14,
    color: colors.mid,
    marginBottom: spacing.xs,
  },
  container: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  input: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 16,
    color: colors.slate,
    padding: 0,
    margin: 0,
  },
  error: {
    fontFamily: fonts.jakarta.regular,
    fontSize: 13,
    color: colors.red,
    marginTop: spacing.xs,
  },
})
