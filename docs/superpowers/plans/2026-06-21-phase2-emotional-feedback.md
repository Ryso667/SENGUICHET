# Phase 2 — Feedback émotionnel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un CelebrationOverlay après achat réussi, animation d'entrée sur TicketScreen, et haptics sur actions clés.

**Architecture:** 1 nouveau composant (CelebrationOverlay), 2 screens modifiés (EventDetailScreen, TicketScreen), 1 service importé (haptics).

**Tech Stack:** React Native, Animated, expo-haptics

---

### Task 1: Créer CelebrationOverlay

**Files:**
- Create: `mobile/src/components/CelebrationOverlay.jsx`

- [ ] **Step 1: Créer le fichier**

```jsx
// Overlay de célébration après un achat réussi
// Affiche "Paiement réussi !" avec animation spring + émojis qui tombent
import { useEffect, useRef, useMemo } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { hapticSuccess } from '../utils/haptics'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const EMOJIS = ['🎫', '🎉', '✨', '🎊', '🎯']
const NUM_PARTICLES = 15

// Génère une configuration aléatoire pour une particule
function creerParticule() {
  return {
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 500,
    duree: 1000 + Math.random() * 1000,
    taille: 20 + Math.random() * 16,
  }
}

export default function CelebrationOverlay({ visible, onFinish }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const particules = useRef(Array.from({ length: NUM_PARTICLES }, creerParticule)).current
  const fallAnims = useRef(particules.map(() => new Animated.Value(-50))).current
  const fadeAnims = useRef(particules.map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (!visible) return

    hapticSuccess()

    // Animation du texte: scale bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start()

    // Opacité de fond
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    // Lancer les particules avec délai
    particules.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(particules[i].delay),
        Animated.parallel([
          Animated.timing(fallAnims[i], {
            toValue: SCREEN_HEIGHT + 50,
            duration: particules[i].duree,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fadeAnims[i], { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.delay(particules[i].duree - 200),
            Animated.timing(fadeAnims[i], { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
        ]),
      ]).start()
    })

    // Disparaître après 2s
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish?.())
    }, 2000)

    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} pointerEvents="none">
      <Animated.Text style={[styles.title, { transform: [{ scale: scaleAnim }] }]}>
        Paiement réussi !
      </Animated.Text>
      {particules.map((p, i) => (
        <Animated.View
          key={i}
          style={[styles.particle, {
            left: p.x,
            opacity: fadeAnims[i],
            transform: [{ translateY: fallAnims[i] }],
          }]}
        >
          <Text style={{ fontSize: p.taille }}>{p.emoji}</Text>
        </Animated.View>
      ))}
    </Animated.View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  title: {
    fontFamily: fonts.outfit.extraBold,
    fontSize: 28,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/CelebrationOverlay.jsx
git commit -m "feat: crée CelebrationOverlay avec animation spring + emojis tombants"
```

---

### Task 2: Intégrer CelebrationOverlay dans EventDetailScreen

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js` (lignes 251-264, étape success)

- [ ] **Step 1: Ajouter l'import**

```jsx
import CelebrationOverlay from '../components/CelebrationOverlay'
import { hapticMedium, hapticSuccess, hapticSelection } from '../utils/haptics'
```

- [ ] **Step 2: Ajouter le state pour l'overlay**

```jsx
const [showCelebration, setShowCelebration] = useState(false)
```

- [ ] **Step 3: Ajouter CelebrationOverlay dans le JSX**

Juste avant la fermeture du `</KeyboardAvoidingView>` de la page (avant la ligne 684 `</KeyboardAvoidingView>`):
```jsx
<CelebrationOverlay
  visible={showCelebration}
  onFinish={() => {
    setShowCelebration(false)
    setShowPaymentSheet(false)
    if (ticketsData.length > 1) {
      navigation.replace('RecuAchat', {
        reference: resultat.paiement.reference,
        billetsAchetes: ticketsData,
      })
    } else {
      navigation.replace('Ticket', { ticket: ticketsData[0] })
    }
  }}
