# Restructuration de SENGUICHET en Monorepo

**Date** : 2026-05-26
**Statut** : Approuvé

## 1. Objectif

Restructurer le projet SENGUICHET d'une application Expo monolithique en un monorepo avec npm workspaces contenant 4 packages indépendants :

- `mobile/` — App React Native (Expo) pour les acheteurs et le staff
- `backend/` — API Node.js/Express/MySQL
- `frontend-web/` — Panneau organisateur React.js
- `shared/` — Types, constantes et validation partagés

## 2. Structure Globale

```
senguichet/
  package.json                  ← npm workspaces root
  .gitignore
  AGENTS.md
  CLAUDE.md
  LICENSE
  shared/                       ← Types/constantes partagés
  mobile/                       ← Code Expo existant déplacé ici
  backend/                      ← Node.js/Express
  frontend-web/                 ← React.js (organizer panel)
  docs/                         ← Documentation existante
    superpowers/specs/          ← Specs de conception
```

## 3. Package `shared/`

```
shared/
  package.json                  ← name: @senguichet/shared
  src/
    index.js
    types/
      event.js
      ticket.js
      user.js
      payment.js
      sync.js
    constants/
      roles.js                  ← ACHETEUR, ORGANISATEUR, CONTROLEUR, ADMIN
      paymentMethods.js         ← WAVE, ORANGE_MONEY, FREE_MONEY, CARD
      ticketStatus.js           ← DISPONIBLE, UTILISE, EN_ATTENTE, CONFLIT
    validation/
      event.schema.js           ← Schémas Zod pour validation backend
      ticket.schema.js
```

Contenu : types, constantes, schémas de validation uniquement. Pas de logique métier.

## 4. Package `mobile/`

L'application Expo existante est déplacée dans ce dossier sans modification structurelle :

```
mobile/
  App.js
  index.js
  app.json
  package.json                  ← name: @senguichet/mobile
  assets/
  src/
    navigation/AppNavigator.js
    screens/HomeScreen.js
    screens/EventSearchScreen.js
    screens/EventDetailScreen.js
    screens/TicketScreen.js
    components/BottomNav.js
    components/EventCard.js
    constants/theme.js
    hooks/useTickets.js
```

Fonctionnalités :
- Acheteur : parcourir événements, acheter des billets (Wave/Orange Money), QR codes
- Staff (mode scanner) : déverrouillage par code 4 chiffres, scan QR offline-first

## 5. Package `backend/`

```
backend/
  package.json                  ← name: @senguichet/api
  src/
    server.js
    config/
      database.js               ← Connexion MySQL
    routes/
      auth.js                   ← POST /login (Access 15min + Refresh 7j)
      events.js                 ← CRUD événements
      tickets.js                ← POST /buy, GET /tickets
      validation.js             ← POST /validate (scan QR)
      payouts.js                ← Commissions, reversements
      sync.js                   ← Synchronisation offline
      admin.js                  ← Validation des événements
    middleware/
      auth.js                   ← JWT middleware
      rbac.js                   ← Rôles : admin, organisateur, controleur
      rateLimit.js              ← Anti-brute force, anti-DDoS
    models/                     ← 16 tables du modèle de données
      acheteur.js
      organisateur.js
      controleur.js
      administrateur.js
      demandeEvenement.js
      evenement.js
      categorieTicket.js
      affectationControleur.js
      billet.js
      scanBillet.js
      historiqueStatutBillet.js
      transaction.js
      commission.js
      remboursement.js
      synchronisationOffline.js
      codeOTP.js
      notification.js
    services/
      qr.service.js             ← Génération QR + HMAC-SHA256
      payment.service.js        ← Payment Abstraction Layer
      sync.service.js           ← Gestion conflits offline
    db/
      schema.sql                ← Script création 16 tables MySQL
  .env
```

### Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Login organisateur/admin |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/events | Créer événement (organisateur) |
| GET | /api/events | Lister événements |
| GET | /api/events/:id | Détail événement |
| POST | /api/events/:id/submit | Soumettre à validation |
| POST | /api/admin/events/:id/approve | Approuver événement |
| POST | /api/admin/events/:id/reject | Refuser événement |
| POST | /api/tickets/buy | Acheter un billet |
| GET | /api/tickets/:eventId | Tickets vendus (organisateur) |
| POST | /api/validation/scan | Valider QR code (staff) |
| POST | /api/sync/push | Push scans offline |
| GET | /api/sync/pull/:eventId | Pull tickets pour zone |
| GET | /api/payouts | Reversements organisateur |

### Base de données : 16 tables

- **Users** : `Acheteur`, `Organisateur`, `Controleur`, `Administrateur`
- **Événements** : `DemandeEvenement`, `Evenement`, `CategorieTicket`, `AffectationControleur`
- **Billetterie** : `Billet`, `ScanBillet`, `HistoriqueStatutBillet`
- **Paiements** : `Transaction`, `Commission`, `Remboursement`
- **Offline** : `SynchronisationOffline`
- **Annexes** : `CodeOTP`, `Notification`

### Sécurité

- QR code : HMAC-SHA256 signé (UUID v4 + timestamp + eventId + category)
- Offline-first : SQLite locale, sync avec gestion de conflits (horodatage)
- Rate limiting, validation entrées (Zod), audit logs
- Chiffrement mots de passe (bcrypt), RBAC strict

## 6. Package `frontend-web/`

```
frontend-web/
  package.json                  ← name: @senguichet/web
  public/
    index.html
    favicon.ico
  src/
    index.js
    App.js
    pages/
      Login.js
      Dashboard.js              ← Tickets vendus, somme, code scan
      Events.js                 ← Liste événements
      CreateEvent.js            ← Formulaire → DemandeEvenement
      EventDetail.js            ← Tickets vendus, stats
      ValidationRequest.js      ← Soumettre à validation admin
      Profile.js
    components/
      Layout.js                 ← Sidebar + header admin
      EventCard.js
      SalesChart.js
      TicketList.js
      ScanCodeDisplay.js        ← Code 4 chiffres
    services/
      api.js                    ← Axios → backend
      auth.js                   ← JWT storage
    styles/
      global.css
```

## 7. Workflow de Validation des Événements

1. Organisateur soumet `DemandeEvenement` via frontend-web
2. Administrateur SENGUICHET reçoit notification
3. Admin approuve ou refuse (avec commentaire)
4. Si approuvé → événement créé et visible publiquement

## 8. Modèle Économique

- **Option C** (recommandée) : Commission sur billet vendu (5%)
- Combinée avec **frais de validation symboliques** (Option A réduite)
- Payment Abstraction Layer : démarrage avec PayDunya ou CinetPay (Wave + Orange Money + cartes)

## 9. Ordre d'Implémentation

1. **Mise en place monorepo** — Créer workspace, déplacer mobile/
2. **Backend** — API + base de données + routes
3. **Frontend-web** — Panneau organisateur React.js
4. **Mobile** — Adapter l'app existante pour utiliser l'API backend
5. **Shared** — Types et validation partagés (au fur et à mesure)
