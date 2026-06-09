// src/components/FormInput.jsx
// Champ de saisie premium avec label flottant, icône et validation visuelle
// Le placeholder se transforme en label flottant au-dessus du champ quand l'utilisateur focus

import React, { useState, useRef } from 'react';
import {
  View, TextInput, Text, Animated, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme'

// Composant de champ de saisie avec label flottant animé et icône
// Props :
//   - icon : nom de l'icône Ionicons (optionnel)
//   - label : texte du label flottant
//   - value : valeur actuelle du champ
//   - onChangeText : callback de changement
//   - secureTextEntry : champ masqué (mot de passe)
//   - keyboardType : type de clavier (email, numeric, default...)
//   - returnKeyType : type de touche "Entrée" (next, done...)
//   - onSubmitEditing : callback au submit
//   - error : message d'erreur à afficher
//   - autoFocus : focus automatique
//   - onBlur : callback de perte de focus
//   - placeholder : placeholder (affiché uniquement quand focus)
const FormInput = ({
  icon, label, value, onChangeText, secureTextEntry, keyboardType,
  returnKeyType, onSubmitEditing, error, autoFocus, onBlur, placeholder,
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }
    if (onBlur) onBlur();
  };

  const labelStyle = {
    position: 'absolute',
    left: icon ? 44 : 16,
    top: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, colors.accent],
    }),
    backgroundColor: colors.inputBg,
    paddingHorizontal: 4,
    zIndex: 2,
    fontFamily: 'Outfit_400Regular',
  };

  return (
    <View style={[styles.container, focused && styles.containerFocused, error && styles.containerError]}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
            color={focused ? colors.accent : colors.textTertiary}
          style={styles.icon}
        />
      )}
      <Animated.Text style={labelStyle}>
        {label}
      </Animated.Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType || 'default'}
        returnKeyType={returnKeyType || 'done'}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        placeholder={focused ? placeholder || '' : ''}
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    height: 56,
    marginBottom: 16,
    position: 'relative',
  },
  containerFocused: {
    borderColor: colors.inputBorderFocus,
  },
  containerError: {
    borderColor: '#E86868',
  },
  icon: {
    marginLeft: 14,
    zIndex: 3,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingLeft: 10,
    paddingRight: 14,
    paddingTop: 8,
    height: 56,
    fontFamily: 'Outfit_400Regular',
  },
  inputError: {
    color: '#E86868',
  },
  eye: {
    paddingRight: 14,
    zIndex: 3,
  },
  error: {
    position: 'absolute',
    bottom: -18,
    left: 16,
    color: '#E86868',
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
});

export default FormInput;
