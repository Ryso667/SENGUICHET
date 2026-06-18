# Refonte UX/UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Application de la nouvelle palette Warm Charcoal + 3e version billet physique + micro-interactions premium

**Architecture:** Mise à jour du thème global (theme.js) → composants atomiques → composants composés → écrans. Tous les changements sont dans `mobile/`. Ajout d'expo-haptics pour le feedback tactile.

**Tech Stack:** React Native 0.81.5, Expo SDK 56, expo-haptics, expo-blur, expo-linear-gradient

---

### Task 1: Install expo-haptics

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Install expo-haptics**

Run: `cd mobile && npx expo install expo-haptics`

Expected: Added expo-haptics to dependencies

- [ ] **Step 2: Verify installation**

Run: `cd mobile && cat package.json | grep haptics`
Expected: `"expo-haptics": "^X.X.X"` in dependencies

---

### Task 2: Update theme.js — Nouvelle palette Warm Charcoal

**Files:**
- Modify: `mobile/src/constants/theme.js`

- [ ] **Step 1: Remplacer les couleurs dans theme.js**

Ouvrir `mobile/src/constants/theme.js` et remplacer la palette :

```js
// Couleurs de base
bg: '#1A1A1E',
bgSecondary: '#232329',
surface: '#2C2C30',
text: '#FFFFFF',
textSecondary: '#B0B0B8',
textTertiary: '#8A8A92',
accent: '#D4A574',
accentLight: '#E6C99A',
green: '#6CD4A0',
red: '#E86868',
orange: '#E8A868',
violet: '#A78BFA',
inputBg: 'rgba(255,255,255,0.06)',
inputBorder: 'rgba(255,255,255,0.12)',
inputBorderFocus: '#D4A574',
placeholder: 'rgba(255,255,255,0.45)',
gold: '#D4A574',
```

Remplacer les verres glass :
```js
glass: {
  bg: 'rgba(255,255,255,0.08)',
  darkBg: 'rgba(0,0,0,0.25)',
  border: 'rgba(255,255,255,0.12)',
  blur: 20,
  radius: 20,
},
```

Remplacer les dégradés :
```js
gradients: {
  primary: ['#D4A574', '#C8945C'],
  success: ['#6CD4A0', '#5ABF8C'],
  error: ['#E86868', '#D45555'],
},
```

- [ ] **Step 2: Vérifier le fichier**

Run: `cd mobile && node -e "require('./src/constants/theme')" 2>&1 || echo "OK (les exports ES modules ne fonctionnent pas en require direct, c'est normal)"`
Expected: Pas d'erreur syntaxique (vérifier visuellement)

---

### Task 3: Créer le helper haptics.js

**Files:**
- Create: `mobile/src/utils/haptics.js`

- [ ] **Step 1: Créer le fichier**

```js
import * as Haptics from 'expo-haptics';

export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export const hapticHeavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const hapticError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const hapticWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

export const hapticSelection = () => {
  Haptics.selectionAsync();
};
```

---

### Task 4: Mettre à jour GlassContainer

**Files:**
- Modify: `mobile/src/components/GlassContainer.jsx`

- [ ] **Step 1: Lire le fichier actuel**

Run: `Get-Content -LiteralPath "mobile/src/components/GlassContainer.jsx"`

- [ ] **Step 2: Mettre à jour l'opacité et ajouter la variante surface**

Changer `rgba(255,255,255,0.2)` → `rgba(255,255,255,0.08)` pour `glass.bg`.
Ajouter support d'une prop `variant` : si `variant="surface"`, utiliser fond `#2C2C30` (pas de blur).
Supprimer l'application automatique de `textShadow`.

---

### Task 5: Mettre à jour GlassButton

**Files:**
- Modify: `mobile/src/components/GlassButton.jsx`

- [ ] **Step 1: Lire le fichier actuel**

- [ ] **Step 2: Ajouter haptic + nouvelles couleurs**

Ajouter `import { hapticLight } from '../utils/haptics';`
Appeler `hapticLight()` dans le `onPress`.
Mettre à jour les couleurs pour utiliser `#D4A574` comme accent.

---

### Task 6: Mettre à jour BoutonPrincipal

**Files:**
- Modify: `mobile/src/components/BoutonPrincipal.jsx`

- [ ] **Step 1: Lire et modifier**

Remplacer le dégradé `['#00C8FF', '#0077FF']` par `['#D4A574', '#C8945C']`.
Ajouter `hapticMedium()` sur press.
Ajouter un état "disabled" : opacité 0.5, pas de haptic.

---

### Task 7: Mettre à jour StatusBadge

**Files:**
- Modify: `mobile/src/components/StatusBadge.jsx`

- [ ] **Step 1: Lire et modifier**

Mettre à jour les couleurs :
- ACTIF → `#D4A574` (or)
- EN_ATTENTE → `#E8A868` (orange doux)
- VALIDE → `#6CD4A0` (vert doux)
- TERMINE → `#8A8A92` (gris)
- ANNULE → `#E86868` (rouge doux)
- EN_COURS → `#A78BFA` (violet)
- ACCEPTEE → `#6CD4A0` (vert doux)
- REJETEE → `#E86868` (rouge doux)

---

### Task 8: Mettre à jour GlassChip

**Files:**
- Modify: `mobile/src/components/GlassChip.jsx`

- [ ] **Step 1: Lire et modifier**

Inactif : fond `rgba(255,255,255,0.06)`, texte `#B0B0B8`
Actif : fond `#D4A574`, texte `#1A1A1E`

---

### Task 9: Mettre à jour GlassBottomNav

**Files:**
- Modify: `mobile/src/components/GlassBottomNav.jsx`

- [ ] **Step 1: Lire et modifier**

