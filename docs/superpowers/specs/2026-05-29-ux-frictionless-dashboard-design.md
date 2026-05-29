# UX sans friction : Navigation, Feedback, Formulaires & Dashboard organisateur

**Date** : 2026-05-29
**Statut** : Spec validée
**Contexte** : Amélioration du confort utilisateur sur l'application mobile SENGUICHET. Les détails backend seront traités par l'équipe API.

---

## 1. Navigation & Transitions

### 1.1 Animations d'entrée
- **Écrans de liste** (Home, Search, Tickets, Gestion) : fade + scale entrée sur les cartes avec stagger (120ms)
- **Écrans de détail** (EventDetail, Ticket) : slide depuis la droite
- **Tab bar rebond** : icône scale 1→1.2→1 au press (avec `Animated.spring`)

### 1.2 Swipe & gestes
- **Swipe-back** : activer `gestureEnabled: true` sur Android (déjà natif iOS)
- **Swipe to reveal** : actions contextuales (supprimer ticket, archiver événement)
- **Pull-to-refresh** : sur Dashboard organisateur, GestionEvenements, MesTickets, ScanHistory

### 1.3 Bottom sheet
- Remplacer les modals de sélection de catégorie par une bottom sheet (via `@gorhom/bottom-sheet`)
- Plus naturel sur mobile, moins de friction que `Alert.alert()` ou un écran intermédiaire

---

## 2. Feedback & États vides

### 2.1 Système de toasts
- Composant `<Toast>` global avec contexte React
- 3 variantes : **succès** (vert, `#10B981`), **erreur** (rouge, `#EF4444`), **info** (indigo, `#6366F1`)
- Auto-disparition 3s + swipe to dismiss
- Remplacer tous les `Alert.alert()` dans les parcours critiques (achat, scan, création événement)

### 2.2 Skeleton screens
- Composant `<Skeleton>` avec animation shimmer (gradient mobile)
- Utilisé sur : Dashboard stats, liste événements, liste tickets
- Pas de `ActivityIndicator` nu — toujours habillé dans un contexte visuel (carte grisée qui pulse)

### 2.3 États vides illustrés
- Composer des illustrations vectorielles inline (SVG) pour : pas d'événements, pas de tickets, pas de scans
- Texte d'accompagnement + CTA (ex: "Crée ton premier événement" + bouton "Créer")

### 2.4 Feedback haptique
- `expo-haptics` sur : scan validé/refusé, achat confirmé, pull-to-refresh

### 2.5 Optimistic UI
- Actions sans attente : achat ticket, modification événement → affichage immédiat, rollback silencieux si échec

---

## 3. Formulaires & Saisie

### 3.1 Validation en temps réel
- Validation synchrone sur chaque champ au `onChangeText`
- Bordure du champ passe en vert (`#10B981`) ou rouge (`#EF4444`) immédiatement
- Message d'erreur sous le champ, pas en alert

### 3.2 DatePicker & TimePicker
- DatePicker actuel (`DateTimePicker` modal natif) remplacé par une vue mois défilable
- TimePicker actuel remplacé par roues numériques (heures/minutes) inline
- Moins d'étapes pour sélectionner une date

### 3.3 Clavier adaptatif
- `KeyboardAwareScrollView` sur tous les formulaires (Connexion, CréerÉvénement)
- Les champs remontent automatiquement au-dessus du clavier
- Scroll vers le champ actif automatique

### 3.4 Masques de saisie
- Téléphone : format `+221 XX XXX XX XX` avec `react-native-mask-input`
- Prix : format `1 500` FCFA (séparateur milliers)
- OTP : 6 cases individuelles avec auto-submit au dernier chiffre

### 3.5 Auto-submit OTP
- Dès le 6e chiffre saisi, lancer la vérification sans bouton
- Timer de 5 min conservé

---

## 4. Dashboard Organisateur (focus)

### 4.1 Skeleton shimmer
- Cartes stats (événements / billets / recettes) en skeleton pendant le chargement
- Liste événements en skeleton cards (3 lignes grisées)

### 4.2 Compteurs animés
- Les valeurs numériques des stats cards défilent de 0 → valeur cible (`Animated.timing`)
- Durée : 800ms, easing `easeOutCubic`

### 4.3 Graphiques
- **Cercles de progression** pour taux de remplissage des événements (SVG arc)
- **Mini line chart** pour l'évolution des ventes (si données historiques disponibles)
- Utiliser `react-native-svg` (déjà disponible indirectement via `react-native-qrcode-svg`)

### 4.4 Quick actions
- Barre horizontale de 3 boutons rapides sous le hero :
  - ➕ Créer un événement
  - 🎫 Voir tous les tickets
  - 📊 Gérer les événements
- Évite de scroller pour accéder aux actions fréquentes

### 4.5 Statut visuel des événements
- Badge coloré à droite de chaque carte événement :
  - **Vert** : date à venir
  - **Orange** : dans moins de 7 jours
  - **Rouge** : date passée
  - Gris : événement complet

### 4.6 Proposition biométrie
- Au retour sur l'app, si l'utilisateur avait une session organisateur active :
  - Afficher un bouton "Connexion rapide avec empreinte"
  - Déclenche `expo-local-authentication`
  - Contourne la saisie email/mot de passe

---

## Dépendances à ajouter

```json
{
  "@gorhom/bottom-sheet": "^4.x",
  "expo-haptics": "~13.x",
  "expo-local-authentication": "~14.x",
  "react-native-mask-input": "^1.x",
  "react-native-svg": "^15.x",
  "react-native-gesture-handler": "^2.x"
}
```

## Écrans impactés

| Écran | Améliorations |
|-------|---------------|
| **Dashboard organisateur** | Skeleton, compteurs animés, quick actions, badges statut, mini graphiques |
| **Tous les écrans** | Toasts (via contexte global), swipe-back Android |
| **AccueilChoix / Auth** | Proposition biométrie, auto-submit OTP |
| **CreerEvenement** | DatePicker inline, TimePicker roues, validation temps réel, clavier adaptatif |
| **EventDetail** | Bottom sheet catégories, validation téléphone masquée |
| **MesTickets / ScanHistory** | Pull-to-refresh, empty states illustrés |
| **GestionEvenements** | Pull-to-refresh, swipe to delete, badges statut |

## Non compris (backend collègues)

- API endpoints
- Schéma de base de données
- Authentification réelle (mocks conservés)