/>
```

**Important:** Le `ticketsData` doit être accessible dans `confirmerPaiement`. Le déclarer en `let ticketsData` hors du try, ou utiliser `useRef`.

- [ ] **Step 4: Modifier l'étape success (lignes 251-264)**

Remplacer:
```jsx
} else {
  setPaymentResult(ticketsData[0])
  setPaymentEtape('success')
  setTimeout(() => {
    setShowPaymentSheet(false)
    if (ticketsData.length > 1) {
      navigation.replace('RecuAchat', {
        reference: resultat.paiement.reference,
        billetsAchetes: ticketsData,
      })
    } else {
      navigation.replace('Ticket', { ticket: ticketsData[0] })
    }
  }, 2000)
}
```

Par:
```jsx
} else {
  setPaymentResult(ticketsData[0])
  setPaymentEtape('success')
  // Stocker ticketsData pour le CelebrationOverlay
  ticketsDataRef.current = ticketsData
  setShowCelebration(true)
}
```

Et déclarer `const ticketsDataRef = useRef(null)` avec les autres refs.

- [ ] **Step 5: Ajouter hapticMedium sur "Payer"**

Dans `handleBuy` (ligne 155), ajouter en début de fonction:
```jsx
const handleBuy = () => {
  hapticMedium()
  // ...reste du code
}
```

- [ ] **Step 6: Ajouter hapticSelection sur sélection de catégorie**

Dans la fonction qui gère la sélection de catégorie (autour de la ligne 508-553, modal category selection), ajouter:
```jsx
hapticSelection()
```

- [ ] **Step 7: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "feat: integre CelebrationOverlay + haptics dans EventDetailScreen"
```

---

### Task 3: Animation d'entrée sur TicketScreen

**Files:**
- Modify: `mobile/src/screens/TicketScreen.js` (lignes ~143-303)

- [ ] **Step 1: Ajouter les imports Animated**

Le fichier importe déjà `Animated` (ligne ~15). Vérifier:
```jsx
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, ActivityIndicator, Animated } from 'react-native'
```

- [ ] **Step 2: Ajouter l'animation d'entrée**

Après les `useRef` existants, ajouter:
```jsx
const entryAnim = useRef(new Animated.Value(0)).current
const exportAnim = useRef(new Animated.Value(0)).current
```

Dans un `useEffect` au montage:
```jsx
useEffect(() => {
  Animated.spring(entryAnim, {
    toValue: 1,
    friction: 6,
    tension: 80,
    useNativeDriver: true,
  }).start()
  Animated.timing(exportAnim, {
    toValue: 1,
    duration: 400,
    delay: 200,
    useNativeDriver: true,
  }).start()
}, [])
```

- [ ] **Step 3: Envelopper le ticket dans Animated.View**

Remplacer `<View style={styles.ticketWrapper}>` par:
```jsx
<Animated.View style={[styles.ticketWrapper, {
  opacity: entryAnim,
  transform: [
    { scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
    { translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
  ],
}]}>
  {/* ... tout le contenu du ticket ... */}
</Animated.View>
```

Et fermer `</Animated.View>` au lieu de `</View>` (où se termine `ticketWrapper`, ligne ~264).

- [ ] **Step 4: Animer le bouton d'export**

Remplacer le `TouchableOpacity` du bouton export (lignes ~267-277) par:
```jsx
<Animated.View style={{ opacity: exportAnim }}>
  <TouchableOpacity ... >
    ...
  </TouchableOpacity>
</Animated.View>
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/TicketScreen.js
git commit -m "feat: ajoute animation d entree spring sur TicketScreen"
```

---

### Task 4: Haptic sur EventSearch (résultats)

**Files:**
- Modify: `mobile/src/screens/EventSearchScreen.js`

- [ ] **Step 1: Lire le fichier pour identifier les actions de navigation**

```bash
grep -n "navigate\|haptic" mobile/src/screens/EventSearchScreen.js
```

- [ ] **Step 2: Ajouter l'import haptic**

```jsx
import { hapticLight } from '../utils/haptics'
```

- [ ] **Step 3: Ajouter hapticLight sur les clics de carte**

Dans le `renderItem` du FlatList, lorsque l'utilisateur tape sur une carte événement, ajouter:
```jsx
onPress={() => {
  hapticLight()
  navigation.navigate('EventDetail', { eventId: item.id, event: item })
}}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/EventSearchScreen.js
git commit -m "feat: ajoute hapticLight sur les resultats de recherche"
```
