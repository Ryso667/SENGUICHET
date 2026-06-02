# Refonte Interface Acheteur — Style Apple Invites

**Date :** 2026-06-02
**Statut :** Approuvé
**Contexte :** Refonte complète de l'interface mobile acheteur de Senguichet dans un style inspiré d'Apple Invites : fonds d'écran immersifs, glassmorphism généralisé, cartes animées.

---

## 1. Architecture & Dépendances

### Nouvelles dépendances
- `expo-blur` — pour le backdrop blur natif (verre dépoli iOS/Android)

### Exclu
- `react-native-reanimated` — l'app crash avec, on utilise `Animated` natif de React Native

### Nouveaux composants (dans `src/components/`)
| Composant | Rôle |
|-----------|------|
| `BlurBackground.jsx` | Image Unsplash + LinearGradient overlay + expo-blur optionnel |
| `GlassContainer.jsx` | Wrapper réutilisable : fond semi-transparent + blur + bordure + border radius |
| `AnimatedEventCard.jsx` | Carte événement avec springIn, stagger, scale on press |
| `GlassBottomNav.jsx` | Bottom nav avec fond flou + animations de transition |
| `GlassChip.jsx` | Petit filtre/badge glass pour les catégories |
| `GlassButton.jsx` | Bouton glass large avec animations |

### Nouveaux hooks (dans `src/hooks/`)
| Hook | Rôle |
|------|------|
| `useUnsplashImage.js` | Fetch une image aléatoire Unsplash par catégorie d'événement |

### Fichiers modifiés
- `src/constants/theme.js` — enrichi avec valeurs glass étendues, animation presets
- `src/components/BottomNav.js` → remplacé par `GlassBottomNav.jsx`
- `src/components/BuyerLayout.jsx` — adapté pour le nouveau fond
- `src/components/EventCard.js` → remplacé par `AnimatedEventCard.jsx`
- `src/screens/HomeScreen.js` — refonte complète
- `src/screens/EventSearchScreen.js` — refonte complète
- `src/screens/EventDetailScreen.js` — refonte complète
- `src/screens/TicketScreen.js` — adapté
- `src/screens/MesTicketsScreen.jsx` — adapté
- `src/screens/SupportScreen.jsx` — adapté
- `src/navigation/AppNavigator.js` — si besoin d'ajuster les transitions
- `.env` — ajout clé Unsplash

---

## 2. Système d'Animations (Animated natif)

### Presets d'animations
| Nom | Technique | Usage |
|-----|-----------|-------|
| `springIn` | `Animated.spring()` friction:6 tension:80 | Apparition des cartes (scale 0.9→1 + opacity 0→1) |
| `slideUp` | `Animated.timing()` 300ms | Entrée des sections (translateY 30→0 + opacity 0→1) |
| `pulse` | `Animated.loop()` scale 1↔1.02 durée 2s | QR code breathing |
| `stagger` | Délai progressif de 80ms entre items | Grille et listes |
| `scalePress` | `Animated.spring()` scale 1→0.96→1 | Feedback tactile sur les cartes |

Toutes les animations utilisent `useNativeDriver: true` pour les performances.

---

## 3. Design des Écrans

### 3.1 HomeScreen

```
┌──────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Image Unsplash plein écran
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │   (change selon la catégorie en vue)
│  ┌────────────────────────┐ │
│  │  Bonjour 👋            │ │ ← GlassContainer avec blur
│  │  Muhammed               │ │
│  │  3 tickets actifs      │ │
│  └────────────────────────┘ │
│                              │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐      │
│  │Év│ │Év│ │Év│ │Év│ │Év│  │ ← AnimatedEventCards horizontales
│  │1 │ │2 │ │3 │ │4 │ │5 │  │   springIn stagger
│  └─┘ └─┘ └─┘ └─┘ └─┘      │
│                              │
│  ┌────────────────────────┐ │
│  │ 🎫 Mes tickets          │ │ ← GlassContainer
│  │ Ticket 1 ......... VALIDE│ │
│  │ Ticket 2 ....... UTILISÉ│ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ 🔍 Explorer les events  │ │ ← GlassButton
│  └────────────────────────┘ │
│                              │
│  [  Accueil  ] [Tickets] [Aide] │ ← GlassBottomNav floutée
└──────────────────────────────┘
```

