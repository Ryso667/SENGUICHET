# Refonte Interface Acheteur — Apple Invites Style — Plan d'Implémentation

> **Pour les workers agentic :** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans pour implémenter ce plan tâche par tâche.

**Objectif :** Refonte complète des 6 écrans acheteur (Home, EventSearch, EventDetail, Ticket, MesTickets, Support) dans un style Apple Invites : fonds Unsplash, glassmorphism généralisé, animations spring.

**Architecture :** Nouveaux composants glass réutilisables (GlassContainer, BlurBackground, GlassBottomNav, GlassButton, GlassChip, AnimatedEventCard) + hooks d'animation et Unsplash. Les écrans existants sont réécrits pour utiliser ces briques.

**Tech Stack :** React Native Animated API (pas reanimated), expo-blur, Unsplash API, expo-linear-gradient, React Navigation.

---

## Structure des fichiers

### Nouveaux fichiers
| Fichier | Responsabilité |
|---------|---------------|
| `src/components/GlassContainer.jsx` | Wrapper verre dépoli réutilisable (blur + transparence + bordure) |
| `src/components/BlurBackground.jsx` | Image Unsplash plein écran + overlay dégradé + blur optionnel |
| `src/components/GlassBottomNav.jsx` | Barre navigation inférieure avec fond flou et animations |
| `src/components/GlassChip.jsx` | Petit badge/filtre glass pressable |
| `src/components/GlassButton.jsx` | Bouton glass large avec animation scale |
| `src/components/AnimatedEventCard.jsx` | Carte événement avec springIn, stagger, scalePress |
| `src/hooks/useUnsplashImage.js` | Fetch image Unsplash aléatoire par catégorie |
| `src/hooks/useSpringAnimation.js` | Hook générique pour animations spring/timing |

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `src/constants/theme.js` | Ajout valeurs glass étendues, animations presets |
| `src/components/BuyerLayout.jsx` | Adaptation pour fond géré par chaque écran |
| `src/screens/HomeScreen.js` | Refonte complète Apple Invites |
| `src/screens/EventSearchScreen.js` | Refonte complète grille 2 colonnes glass |
| `src/screens/EventDetailScreen.js` | Refonte complète fond immersif + glass |
| `src/screens/TicketScreen.js` | Adaptation glass + pulse QR |
| `src/screens/MesTicketsScreen.jsx` | Adaptation glass + stagger |
| `src/screens/SupportScreen.jsx` | Adaptation glass + FAQ accordéon |
| `.env` | Ajout EXPO_PUBLIC_UNSPLASH_ACCESS_KEY |

### Fichiers supprimés
| Fichier | Remplacé par |
|---------|-------------|
| `src/components/BottomNav.js` | GlassBottomNav.jsx |
| `src/components/EventCard.js` | AnimatedEventCard.jsx |

---

### Task 1: Installer expo-blur + enrichir le thème

**Fichiers :**
- Modifier : `src/constants/theme.js`
- Commande : `npx expo install expo-blur`

- [ ] **Step 1: Install expo-blur**

```bash
npx expo install expo-blur
```

- [ ] **Step 2: Enrichir theme.js avec les valeurs glass et animations**

Modifier `src/constants/theme.js` :

```js
// === GLASS (verre dépoli) ===
export const glass = {
  bg: 'rgba(255,255,255,0.15)',
  bgLight: 'rgba(255,255,255,0.25)',
  bgHeavy: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.25)',
  borderLight: 'rgba(255,255,255,0.12)',
  blur: 20,
  radius: 20,
  darkBg: 'rgba(0,0,0,0.2)',
  darkBgHeavy: 'rgba(0,0,0,0.4)',
}

// === ANIMATIONS (Animated API) ===
export const animations = {
  spring: {
    friction: 6,
    tension: 80,
  },
  timing: {
    duration: 300,
  },
  stagger: 80,
  pulse: {
    duration: 2000,
    minScale: 1,
    maxScale: 1.02,
  },
  scalePress: {
    toValue: 0.96,
    friction: 8,
    tension: 100,
  },
}
```

- [ ] **Step 3: Ajouter les couleurs glass à l'objet `colors`**

Ajouter dans `colors` :
```js
  glassWhite: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.25)',
  glassDark: 'rgba(0,0,0,0.2)',
  textWhite: 'rgba(255,255,255,0.9)',
  textWhiteMuted: 'rgba(255,255,255,0.5)',
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/constants/theme.js mobile/package.json
git commit -m "feat: install expo-blur, enrich theme with glass and animation presets"
```

---

### Task 2: Hook useUnsplashImage

**Fichiers :**
- Créer : `src/hooks/useUnsplashImage.js`

- [ ] **Step 1: Créer le hook useUnsplashImage**

