# Améliorations Design & Fonctionnalités — Spec globale

> **Statut**: Brouillon — en attente de revue
> **Contexte**: Audit design complet de l'app mobile SENGUICHET — 29 screens, 20 composants, 3 rôles (acheteur/organisateur/contrôleur)

---

## Phase 1 : États vides et Recherche (priorité haute, effort faible)

### 1.1 EmptyState sur tous les écrans

**Problème**: MesTicketsScreen, MesFavorisScreen, GestionEvenementsScreen, NotificationsScreen n'ont pas d'état vide — l'utilisateur voit un écran blanc.

**Solution**: Ajouter `<EmptyState>` (composant déjà existant dans `src/components/EmptyState.jsx`) avec:
- Icône pertinente (ticket, heart, calendar, bell)
- Message principal: "Aucun billet", "Aucun favori", "Aucun événement", "Aucune notification"
- Sous-titre: guidance ("Achète ton premier billet", "Explore les événements", etc.)
- CTA: bouton "Explorer" → HomeScreen, ou "Créer" → CreerEvenementScreen
- Animation fade-in (existe déjà dans EmptyState)

**Fichiers à modifier**:
- `mobile/src/screens/MesTicketsScreen.jsx` — remplacer le `FlatList` vide par EmptyState
- `mobile/src/screens/MesFavorisScreen.jsx` — idem
- `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx` — idem
- `mobile/src/screens/NotificationsScreen.js` — idem

### 1.2 Suggestions dans la recherche

**Problème**: EventSearchScreen montre un champ vide + catégories quand l'utilisateur n'a pas tapé. Pas de contenu perso.

**Solution**:
- Quand le champ est vide: afficher "Recherches récentes" (stockées dans AsyncStorage, max 5) + "Catégories populaires" (pills cliquables)
- Quand le champ a du texte: comportement actuel (résultats filtrés)
- "Recherches récentes": ligne horizontale de chips avec icône clock + texte, swipe-to-delete

**Fichier**: `mobile/src/screens/EventSearchScreen.js`

---

## Phase 2 : Feedback émotionnel (priorité haute, effort moyen)

### 2.1 Célébration à l'achat

**Problème**: Après paiement réussi → RecuAchatScreen avec les billets. Pas de moment "peak" émotionnel.

**Solution**: Ajouter un `CelebrationOverlay` dans `src/components/` (pas un écran entier) entre le succès du paiement et le RecuAchatScreen:
- Overlay semi-transparent avec "Paiement réussi !" en Outfit extraBold
- Animation d'échelle du texte: 0.5 → 1.05 → 1, spring (friction 4, tension 100)
- Émojis animés: 10-15 émojis (🎫 🎉 ✨ 🎊 🎯) qui tombent depuis le haut avec des positions X aléatoires et des durées de chute variées (1-2s, `Animated.timing`)
- Puis fondu vers RecuAchatScreen après 2s
- Haptic success (`hapticSuccess()`)
- Utilisé dans `EventDetailScreen.js` après `confirmerPaiement()`

**Fichiers**: `mobile/src/components/CelebrationOverlay.jsx` (nouveau), `mobile/src/screens/EventDetailScreen.js`

### 2.2 Animation d'entrée TicketScreen

**Problème**: Le ticket apparaît directement, pas d'animation d'entrée.

**Solution**: Ajouter `Animated.spring` sur l'ensemble du ticket:
- État initial: scale 0.8, opacity 0, translateY 30
- État final: scale 1, opacity 1, translateY 0
- Friction 6, tension 80 (pattern existant)
- Stagger léger: l'en-tête vert arrive en premier (delay 0), le corps crème (delay 100ms), le talon beige (delay 200ms)

**Fichier**: `mobile/src/screens/TicketScreen.js`

### 2.3 Haptic sur les actions importantes

**Problème**: Certaines actions critiques n'ont pas de retour haptique.

**Ajouter haptic**:
- `hapticMedium()` sur "Payer" (EventDetailScreen)
- `hapticSuccess()` sur achat réussi
- `hapticLight()` sur navigation dans EventSearch (résultats)
- `hapticSelection()` sur sélection de catégorie dans EventDetailScreen

---

## Phase 3 : Fonctionnalités (priorité moyenne, effort moyen-élevé)

### 3.1 Calendrier synchronisé acheteur

**Problème**: CalendarScreen montre les événements publics mais pas les billets achetés.

**Solution**:
- CalendarScreen existant: ajouter un filtre "Mes billets" / "Tous"
- Afficher les billets achetés (depuis SQLite local) avec un point de couleur différente (vert VS gris)
- Tap sur un jour avec billet → navigue vers TicketScreen ou RecuAchatScreen
- API: `GET /api/billets/mes-billets` (existe déjà via `billetService.mesBillets()`)

**Fichier**: `mobile/src/screens/CalendarScreen.jsx`

### 3.2 Codes promo

**Problème**: Pas de système de réduction ou code promo.