- **BlurBackground** : Image Unsplash + LinearGradient overlay (noir→transparent du bas vers le milieu) + expo-blur optionnel sur les bords
- **Header "Bonjour"** : GlassContainer avec blur, positionné en haut, fond semi-transparent
- **Cartes horizontales** : AnimatedEventCards avec springIn à l'apparition (délai progressif), scalePress au touché
- **Section "Mes tickets"** : GlassContainer, liste verticale des 3 premiers tickets avec pastilles statut
- **CTA "Explorer"** : GlassButton large avec icône loupe
- **ScrollView** : contentInsetAdjustmentBehavior: 'never' pour fond fixe
- **Footer** : texte "Paiement Wave & Orange Money · Sans compte requis" en petit discret

### 3.2 EventSearchScreen

- **Fond** : 3-4 images Unsplash en background faible visibilité + overlay glass
- **Barre de recherche** : GlassContainer avec blur, icône loupe Feather, placeholder "Concert à Dakar..."
- **Filtres rapides** : rangée de GlassChips horizontales (Tous, Concert, Festival, Sport, Théâtre...)
- **Grille résultats** : 2 colonnes, chaque carte :
  - Image Unsplash de la catégorie en background
  - Overlay dégradé sur l'image
  - Titre, date, lieu, prix en texte blanc
  - springIn stagger (80ms délai, apparition par paire)
- **État vide** : EmptyState glass centré

### 3.3 EventDetailScreen