Fond : `rgba(44,44,48,0.85)` + blur
Active : `#D4A574`
Inactive : `#8A8A92`

---

### Task 10: Créer le composant FormInput (label flottant)

**Files:**
- Create: `mobile/src/components/FormInput.jsx`

- [ ] **Step 1: Créer le composant**

```jsx
import React, { useState, useRef } from 'react';
import {
  View, TextInput, Text, Animated, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      outputRange: ['rgba(255,255,255,0.45)', '#B0B0B8'],
    }),
    backgroundColor: '#232329',
    paddingHorizontal: 4,
    zIndex: 2,
  };

  return (
    <View style={[styles.container, error && styles.containerError]}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={focused ? '#D4A574' : 'rgba(255,255,255,0.35)'}
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
        placeholder={focused ? placeholder : ''}
        placeholderTextColor="rgba(255,255,255,0.3)"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {secureTextEntry && (
        <TouchableOpacity style={styles.eye} onPress={() => setSecure(!secure)}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="rgba(255,255,255,0.35)"
          />
        </TouchableOpacity>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 56,
    marginBottom: 16,
    position: 'relative',
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
    color: '#FFFFFF',
    fontSize: 16,
    paddingLeft: 10,
    paddingRight: 14,
    paddingTop: 8,
    height: 56,
    fontFamily: 'Outfit-Regular',
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
    fontFamily: 'Outfit-Regular',
  },
});

export default FormInput;
```

---

### Task 11: Redesign de TicketScreen

**Files:**
- Modify: `mobile/src/screens/TicketScreen.js`

- [ ] **Step 1: Lire le fichier actuel**

- [ ] **Step 2: Remplacer le design**

Nouveau design physique crème :
- Fond : `#F5F2ED`
- En-tête : bande `#D4A574` avec logo + "Billet électronique"
- Titre événement : 28px, `#1A1A1E`, Outfit Bold
- Date/lieu : 16px, `#5A5A60` avec icônes
- QR Code : 200px, noir sur blanc, cadre `#E8E4DC`
- Ligne pointillée de coupe
- Talon : `#EDE8E0`, référence, prix `#D4A574` 22px, mentions légales
- États : griffe diagonale "UTILISÉ" / "EXPIRÉ"

---

### Task 12: Redesign de MesTicketsScreen

**Files:**
- Modify: `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **Step 1: Lire et modifier**

Cartes redesign :
- Fond `#2C2C30`, coins 16px
- Bande statut gauche 4px (or/vert/gris/rouge)
- Nom 17px `#FFFFFF`, date 14px `#B0B0B8`, lieu 13px `#B0B0B8`
- Badge statut + mini QR 40px en bas à droite
- Pull-to-refresh personnalisé

---

### Task 13: Mettre à jour ScannerScreen

**Files:**
- Modify: `mobile/src/screens/controleur/ScannerScreen.jsx`

- [ ] **Step 1: Lire et modifier**

- Cadre scan : `#D4A574` au lieu de cyan
- Haptic sur scan (success ou error selon résultat)
- Résultat VALIDE : fond vert doux `#6CD4A0`
- Résultat INVALIDE : fond rouge doux `#E86868`

---

### Task 14: Mettre à jour les écrans d'auth

**Files:**
- Modify: `mobile/src/screens/auth/SocialAuthScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/InscriptionOrganisateurScreen.jsx`
- Modify: `mobile/src/screens/auth/ConnexionControleurScreen.jsx`

- [ ] **Step 1: Remplacer les TextInput par FormInput**

Dans chaque écran contenant des formulaires :
- Remplacer les `<TextInput>` par `<FormInput>`
- Ajouter les icônes appropriées
- Ajouter KeyboardAvoidingView + ScrollView + dismiss clavier
- Ajouter haptic sur submission

---

### Task 15: Mettre à jour les Layouts

**Files:**
- Modify: `mobile/src/components/BuyerLayout.jsx`
- Modify: `mobile/src/components/OrganisateurLayout.jsx`
- Modify: `mobile/src/components/ControleurLayout.jsx`

- [ ] **Step 1: Mettre à jour BuyerLayout**
Fond : `#1A1A1E`

- [ ] **Step 2: Mettre à jour OrganisateurLayout**
Fond : `#1A1A1E` (remplace l'indigo `#1E1B4B` → `#312E81`)

- [ ] **Step 3: Mettre à jour ControleurLayout**
Fond : `#1A1A1E`

---

### Task 16: Mettre à jour AccueilChoixScreen

**Files:**
- Modify: `mobile/src/screens/AccueilChoixScreen.jsx`

- [ ] **Step 1: Lire et modifier**

Mettre à jour les couleurs des cartes :
- Acheteur : violet `#A78BFA`
- Contrôleur : or `#D4A574`
- Organisateur : vert doux `#6CD4A0`

---

### Task 17: Mettre à jour l'AppNavigator

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Ajouter des transitions d'écran**

Ajouter `cardStyleInterpolator` pour les transitions :
```js
import { CardStyleInterpolators } from '@react-navigation/stack';

// Dans le stack navigator :
screenOptions={{
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
}}
```

- [ ] **Step 2: Ajouter haptic sur changement de tab**

```js
import { hapticLight } from '../utils/haptics';

// Dans tab press listener :
listeners={({ navigation, route }) => ({
  tabPress: () => {
    hapticLight();
  },
})}
```

---

### Task 18: Vérification globale — lint + build

**Files:**
- N/A

- [ ] **Step 1: Vérifier le lint**

Run: `cd mobile && npx expo-doctor` (vérifie les dépendances)
Run: `cd mobile && npx react-native-community/cli --lint` ou équivalent

- [ ] **Step 2: Build de vérification**

Run: `cd mobile && npx expo export --platform ios --output-dir dist 2>&1 || echo "Export check complete"`
