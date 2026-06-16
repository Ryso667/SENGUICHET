# Navigation par rôle (Drawer) + Notifications Push temps réel

## Résumé

Refonte de la navigation mobile : les rôles organisateur et contrôleur obtiennent
un Drawer (hamburger) avec leurs sections dédiées, sans les tabs acheteur.
Ajout de notifications push via Expo pour prévenir l'organisateur des nouvelles
ventes de billets en temps réel.

---

## Navigation — Drawer par rôle

### Non connecté / Acheteur (inchangé)

```
NavigationContainer → Stack → MainTabs (4 tabs)
                               ├─ Accueil (Home)
                               ├─ Explorer (EventSearch)
                               ├─ Mes billets (MesTickets)
                               └─ Compte (Profil)
                              + écrans auth (SocialAuth, Connexion*)
                              + écrans achat (EventDetail, Ticket, WebViewWave)
                              + Support
```

### Organisateur connecté

Le `NavigationContainer` racine bascule sur un `OrganizerDrawer`
qui remplace les tabs. Chaque section du drawer contient un
`NativeStackNavigator` pour sa navigation interne.

```
OrganizerDrawer
├─ 📊 Dashboard           → OrganisateurDashboardScreen
│   (stack: Dashboard → DetailEvenement → VoirTickets)
├─ 📅 Événements          → GestionEvenementsScreen
│   (stack: Liste → DetailEvenement → VoirTickets)
├─ 📈 Statistiques        → StatistiquesScreen
├─ 📋 Demandes            → MesDemandesScreen
├─ 🔔 Notifications       → NotificationsScreen (refonte)
│   (avec badge compteur non-lues)
├─ 🎧 Support             → SupportScreen
└─ 🚪 Déconnexion         → Appel à deconnecter() + reset vers guest
```

### Contrôleur connecté

```
ControllerDrawer
├─ 📷 Scanner             → ScannerScreen
├─ 🕐 Historique          → ScanHistoryScreen
└─ 🚪 Déconnexion         → Appel à deconnecter() + reset vers guest
```

### Détail technique

- `@react-navigation/drawer` : installé, wrappé dans drawerContent custom
  (avatar, nom, email, liste items stylisée, bouton déconnexion)
- `react-native-reanimated` : installé (dépendance du drawer)
- `react-native-gesture-handler` : déjà présent
- Chaque item du drawer est un `NativeStackNavigator`. Le drawer gesture
  n'est actif que sur la racine de chaque stack (ex: GestionEvenements).
  Les écrans enfants (DetailEvenement, VoirTickets) sont dans la stack
  interne — pas de swipe drawer, juste le back natif
- Le badge sur 🔔 Notifications est fourni par `NotificationContext`
  qui expose un compteur non-lues. Le drawerContent le lit via contexte
- Au login organisateur/contôleur, `AppNavigator` détecte le rôle
  et affiche le drawer correspondant (reset de la stack)
- À la déconnexion, reset vers `MainTabs` (guest)

---

## Notifications Push — Architecture

### Mobile (Expo)

1. **Génération token** : `expo-notifications` au lancement (ou au login
   organisateur) → `getExpoPushTokenAsync()` → stocké dans SecureStore
2. **Enregistrement backend** : `POST /api/notifications/register-token`
   avec `{ token: "ExponentPushToken[xxx]", organisateur_id }`
3. **Réception** : `expo-notifications` reçoit la push → mise à jour
   du compteur de notifications → badge sur le drawer
4. **NotificationsScreen** : refonte du placeholder actuel → liste
   des notifications avec titre, date, type, icône, statut lue/non-lue
   - Pull-to-refresh
   - Tap → marquer comme lue + naviguer vers l'événement concerné

### Backend (Vercel)

1. **Table `push_tokens`** :
   ```sql
   CREATE TABLE push_tokens (
     id INT AUTO_INCREMENT PRIMARY KEY,
     organisateur_id INT NOT NULL,
     token VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (organisateur_id) REFERENCES organisateurs(id)
   );
   ```

2. **Table `notifications`** :
   ```sql
   CREATE TABLE notifications (
     id INT AUTO_INCREMENT PRIMARY KEY,
     organisateur_id INT NOT NULL,
     evenement_id INT,
     type VARCHAR(50) NOT NULL DEFAULT 'vente',
     message TEXT NOT NULL,
     lue BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (organisateur_id) REFERENCES organisateurs(id),
     FOREIGN KEY (evenement_id) REFERENCES evenements(id)
   );
   ```

3. **API endpoints** :
   - `POST /api/notifications/register-token` — enregistrer token push
   - `POST /api/notifications/unregister-token` — supprimer token (déconnexion)
   - `GET /api/notifications` — lister notifications (avec pagination)
   - `PUT /api/notifications/:id/lire` — marquer comme lue
   - `PUT /api/notifications/lire-tout` — tout marquer
   - `GET /api/notifications/non-lues` — compteur (pour badge)

4. **Flux achat → notification push** :
   `POST /api/billets/acheter` (succès)
   → `NotificationService.envoyerNotification(organisateur_id, {
        type: 'vente',
        message: `Nouvelle vente : ${categorie} x${quantite} pour ${evenement_titre}`,
        evenement_id
      })`
   → Insère dans `notifications`
   → Récupère `push_tokens` de l'organisateur
   → Envoie via Expo Push API (`expo-server-sdk` ou fetch direct)

---

## Dépendances

### Mobile à installer
- `@react-navigation/drawer`
- `expo-notifications`
- `react-native-reanimated`

### Backend à installer
- `expo-server-sdk` (npm)

## Remarques

- Les notifications push nécessitent un build EXPO Go ne supporte pas
  les push notifications → build development ou production requis
- Le drawer utilisera le thème existant (couleurs, glass, fonts)
- La déconnexion nettoie tout (tokens, session) et reset vers l'état invité