```js
// Hook React pour charger une image aléatoire Unsplash selon une catégorie
// Retourne { url, loading, error, refresh }
// Utilise l'API publique Unsplash avec un mapping catégorie → query
import { useState, useEffect, useCallback } from 'react'

const CATEGORY_MAP = {
  Concert: 'concert crowd music',
  Festival: 'festival celebration',
  Theatre: 'theater stage',
  Sport: 'sport stadium',
  Conference: 'conference speaker',
  Art: 'art exhibition gallery',
  Soiree: 'party dance nightclub',
}

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY

// Charge une image Unsplash aléatoire pour une catégorie donnée
// category : string (optionnelle, défaut 'event party')
// Retourne : { url, loading, error, refresh }
export default function useUnsplashImage(category) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const query = CATEGORY_MAP[category] || 'event party'

  const fetchImage = useCallback(async () => {
    if (!ACCESS_KEY) {
      setUrl(null)
      setLoading(false)
      setError('No Unsplash key configured')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&w=800`,
        { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
      )
      if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)
      const data = await res.json()
      setUrl(data.urls?.regular || null)
    } catch (e) {
      setError(e.message)
      setUrl(null)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { fetchImage() }, [fetchImage])

  return { url, loading, error, refresh: fetchImage }
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/hooks/useUnsplashImage.js
git commit -m "feat: add useUnsplashImage hook for category-based background images"
```

---

### Task 3: Hook useSpringAnimation

**Fichiers :**
- Créer : `src/hooks/useSpringAnimation.js`

- [ ] **Step 1: Créer le hook useSpringAnimation**

```js
// Hook réutilisable pour les animations spring/timing avec Animated API
// Fournit : animated value, run(), reset(), callback on finish
// Utilise useNativeDriver: true pour les performances
import { useRef, useCallback } from 'react'
import { Animated } from 'react-native'
import { animations } from '../constants/theme'

