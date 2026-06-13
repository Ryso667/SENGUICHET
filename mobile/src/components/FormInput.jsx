// src/components/FormInput.jsx
// Champ de saisie avec label au-dessus, icône et placeholder toujours visible
// Le placeholder reste affiché tant qu'aucune valeur n'est saisie

import { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, borderRadius, spacing, colors } from '../constants/theme'

// Composant de champ de saisie avec label fixe au-dessus et icône
// Props :
//   - icon : nom de l'icône Ionicons (optionnel)
//   - label : texte du label au-dessus du champ
//   - value : valeur actuelle du champ
//   - onChangeText : callback de changement
//   - secureTextEntry : champ masqué (mot de passe)
//   - keyboardType : type de clavier (email, numeric, default...)
//   - returnKeyType : type de touche "Entrée" (next, done...)
//   - onSubmitEditing : callback au submit
//   - error : message d'erreur à afficher
//   - autoFocus : focus automatique
//   - onBlur : callback de perte de focus
//   - placeholder : texte indicatif affiché quand le champ est vide
const FormInput = ({
  icon, label, value, onChangeText, secureTextEntry, keyboardType,
  returnKeyType, onSubmitEditing, error, autoFocus, onBlur, placeholder,
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.accent : colors.textTertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType || 'default'}
          returnKeyType={returnKeyType || 'done'}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          placeholder={!value ? placeholder || '' : ''}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.accent}
        />
        {secureTextEntry && (
          <TouchableOpacity style={styles.eye} onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.outfit.medium,
    color: colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
  },
  labelFocused: {
    color: colors.accent,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    height: 56,
  },
  containerFocused: {
    borderColor: colors.inputBorderFocus,
  },
  containerError: {
    borderColor: colors.red,
  },
  icon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingLeft: 10,
    paddingRight: 14,
    height: 56,
    fontFamily: fonts.outfit.regular,
  },
  inputError: {
    color: colors.red,
  },
  eye: {
    paddingRight: 14,
  },
  error: {
    position: 'absolute',
    bottom: -18,
    left: 16,
    color: colors.red,
    fontSize: 12,
    fontFamily: fonts.outfit.regular,
  },
});

export default FormInput;