**Solution**:
- **Backend**: Nouvelle table `code_promo` (id, organisateur_id, code VARCHAR(20), type ENUM('pourcentage','fixe'), valeur DECIMAL, evenement_id NULLABLE, date_expiration, utilisations_max, utilisations_actuelles)
- **Backend API**: `POST /api/codes/valider` (vérifie validité + calcule réduction), `GET /api/organisateur/codes` (liste pour l'orga), `POST /api/organisateur/codes` (création)
- **Mobile EventDetailScreen**: Champ "Code promo" dans le bottom sheet de paiement, avant le téléphone
- **Mobile organisateur**: Section "Codes promo" dans DetailEvenementScreen, formulaire de création, liste des codes avec statut
- Calcul du montant: `prix_total = sum(cat.prix * quantite) - reduction`

**Fichiers**: Nouveaux fichiers backend + modifications EventDetailScreen, DetailEvenementScreen

### 3.3 Notifications push acheteur

**Problème**: Seul l'organisateur reçoit des notifications push.

**Solution**:
- Backend: ajouter `push_token` à la table `acheteur` (via expo push token)
- Backend: envoyer notification push pour "Rappel J-1", "Offre spéciale catégorie", "Événement annulé"
- Mobile: demander permission push lors du premier achat, enregistrer le token via API
- `GET /api/acheteur/notifications/preferences` + `PUT /api/acheteur/notifications/preferences` (opt-in/out)

### 3.4 Export CSV avancé

**Problème**: CSV disponible seulement dans DetailEvenement (un seul événement).

**Solution**:
- OrganisateurDashboardScreen: bouton "Exporter tout" → CSV global de tous les événements
- GestionEvenementsScreen: bouton "Exporter" dans le header → CSV filtré par statut
- Backend: `GET /api/organisateur/evenements/export?statut=actif` → CSV stream
- Partager via expo-sharing (déjà utilisé dans ticketPdfService)

---

## Phase 4 : Formulaires et sélection (priorité basse, effort faible)

### 4.1 Icônes dans les modales de sélection

**Problème**: Les FlatLists de catégories/villes/billets dans CreerEvenementScreen et MesDemandesScreen sont en texte brut.

**Solution**: Ajouter un émoji/icône devant chaque option:
- Catégories événement: 🎵 Concert, 🎭 Théâtre, ⚽ Sport, 🎪 Festival, 📚 Conférence, 🔧 Atelier
- Villes: 📍 Dakar, 📍 Thiès, etc.
- Types de billet: 🎟️ Standard, 🎟️ VIP, 🎟️ Premium

### 4.2 Thème cohérent pour les modales

**Problème**: Les modales utilisent `blurType` hardcodé sur les GlassContainer (certaines en "dark", d'autres en "light").

**Solution**: Centraliser le `blurType` via une fonction `getBlurType(isDark)` qui retourne "dark" si isDark, "light" sinon.

---

## Phase 5 : Accessibilité et polish (priorité basse, effort faible)

### 5.1 Tailles tactiles 44×44pt

**Audit rapide**: Vérifier que tous les TouchableOpacity ont `minHeight: 44` et `minWidth: 44`. Les endroits les plus susceptibles:
- Cartes événement dans EventSearchScreen (déjà larges)
- Chips de catégorie (HomeScreen, EventSearchScreen) — peuvent être petits
- Boutons -/+ de quantité dans EventDetailScreen
- Items de FlatList dans les modales CreerEvenement/MesDemandes

### 5.2 Contrastes

- Mode clair: les textes secondaires avec `opacity: 0.6` peuvent être difficiles à lire
- Mode sombre: les cartes vertes avec texte blanc — vérifier le ratio de contraste
- Les `colors.textSecondary` et `colors.textTertiary` devraient être testés avec les outils WCAG

### 5.3 Hiérarchie Dashboard

**Problème**: La carte de statistiques dans le Dashboard organisateur a le label aussi gros que le chiffre.

**Solution**:
- Chiffre: Outfit extraBold, 28-32px
- Label: Outfit regular ou Jakarta regular, 12-13px, opacity 0.7
- Icône: 20px, accent color, fond circulaire 5% opacity

---

## Dépendances inter-phases

- Les phases 1, 2, 4, 5 sont **strictement mobile** — indépendantes du backend
- La phase 3 nécessite du backend (nouveaux endpoints) + mobile
- Ordre recommandé: Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 3 (backend first pour Phase 3)
- Chaque phase peut être implémentée et livrée indépendamment

## Architecture technique

### Composants existants à réutiliser
- `EmptyState` — déjà dans `src/components/EmptyState.jsx` (icon, title, subtitle, actionLabel, onAction, fade-in anim)
- `GlassContainer` — pour les nouvelles sections (codes promo, résultats de recherche)
- `GlassButton` — pour les CTA des états vides
- `Skeleton` — pour les chargements
- `StatusBadge` — pour les statuts de code promo
- `haptics.js` — 6 types déjà exportés
- `Animated.spring` pattern — déjà utilisé partout (friction 6, tension 80)

### Nouveaux composants à créer
- `CelebrationOverlay` — animation de succès avec confettis
- `CodePromoInput` — champ avec validation en temps réel
- `RecentSearchChips` — ligne de chips avec icône clock + swipe-to-delete

### Backend (nouveaux endpoints)
- Codes promo: CRUD + validation
- Notifications push acheteur: register token + preferences
- Export CSV global

---

## Notes d'implémentation

- Toutes les animations utilisent le pattern existant: `Animated.spring` avec `friction: 6, tension: 80`
- Les couleurs utilisent les variables `colors.*` existantes — pas de hardcode
- Le système de thème (light/dark) doit être supporté par toutes les nouvelles UI
- Tous les nouveaux composants suivent le pattern: `const { colors } = useTheme()` + `const styles = useMemo(() => makeStyles(colors), [colors])`