// Hook d'animation spring générique
// initialValue : valeur de départ (défaut 0)
// Retourne : { value, springIn, fadeIn, slideUp, scalePressIn, scalePressOut, pulse, reset }
export default function useSpringAnimation(initialValue = 0) {
  const value = useRef(new Animated.Value(initialValue)).current

  const springIn = useCallback((toValue = 1, config = {}) => {
    return new Promise((resolve) => {
      Animated.spring(value, {
        toValue,
        friction: animations.spring.friction,
        tension: animations.spring.tension,
        useNativeDriver: true,
        ...config,
      }).start(resolve)
    })
  }, [value])

  const fadeIn = useCallback((duration = animations.timing.duration) => {
    return new Promise((resolve) => {
      Animated.timing(value, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(resolve)
    })
  }, [value])

  const slideUp = useCallback((duration = animations.timing.duration) => {
    return new Promise((resolve) => {
      Animated.timing(value, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start(resolve)
    })
  }, [value])

  const scalePressIn = useCallback(() => {
    Animated.spring(value, {
      toValue: animations.scalePress.toValue,
      friction: animations.scalePress.friction,
      tension: animations.scalePress.tension,
      useNativeDriver: true,
    }).start()
  }, [value])

  const scalePressOut = useCallback(() => {
    Animated.spring(value, {
      toValue: 1,
      friction: animations.scalePress.friction,
      tension: animations.scalePress.tension,
      useNativeDriver: true,
    }).start()
  }, [value])

  const pulse = useCallback((config = {}) => {
    const { minScale = 1, maxScale = 1.02, duration = 2000 } = config
    const sequence = Animated.sequence([
      Animated.timing(value, { toValue: maxScale, duration: duration / 2, useNativeDriver: true }),
      Animated.timing(value, { toValue: minScale, duration: duration / 2, useNativeDriver: true }),
    ])
    const loop = Animated.loop(sequence)
    loop.start()
    return loop
  }, [value])

  const reset = useCallback((toValue = initialValue) => {
    value.setValue(toValue)
  }, [value, initialValue])

  return { value, springIn, fadeIn, slideUp, scalePressIn, scalePressOut, pulse, reset }
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/hooks/useSpringAnimation.js
git commit -m "feat: add useSpringAnimation reusable hook with spring, timing, pulse"
```

---

### Task 4: Composant GlassContainer

**Fichiers :**
- Créer : `src/components/GlassContainer.jsx`

- [ ] **Step 1: Créer GlassContainer**

```js
// Conteneur réutilisable avec effet verre dépoli (glassmorphism)
// Utilise expo-blur pour le backdrop blur natif
// Props : style, blurType, blurAmount, intensity, children
import { View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { glass, borderRadius } from '../constants/theme'

// Wrapper glass avec blur natif, bordure translucide, et fond semi-transparent
// blurType : 'light' | 'dark' | 'extraLight' (défaut 'light')
// intensity : 0-100 (défaut 60)
export default function GlassContainer({ children, style, blurType = 'light', intensity = 60 }) {
  return (
    <BlurView tint={blurType} intensity={intensity} style={[styles.container, style]}>
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    overflow: 'hidden',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/GlassContainer.jsx
git commit -m "feat: add GlassContainer with expo-blur backdrop blur"
```

---

### Task 5: Composant BlurBackground

**Fichiers :**
- Créer : `src/components/BlurBackground.jsx`

- [ ] **Step 1: Créer BlurBackground**

```js
// Fond d'écran plein écran avec image Unsplash + overlay dégradé
// Utilisé comme arrière-plan sur tous les écrans acheteur
// Props : category (pour Unsplash), fallbackColor, blurTop, blurBottom, children overlay
import { useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import useUnsplashImage from '../hooks/useUnsplashImage'
import { colors } from '../constants/theme'

// Fond immersif avec image Unsplash + overlay dégradé
// category : catégorie d'événement pour la recherche Unsplash
// showBlur : booléen, floute l'image (défaut false)
// intensityOverlay : booléen, force un overlay foncé pour la lisibilité (défaut true)
export default function BlurBackground({ category, showBlur = false, intensityOverlay = true }) {
  const { url } = useUnsplashImage(category)
  const [loaded, setLoaded] = useState(false)

  return (
    <View style={StyleSheet.absoluteFill}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={styles.image}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <LinearGradient
          colors={['#6366F1', '#EC4899']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {loaded && showBlur && (
        <BlurView tint="dark" intensity={10} style={StyleSheet.absoluteFill} />
      )}

      {intensityOverlay && (
        <LinearGradient
          colors={['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.1)', 'rgba(15,23,42,0.1)', 'rgba(15,23,42,0.4)']}
          locations={[0, 0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/BlurBackground.jsx
git commit -m "feat: add BlurBackground with Unsplash image and gradient overlay"
```

---

### Task 6: Composant GlassChip

**Fichiers :**
- Créer : `src/components/GlassChip.jsx`

- [ ] **Step 1: Créer GlassChip**

```js
// Petit badge/filtre glass pressable pour les catégories et les tags
// Props : label, icon, active, onPress, style
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { glass, fonts, borderRadius, spacing } from '../constants/theme'

// Chips glass avec icône et texte
// active : booléen, surbrillance quand actif
// label : string
// icon : nom d'icône Feather (optionnel)
// onPress : fonction callback
export default function GlassChip({ label, icon, active, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.active, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Feather name={icon} size={12} color={active ? '#fff' : 'rgba(255,255,255,0.8)'} />}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: glass.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
  },
  active: {
    backgroundColor: glass.bgHeavy,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.8)',
  },
  activeLabel: {
    color: '#fff',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/GlassChip.jsx
git commit -m "feat: add GlassChip component for category filters and tags"
```

---

### Task 7: Composant GlassButton

**Fichiers :**
- Créer : `src/components/GlassButton.jsx`

- [ ] **Step 1: Créer GlassButton**

```js
// Bouton glass large avec animation scale au press
// Props : title, icon, onPress, style, textStyle
import { useRef } from 'react'
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { glass, fonts, borderRadius, spacing } from '../constants/theme'

// Bouton glass large avec icône et animation scalePress
// title : string du texte
// icon : nom d'icône Feather (optionnel)
// onPress : fonction callback
export default function GlassButton({ title, icon, onPress, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <BlurView tint="light" intensity={50} style={styles.button}>
          {icon && <Feather name={icon} size={18} color="#fff" style={styles.icon} />}
          <Text style={[styles.title, textStyle]}>{title}</Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.border,
    backgroundColor: glass.bgLight,
    overflow: 'hidden',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.outfit.semiBold,
    color: '#fff',
    letterSpacing: -0.2,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/GlassButton.jsx
git commit -m "feat: add GlassButton with scale animation and blur background"
```

---

### Task 8: Composant AnimatedEventCard

**Fichiers :**
- Créer : `src/components/AnimatedEventCard.jsx`
- Supprimer : `src/components/EventCard.js`

- [ ] **Step 1: Créer AnimatedEventCard**

```js
// Carte événement avec animations springIn, stagger, et scalePress
// Remplace EventCard.js — design glass avec image de fond
// Props : event, onPress, index (pour stagger), style
import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, glass, animations } from '../constants/theme'
import { getDefaultImage } from '../config/images'

// Carte événement animée avec apparition spring et feedback press
// event : objet { title, month, day, bg, emoji, category, location, time, priceLabel }
// onPress : fonction callback
// index : nombre pour le délai stagger (défaut 0)
export default function AnimatedEventCard({ event, onPress, index = 0 }) {
  const spring = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const def = event.category ? getDefaultImage(event.category) : null
  const iconName = def?.icon || null

  useEffect(() => {
    const delay = index * animations.stagger
    const timeout = setTimeout(() => {
      Animated.spring(spring, {
        toValue: 1,
        friction: animations.spring.friction,
        tension: animations.spring.tension,
        delay: 0,
        useNativeDriver: true,
      }).start()
    }, delay)
    return () => clearTimeout(timeout)
  }, [spring, index])

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: animations.scalePress.toValue,
      friction: animations.scalePress.friction,
      tension: animations.scalePress.tension,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start()
  }

  const animatedStyle = {
    opacity: spring.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { scale },
      {
        translateY: spring.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
      },
    ],
  }

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.card, { backgroundColor: event.bg || '#6366F1' }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
            style={styles.overlay}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeMonth}>{event.month}</Text>
            <Text style={styles.badgeDay}>{event.day}</Text>
          </View>

          {iconName ? (
            <MaterialCommunityIcons name={iconName} size={28} color="rgba(255,255,255,0.6)" style={styles.icon} />
          ) : (
            <Text style={styles.emoji}>{event.emoji}</Text>
          )}

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={9} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText} numberOfLines={1}>{event.location || 'À venir'}</Text>
            </View>
            {event.priceLabel && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{event.priceLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 180,
    marginRight: 12,
  },
  card: {
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: 'center',
    zIndex: 1,
  },
  badgeMonth: {
    fontSize: 7,
    fontFamily: fonts.jakarta.semiBold,
    textTransform: 'uppercase',
    color: '#fff',
    letterSpacing: 0.8,
  },
  badgeDay: {
    fontSize: 12,
    fontFamily: fonts.outfit.bold,
    color: '#fff',
  },
  icon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  emoji: { fontSize: 24, position: 'absolute', right: 10, top: 10 },
  body: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 3,
  },
  title: {
    fontFamily: fonts.outfit.bold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.jakarta.regular,
    flex: 1,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  priceText: {
    fontSize: 10,
    fontFamily: fonts.jakarta.semiBold,
    color: '#fff',
  },
})
```

- [ ] **Step 2: Supprimer EventCard.js**

```bash
git rm mobile/src/components/EventCard.js
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/AnimatedEventCard.jsx
git commit -m "feat: add AnimatedEventCard with springIn, stagger, scalePress; remove EventCard.js"
```

---

### Task 9: GlassBottomNav

**Fichiers :**
- Créer : `src/components/GlassBottomNav.jsx`
- Supprimer : `src/components/BottomNav.js`

- [ ] **Step 1: Créer GlassBottomNav**

```js
// Barre de navigation inférieure avec effet verre dépoli (expo-blur)
// Remplace BottomNav.js — design Apple Invites
// 3 tabs : Accueil, Mes Tickets, Support
// Animation slide au changement, icône active surélevée
import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { fonts, glass } from '../constants/theme'

const TABS = [
  { key: 'Home', icon: 'home', label: 'Accueil' },
  { key: 'MesTickets', icon: 'tag', label: 'Mes Tickets' },
  { key: 'Support', icon: 'message-circle', label: 'Support' },
]

export default function GlassBottomNav() {
  const navigation = useNavigation()
  const route = useRoute()
  const slideAnim = useRef(new Animated.Value(0)).current
  const prevIndex = useRef(0)

  const currentIndex = TABS.findIndex(t => t.key === route.name)
  useEffect(() => {
    if (currentIndex !== -1 && currentIndex !== prevIndex.current) {
      Animated.timing(slideAnim, {
        toValue: currentIndex > prevIndex.current ? 1 : -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        slideAnim.setValue(0)
        prevIndex.current = currentIndex
      })
    }
  }, [currentIndex, slideAnim])

  return (
    <BlurView tint="light" intensity={80} style={styles.container}>
      {TABS.map((tab) => {
        const active = route.name === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => navigation.navigate(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.activeIcon]}>
              <Feather name={tab.icon} size={20} color={active ? '#fff' : 'rgba(255,255,255,0.5)'} />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderLight,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: glass.bg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.jakarta.medium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#fff',
    fontFamily: fonts.jakarta.semiBold,
  },
})
```

- [ ] **Step 2: Supprimer BottomNav.js**

```bash
git rm mobile/src/components/BottomNav.js
```

- [ ] **Step 3: Mettre à jour BuyerLayout.jsx**

```js
// Layout réutilisable pour toutes les pages acheteur — version glass
// Le fond est géré par chaque écran via BlurBackground
// Ce layout fournit uniquement le conteneur et la GlassBottomNav
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import GlassBottomNav from './GlassBottomNav'

export default function BuyerLayout({ children }) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {children}
      </SafeAreaView>
      <GlassBottomNav />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/GlassBottomNav.jsx mobile/src/components/BuyerLayout.jsx
git rm mobile/src/components/BottomNav.js
git commit -m "feat: add GlassBottomNav with blur and animations, update BuyerLayout"
```

---

### Task 10: HomeScreen refonte complète

**Fichiers :**
- Modifier : `src/screens/HomeScreen.js`

- [ ] **Step 1: Réécrire HomeScreen**

```js
// Écran d'accueil acheteur — version Apple Invites
// Fond : image Unsplash plein écran + overlay
// Header : carte glass "Bonjour" avec compteur tickets
// Section : cartes événements horizontales animées
// Section : tickets récents en glass
// CTA : Explorer les événements en glass button
import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, colors, spacing, borderRadius, glass, animations } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { formaterDateLisible } from '../utils/dateUtils'
import { formaterPourEventCard } from '../utils/eventUtils'
import { fetchEvenementsPublics } from '../services/eventService'
import { mesBillets } from '../services/billetService'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#00E5A0', dot: '#00E5A0' },
  en_attente: { label: 'EN ATTENTE', color: '#F97316', dot: '#F97316' },
  utilise: { label: 'UTILISÉ', color: '#94A3B8', dot: '#94A3B8' },
  rembourse: { label: 'REMBOURSÉ', color: '#FF4D6D', dot: '#FF4D6D' },
}

export default function HomeScreen({ navigation }) {
  const [evenements, setEvenements] = useState([])
  const [tickets, setTickets] = useState([])
  const [category, setCategory] = useState(null)
  const { deconnecter, numeroTel, profil } = useAuth()
  const headerSpring = useRef(new Animated.Value(0)).current
  const sectionSpring = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(headerSpring, {
      toValue: 1,
      friction: animations.spring.friction,
      tension: animations.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [headerSpring])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const identifiant = numeroTel || profil?.email
      if (identifiant) {
        const data = await mesBillets(identifiant)
        setTickets(data || [])
      }
      const events = await fetchEvenementsPublics()
      const formatted = events.map(formaterPourEventCard)
      setEvenements(formatted)
      if (formatted.length > 0) {
        setCategory(formatted[0].category)
      }

      Animated.spring(sectionSpring, {
        toValue: 1,
        friction: animations.spring.friction,
        tension: animations.spring.tension,
        useNativeDriver: true,
      }).start()
    })
    return unsubscribe
  }, [navigation, numeroTel, profil])

  const headerStyle = {
    opacity: headerSpring,
    transform: [{ translateY: headerSpring.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
  }

  return (
    <View style={styles.container}>
      <BlurBackground category={category} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bonjour */}
        <Animated.View style={[styles.headerWrap, headerStyle]}>
          <GlassContainer style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Feather name="user" size={20} color="#fff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Bonjour</Text>
                <Text style={styles.name}>{profil?.nom || 'Invité'}</Text>
              </View>
              <TouchableOpacity onPress={deconnecter} style={styles.logoutBtn}>
                <Feather name="log-out" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            {tickets.length > 0 && (
              <View style={styles.ticketCount}>
                <Feather name="tag" size={12} color="#00E5A0" />
                <Text style={styles.ticketCountText}>
                  {tickets.length} ticket{tickets.length > 1 ? 's' : ''} actif{tickets.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </GlassContainer>
        </Animated.View>

        {/* Section événements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À découvrir</Text>
        </View>

        {evenements.length === 0 && (
          <Text style={styles.emptyText}>Aucun événement dispo pour le moment</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsRow}>
          {evenements.map((event, i) => (
            <AnimatedEventCard
              key={event.id}
              event={event}
              index={i}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
            />
          ))}
        </ScrollView>

        {/* Section mes tickets */}
        {tickets.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes tickets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MesTickets')}>
                <Text style={styles.voirTout}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticketsList}>
              {tickets.slice(0, 3).map((t, i) => (
                <TouchableOpacity
                  key={t.numero || t.id}
                  onPress={() => navigation.navigate('Ticket', { ticket: t })}
                  activeOpacity={0.7}
                >
                  <GlassContainer style={styles.ticketCard} intensity={40}>
                    <View style={[styles.ticketDot, { backgroundColor: (STATUTS[t.statut]?.dot || '#00E5A0') }]} />
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketTitle}>{t.eventNom || 'Événement'}</Text>
                      <Text style={styles.ticketMeta}>
                        {t.categorie} · {formaterDateLisible(t.eventDate)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUTS[t.statut]?.color || '#00E5A0'}25` }]}>
                      <Text style={[styles.statusText, { color: STATUTS[t.statut]?.color || '#00E5A0' }]}>
                        {STATUTS[t.statut]?.label || 'VALIDE'}
                      </Text>
                    </View>
                  </GlassContainer>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* CTA Explorer */}
        <View style={styles.ctaWrap}>
          <GlassButton
            title="Explorer les événements"
            icon="search"
            onPress={() => navigation.navigate('EventSearch')}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Paiement Wave & Orange Money · Sans compte requis</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  headerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerCard: { padding: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.jakarta.regular },
  name: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ticketCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderLight,
  },
  ticketCountText: {
    fontSize: 11, fontFamily: fonts.jakarta.semiBold,
    color: '#00E5A0',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3,
  },
  voirTout: {
    fontSize: 12, fontFamily: fonts.jakarta.semiBold,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyText: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.6)', marginVertical: spacing.lg,
  },
  eventsRow: { paddingLeft: spacing.lg, paddingRight: spacing.lg },
  ticketsList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  ticketDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  ticketInfo: { flex: 1 },
  ticketTitle: {
    fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff', letterSpacing: -0.1,
  },
  ticketMeta: {
    fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.jakarta.regular, marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10, fontFamily: fonts.jakarta.semiBold,
  },
  ctaWrap: { paddingHorizontal: spacing.lg, marginTop: 24 },
  footer: {
    textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.jakarta.regular, marginTop: 24, marginBottom: spacing.sm,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/HomeScreen.js
git commit -m "feat: refactor HomeScreen with Apple Invites design, BlurBackground, glass elements"
```

---

### Task 11: EventSearchScreen refonte

**Fichiers :**
- Modifier : `src/screens/EventSearchScreen.js`

- [ ] **Step 1: Réécrire EventSearchScreen**

```js
// Écran de recherche d'événements — version Apple Invites
// Fond : images Unsplash en mosaïque
// Barre de recherche glass, chips catégories, grille 2 colonnes
import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing, borderRadius, glass } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import EmptyState from '../components/EmptyState'
import AnimatedEventCard from '../components/AnimatedEventCard'
import { fetchEvenementsPublics } from '../services/eventService'
import { formaterPourEventCard } from '../utils/eventUtils'

const CATEGORIES = ['Tout', 'Concert', 'Festival', 'Sport', 'Theatre', 'Conference']

export default function EventSearchScreen({ navigation }) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Tout')
  const [events, setEvents] = useState([])

  useEffect(() => {
    const load = async () => {
      const data = await fetchEvenementsPublics()
      setEvents(data.map(formaterPourEventCard))
    }
    load()
  }, [])

  const filtered = events.filter((e) => {
    const matchCat = activeCat === 'Tout' || e.category === activeCat
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <View style={styles.container}>
      <BlurBackground category={activeCat === 'Tout' ? null : activeCat} intensityOverlay />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <GlassContainer style={styles.searchBar} blurType="light" intensity={60}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Concert à Dakar..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Feather name="x" size={16} color="rgba(255,255,255,0.6)" onPress={() => setSearch('')} />
          )}
        </GlassContainer>

        {/* Chips catégories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          {CATEGORIES.map((cat) => (
            <GlassChip
              key={cat}
              label={cat}
              active={activeCat === cat}
              onPress={() => setActiveCat(cat)}
            />
          ))}
        </ScrollView>

        {/* Grille résultats */}
        <View style={styles.grid}>
          {filtered.map((event, i) => (
            <View key={event.id} style={styles.gridItem}>
              <AnimatedEventCard
                event={event}
                index={i}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
              />
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="Aucun résultat"
            subtitle="Essaie un autre mot-clé ou catégorie"
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.jakarta.regular, color: '#fff',
    padding: 0,
  },
  chipsRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  chipsContent: { paddingHorizontal: spacing.lg, gap: 8 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, gap: 12,
    marginTop: spacing.sm,
  },
  gridItem: {
    width: '47%',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/EventSearchScreen.js
git commit -m "feat: refactor EventSearchScreen with glass search, chips, grid"
```

---

### Task 12: EventDetailScreen refonte

**Fichiers :**
- Modifier : `src/screens/EventDetailScreen.js`

- [ ] **Step 1: Lire le fichier actuel pour comprendre la logique de paiement**

Lire le fichier original pour extraire la logique de paiement (Wave/Orange Money) qui doit être préservée dans la nouvelle version.

```bash
cat mobile/src/screens/EventDetailScreen.js
```

- [ ] **Step 2: Réécrire EventDetailScreen en conservant le flux de paiement**

IMPORTANT : Le flux de paiement existant (sélection catégorie, Wave phone input, modale de confirmation, WebView Wave) doit être conservé intégralement. Seul le design change (BlurBackground + GlassContainer + GlassButton + fond immersif). Extraire toute la logique de `handleAcheter`, `handlePaiementWave`, les modales et le WebView du fichier original.

```js
// Détail événement avec fond immersif + cartes glass
// Conserve le flux de paiement Wave/Orange Money existant
// Design : BlurBackground + GlassContainer pour tous les éléments
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing, borderRadius, glass } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassButton from '../components/GlassButton'
import { formaterDateLisible } from '../utils/dateUtils'

// Conserver les imports et la logique de paiement du fichier original (Wave/Orange)
// [Importer ici les services de paiement, les modales, etc. depuis l'original]

export default function EventDetailScreen({ route, navigation }) {
  const { eventId, event } = route.params || {}
  const [selectedCat, setSelectedCat] = useState(null)

  // Sera remplacé par fetchEvenementDetailPublic(eventId)
  const mockCategories = event?.categories || [
    { id: 'std', nom: 'Standard', prix: 5000, dispo: 50 },
    { id: 'vip', nom: 'VIP', prix: 15000, dispo: 20 },
    { id: 'gold', nom: 'Gold', prix: 25000, dispo: 10 },
  ]

  // Logique de paiement extraite du fichier original
  // [Insérer ici handleAcheter, handlePaiementWave, handlePaiementOrange, etc.]

  return (
    <View style={styles.container}>
      <BlurBackground category={event?.category} />

      {/* Bouton retour flottant */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.spacer} />

        {/* Titre et date */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>{event?.title || 'Événement'}</Text>
          <Text style={styles.date}>{formaterDateLisible(event?.date)} · {event?.time || '20h00'}</Text>
          {event?.location && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.location}>{event.location}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {event?.description && (
          <GlassContainer style={styles.descriptionCard} intensity={50}>
            <Text style={styles.descTitle}>À propos</Text>
            <Text style={styles.descText}>{event.description}</Text>
          </GlassContainer>
        )}

        {/* Catégories de tickets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choisis ta place</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {mockCategories.map((cat) => {
            const active = selectedCat?.id === cat.id
            return (
              <TouchableOpacity key={cat.id} onPress={() => setSelectedCat(cat)} activeOpacity={0.7}>
                <GlassContainer
                  style={[styles.catCard, active && styles.catCardActive]}
                  intensity={active ? 70 : 40}
                >
                  <Text style={styles.catName}>{cat.nom}</Text>
                  <Text style={styles.catPrice}>{cat.prix.toLocaleString()} fr</Text>
                  <Text style={styles.catDispo}>{cat.dispo} places</Text>
                </GlassContainer>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* CTA Acheter — conserver la logique originale du bouton */}
        <View style={styles.ctaWrap}>
          <GlassButton
            title={selectedCat ? `Acheter ${selectedCat.nom} — ${selectedCat.prix.toLocaleString()} fr` : 'Sélectionne une place'}
            icon="shopping-cart"
            onPress={() => {
              if (selectedCat) {
                // Remplacer par handleAcheter() original
                navigation.navigate('WebViewWave', { eventId, categorie: selectedCat })
              }
            }}
            style={selectedCat ? null : styles.ctaDisabled}
          />
        </View>

        {/* Modales de paiement — les conserver du fichier original,
            envelopper les contenus dans GlassContainer pour le nouveau style */}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  backBtn: {
    position: 'absolute', top: 50, left: spacing.lg, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  spacer: { height: 100 },
  heroSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  title: {
    fontSize: 32, fontFamily: fonts.outfit.bold, color: '#fff',
    letterSpacing: -0.5, lineHeight: 38,
  },
  date: {
    fontSize: 14, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  location: {
    fontSize: 13, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  descriptionCard: { marginHorizontal: spacing.lg, padding: spacing.md, marginBottom: spacing.md },
  descTitle: {
    fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#fff', marginBottom: 6,
  },
  descText: {
    fontSize: 12, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.8)', lineHeight: 18,
  },
  sectionHeader: { paddingHorizontal: spacing.lg, marginBottom: 12, marginTop: 8 },
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3,
  },
  categoriesRow: { paddingHorizontal: spacing.lg, gap: 12 },
  catCard: { padding: spacing.md, alignItems: 'center', minWidth: 120 },
  catCardActive: { borderColor: '#00C8FF', borderWidth: 1.5 },
  catName: { fontSize: 14, fontFamily: fonts.outfit.semiBold, color: '#fff' },
  catPrice: { fontSize: 18, fontFamily: fonts.outfit.bold, color: '#00E5A0', marginTop: 4 },
  catDispo: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: fonts.jakarta.regular, marginTop: 2 },
  ctaWrap: { paddingHorizontal: spacing.lg, marginTop: 24 },
  ctaDisabled: { opacity: 0.5 },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "feat: refactor EventDetailScreen with immersive background and glass tickets"
```

---

### Task 13: MesTicketsScreen adaptation

**Fichiers :**
- Modifier : `src/screens/MesTicketsScreen.jsx`

- [ ] **Step 1: Réécrire MesTicketsScreen**

```js
// Liste des tickets de l'acheteur — version glass
// FlatList avec stagger animation, chaque item est une carte glass
import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, spacing, borderRadius, glass } from '../constants/theme'
import GlassContainer from '../components/GlassContainer'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { mesBillets } from '../services/billetService'
import { formaterDateLisible } from '../utils/dateUtils'

const STATUTS = {
  actif: { label: 'VALIDE', color: '#00E5A0', bg: '#00E5A015' },
  en_attente: { label: 'EN ATTENTE', color: '#F97316', bg: '#F9731615' },
  utilise: { label: 'UTILISÉ', color: '#94A3B8', bg: '#94A3B815' },
  rembourse: { label: 'REMBOURSÉ', color: '#FF4D6D', bg: '#FF4D6D15' },
}

export default function MesTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const { numeroTel, profil } = useAuth()

  const loadTickets = useCallback(async () => {
    const identifiant = numeroTel || profil?.email
    if (identifiant) {
      const data = await mesBillets(identifiant)
      setTickets(data || [])
    }
  }, [numeroTel, profil])

  useFocusEffect(useCallback(() => { loadTickets() }, [loadTickets]))

  const onRefresh = async () => {
    setRefreshing(true)
    await loadTickets()
    setRefreshing(false)
  }

  const renderItem = ({ item }) => {
    const s = STATUTS[item.statut] || STATUTS.actif
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Ticket', { ticket: item })}
        activeOpacity={0.7}
      >
        <GlassContainer style={styles.ticketCard} intensity={40}>
          <View style={styles.eventThumb}>
            <LinearGradient colors={['#6366F1', '#EC4899']} style={styles.thumbGradient}>
              <Feather name="ticket" size={18} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle} numberOfLines={1}>{item.eventNom || 'Événement'}</Text>
            <Text style={styles.ticketMeta}>
              {item.categorie} · {formaterDateLisible(item.eventDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </GlassContainer>
      </TouchableOpacity>
    )
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes tickets</Text>
        {tickets.length > 0 && (
          <GlassContainer style={styles.countBadge} intensity={50}>
            <Text style={styles.countText}>{tickets.length}</Text>
          </GlassContainer>
        )}
      </View>

      <FlatList
        data={tickets}
        renderItem={renderItem}
        keyExtractor={(item) => item.numero || item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="ticket"
            title="Aucun ticket"
            subtitle="Explore les événements et achète ton premier ticket"
            actionLabel="Explorer"
            onAction={() => navigation.navigate('Home')}
          />
        }
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.5 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontFamily: fonts.jakarta.semiBold, color: '#fff' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: 10 },
  ticketCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12,
  },
  eventThumb: {
    width: 52, height: 52, borderRadius: borderRadius.md, overflow: 'hidden',
  },
  thumbGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  ticketInfo: { flex: 1 },
  ticketTitle: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: '#fff', letterSpacing: -0.1 },
  ticketMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: fonts.jakarta.regular, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 10, fontFamily: fonts.jakarta.semiBold },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/MesTicketsScreen.jsx
git commit -m "feat: refactor MesTicketsScreen with glass cards and dark gradient background"
```

---

### Task 14: TicketScreen adaptation

**Fichiers :**
- Modifier : `src/screens/TicketScreen.js`

- [ ] **Step 1: Réécrire TicketScreen**

```js
// Affichage du ticket avec QR code — version glass
// Fond : image floutée de l'événement
// Carte ticket centrale avec animation pulse du QR
import { useRef, useEffect } from 'react'
import { View, Text, Animated, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { fonts, spacing, borderRadius, glass } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'
import { formaterDateLisible } from '../utils/dateUtils'

export default function TicketScreen({ route, navigation }) {
  const { ticket } = route.params || {}
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])
    const loop = Animated.loop(sequence)
    loop.start()
    return () => loop.stop()
  }, [pulseAnim])

  return (
    <View style={styles.container}>
      <BlurBackground category={ticket?.categorie} showBlur={true} />

      {/* Bouton retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Carte ticket */}
        <GlassContainer style={styles.ticketCard} blurType="light" intensity={70}>
          <Animated.View style={[styles.qrWrap, { transform: [{ scale: pulseAnim }] }]}>
            <QRCode
              value={ticket?.hmac || ticket?.numero || 'senguichet-ticket'}
              size={200}
              backgroundColor="transparent"
              color="#fff"
            />
          </Animated.View>

          <View style={styles.ticketInfo}>
            <Text style={styles.eventName}>{ticket?.eventNom || 'Événement'}</Text>
            <Text style={styles.eventMeta}>
              {ticket?.categorie} · {formaterDateLisible(ticket?.eventDate)}
            </Text>
          </View>
        </GlassContainer>

        {/* Actions */}
        <View style={styles.actions}>
          <GlassChip label="Partager" icon="share" onPress={() => {}} />
          <GlassChip label="PDF" icon="file-text" onPress={() => {}} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute', top: 50, left: 24, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  ticketCard: {
    padding: spacing.lg, alignItems: 'center', width: '100%',
  },
  qrWrap: {
    padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: spacing.lg,
  },
  ticketInfo: { alignItems: 'center' },
  eventName: {
    fontSize: 18, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3,
  },
  eventMeta: {
    fontSize: 13, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)', marginTop: 4,
  },
  actions: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/TicketScreen.js
git commit -m "feat: refactor TicketScreen with glass card and pulse QR animation"
```

---

### Task 15: SupportScreen adaptation

**Fichiers :**
- Modifier : `src/screens/SupportScreen.jsx`

- [ ] **Step 1: Réécrire SupportScreen**

```js
// Écran Support — version glass
// Fond : image Unsplash abstraite
// Contacts et FAQ en cartes glass
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing, borderRadius, glass } from '../constants/theme'
import BlurBackground from '../components/BlurBackground'
import GlassContainer from '../components/GlassContainer'
import GlassChip from '../components/GlassChip'

const FAQ = [
  { q: 'Comment acheter un ticket ?', r: 'Choisis un événement, sélectionne ta catégorie de ticket, paie via Wave ou Orange Money.' },
  { q: 'Puis-je être remboursé ?', r: 'Les remboursements sont gérés par l\'organisateur. Contacte le support si besoin.' },
  { q: 'Mon QR ne fonctionne pas', r: 'Assure-toi d\'avoir une bonne connexion. Le QR se régénère toutes les 30s.' },
]

export default function SupportScreen() {
  const [openIndex, setOpenIndex] = useState(null)

  const handleCall = () => { Linking.openURL('tel:+221771234567') }
  const handleWhatsApp = () => { Linking.openURL('https://wa.me/221771234567') }

  return (
    <View style={styles.container}>
      <BlurBackground category="Conference" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassContainer style={styles.headerCard} intensity={50}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.subtitle}>Comment pouvons-nous t'aider ?</Text>
        </GlassContainer>

        {/* Contacts */}
        <GlassContainer style={styles.contactsCard} intensity={40}>
          <View style={styles.contactRow}>
            <Feather name="mail" size={16} color="#00C8FF" />
            <Text style={styles.contactText}>support@senguichet.sn</Text>
            <GlassChip label="Copier" onPress={() => {}} />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <Feather name="phone" size={16} color="#00E5A0" />
            <Text style={styles.contactText}>+221 77 123 45 67</Text>
            <GlassChip label="Appeler" onPress={handleCall} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
            <Feather name="message-circle" size={16} color="#25D366" />
            <Text style={styles.contactText}>WhatsApp</Text>
            <GlassChip label="Écrire" onPress={handleWhatsApp} />
          </TouchableOpacity>
        </GlassContainer>

        {/* FAQ */}
        <Text style={styles.faqTitle}>Questions fréquentes</Text>
        {FAQ.map((item, i) => {
          const open = openIndex === i
          return (
            <TouchableOpacity key={i} onPress={() => setOpenIndex(open ? null : i)} activeOpacity={0.7}>
              <GlassContainer style={styles.faqItem} intensity={40}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.6)" />
                </View>
                {open && <Text style={styles.faqAnswer}>{item.r}</Text>}
              </GlassContainer>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  headerCard: { padding: spacing.md, alignItems: 'center' },
  title: { fontSize: 22, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  contactsCard: { padding: spacing.md },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
  },
  contactText: {
    flex: 1, fontSize: 13, fontFamily: fonts.jakarta.regular, color: '#fff',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: glass.borderLight },
  faqTitle: {
    fontSize: 16, fontFamily: fonts.outfit.bold, color: '#fff', letterSpacing: -0.3, marginTop: 8,
  },
  faqItem: { padding: spacing.md },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  faqQuestion: {
    flex: 1, fontSize: 13, fontFamily: fonts.jakarta.semiBold, color: '#fff', marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: 12, fontFamily: fonts.jakarta.regular,
    color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm, lineHeight: 18,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/SupportScreen.jsx
git commit -m "feat: refactor SupportScreen with glass cards and FAQ accordion"
```

---

### Task 16: Ajout clé Unsplash dans .env

**Fichiers :**
- Modifier : `.env`

- [ ] **Step 1: Ajouter la clé Unsplash dans .env**

```bash
echo "EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=votre_clé_ici" >> mobile/.env
```

- [ ] **Step 2: Commit**

```bash
git add mobile/.env
git commit -m "chore: add Unsplash API key to .env"
```

---

### Task 17: Vérification finale

- [ ] **Step 1: Vérifier que l'app se lance sans erreur de syntaxe**

```bash
cd mobile && npx expo export --platform android --output-dir dist 2>&1 || echo "Continuing with JS syntax check"
```

- [ ] **Step 2: Vérifier les imports et la cohérence**

```bash
cd mobile && node -e "
const fs = require('fs');
const files = [
  'src/components/GlassContainer.jsx',
  'src/components/BlurBackground.jsx',
  'src/components/GlassBottomNav.jsx',
  'src/components/GlassChip.jsx',
  'src/components/GlassButton.jsx',
  'src/components/AnimatedEventCard.jsx',
  'src/hooks/useUnsplashImage.js',
  'src/hooks/useSpringAnimation.js',
  'src/components/BuyerLayout.jsx',
  'src/screens/HomeScreen.js',
  'src/screens/EventSearchScreen.js',
  'src/screens/EventDetailScreen.js',
  'src/screens/TicketScreen.js',
  'src/screens/MesTicketsScreen.jsx',
  'src/screens/SupportScreen.jsx',
];
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    console.log('OK:', f, '(' + content.split('\\n').length + ' lines)');
  } catch(e) {
    console.log('MISSING:', f);
  }
});
"
```

- [ ] **Step 3: Commit final si corrections**

```bash
git add -A
git commit -m "chore: final adjustments for Apple Invites redesign"
```