- **Fond** : Image Unsplash pleine page (catégorie de l'événement)
- **Overlay** : LinearGradient vertical fort (noir 80% en haut → transparent 0% à 40% de la hauteur, puis transparent → noir 60% en bas)
- **Contenu** (ScrollView) :
  - **Titre** : Outfit Bold 32px, blanc, letter-spacing -0.5
  - **Date/Lieu** : Jakarta Regular 14px, blanc 80%
  - **Description** : GlassContainer avec blur, texte blanc 90%
  - **Catégories de tickets** : rangée horizontale de GlassContainers, chaque carte : nom catégorie + prix + sélecteur de quantité
  - **Bouton "Acheter maintenant"** : GlassButton full-width, accent cyan, scalePress
- **Header navigation** : bouton retour flottant glass (cercle avec flèche et blur)

### 3.4 TicketScreen

- **Fond** : Image Unsplash de l'événement (légèrement floutée via expo-blur)
- **Carte ticket centrale** : GlassContainer avec blur
  - QR code SVG (grand, centré)
  - Animation pulse (scale 1↔1.02 lent, boucle 2s)
  - Nom événement (Outfit Bold 18px)
  - Catégorie + date + heure (Jakarta Regular 13px)
  - Compte à rebours glass si expiration < 24h
- **Actions** : rangée de GlassChips (Partager, PDF)
- **Bouton retour** : flottant glass en haut à gauche

### 3.5 MesTicketsScreen

- **Fond** : Dégradé linéaire doux (blanc cassé → gris très clair) — pas d'image
- **Header** : GlassContainer "Mes Tickets" avec compteur
- **Liste tickets** : FlatList avec stagger animation
  - Chaque item : GlassContainer horizontal
    - À gauche : image miniature floutée de l'événement (carré 60x60)
    - Au centre : nom événement, catégorie, date
    - À droite : badge statut coloré (VALIDE/UTILISÉ/EXPIRÉ/REMBOURSÉ)
  - Pull-to-refresh avec indicateur natif
- **État vide** : EmptyState glass avec message et CTA "Explorer les événements"

### 3.6 SupportScreen

- **Fond** : Image Unsplash abstraite (style "contact" ou "support")
- **Overlay** : LinearGradient semi-transparent
- **Contenu** (ScrollView) :
  - **Header** : GlassContainer "Support" avec sous-titre "Comment pouvons-nous t'aider ?"
  - **Contacts** : GlassContainer vertical
    - Email : icône + adresse (GlassChip pressable → copie)
    - Téléphone : icône + numéro (GlassChip pressable → appel)
    - WhatsApp : icône + bouton (GlassChip → ouvre WhatsApp)
  - **FAQ** : Accordéon glass
    - Chaque question : GlassContainer pressable
    - Réponse : slideDown animé à l'ouverture

---

## 4. Navigation & Layout

### GlassBottomNav
- Barre fixe en bas avec expo-blur
- Bordure supérieure : 1px rgba(255,255,255,0.3)
- 3 tabs : Accueil (home), Mes Tickets (tag), Support (message-circle)
- Onglet actif : icône blanche, légère surélévation (fond glass plus opaque)
- Onglet inactif : icône rgba(255,255,255,0.5)
- Animation slide au changement de tab (Animated.timing 200ms)
- Hauteur : ~80px (44px tabs + 36px safe area)

### BuyerLayout modifié
- Plus de fond blanc uni — le fond est géré par chaque écran via BlurBackground
- BuyerLayout wrapper minimal : juste le GlassBottomNav et le contenu
- Le SafeAreaView est géré dans chaque écran individuellement

### Transitions d'écran
- Pas de custom transition stack (trop complexe sans reanimated)
- On garde les transitions par défaut de React Navigation native stack

---

## 5. API Unsplash

### Service `useUnsplashImage(category)`
- Clé API stockée dans `.env` (variable `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY`)
- Requête : `GET https://api.unsplash.com/photos/random?query={category}&orientation=portrait`
- Mapping catégories SENGUICHET → requêtes Unsplash :

| Catégorie | Query Unsplash |
|-----------|---------------|
| Concert | `concert crowd music` |
| Festival | `festival celebration` |
| Théâtre | `theater stage` |
| Sport | `sport stadium` |
| Conférence | `conference speaker` |
| Art | `art exhibition gallery` |
| (défaut) | `event party` |

- Cache : les images sont stockées en mémoire via un Map (pas de AsyncStorage, les URLs changent à chaque pull-to-refresh de toute façon)
- Fallback : si pas d'image (hors-ligne), gradient linéaire de la couleur de catégorie

### Configuration `.env`
```
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=votre_clé_publique
```

---

## 6. Thème enrichi (theme.js)

```js
// Nouveautés à ajouter dans theme.js

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

---

## 7. Arborescence finale (partie acheteur)

```
src/
  components/
    BlurBackground.jsx    (NOUVEAU)
    GlassContainer.jsx    (NOUVEAU)
    GlassBottomNav.jsx    (NOUVEAU — remplace BottomNav.js)
    GlassChip.jsx         (NOUVEAU)
    GlassButton.jsx       (NOUVEAU)
    AnimatedEventCard.jsx (NOUVEAU — remplace EventCard.js)
    BuyerLayout.jsx       (MODIFIÉ)
    ...
  constants/
    theme.js              (MODIFIÉ — verre + animations)
  hooks/
    useUnsplashImage.js   (NOUVEAU)
    useSpringAnimation.js (NOUVEAU)
  screens/
    HomeScreen.js         (REFAIT)
    EventSearchScreen.js  (REFAIT)
    EventDetailScreen.js  (REFAIT)
    TicketScreen.js       (ADAPTÉ)
    MesTicketsScreen.jsx  (ADAPTÉ)
    SupportScreen.jsx     (ADAPTÉ)
    ...
  navigation/
    AppNavigator.js       (inchangé ou ajustements mineurs)
```

---

## 8. Ordre d'implémentation

Les tâches doivent être implémentées dans cet ordre pour garantir que chaque étape repose sur des fondations solides :

1. Installation expo-blur + mise à jour theme.js
2. Composants de base : GlassContainer, BlurBackground, useUnsplashImage
3. Composants d'interaction : GlassChip, GlassButton, useSpringAnimation
4. AnimatedEventCard + GlassBottomNav
5. BuyerLayout modifié
6. HomeScreen (refonte complète)
7. EventSearchScreen (refonte complète)
8. EventDetailScreen (refonte complète)
9. MesTicketsScreen (adaptation glass)
10. TicketScreen (adaptation glass)
11. SupportScreen (adaptation glass)
12. Tests & ajustements finaux
