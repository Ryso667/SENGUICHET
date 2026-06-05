# Spécification : Module Contrôleur Mobile (Scan de billets)

**Date :** 2026-05-26
**Projet :** SENGUICHET
**Contexte :** Implémentation de la partie Contrôleur dans l'application mobile Expo (Personne 3)

---

## 1. Architecture globale

### 1.1 Approche retenue

**Même application mobile, 3 rôles distincts.** Une seule app Expo (dossier `mobile/`) avec navigation conditionnelle basée sur le rôle stocké dans AuthContext.

Justification :
- Design de base le stipule : "Une seule application mobile contenant la navigation client et le mode scanner déverrouillable"
- Rôle contrôleur déjà implémenté dans AuthContext
- Code partagé (thème, composants, utilitaires)
- Offline syncing plus simple dans une seule app
- Maintenance et déploiement unifiés

### 1.2 Les 3 rôles

| Rôle | Méthode d'auth | Page d'accueil |
|------|---------------|----------------|
| Acheteur | OTP via numéro de téléphone | Liste des événements / achat |
| Contrôleur | Code d'accès à 4 chiffres (scan_code) | Scanner caméra + historique |
| Organisateur | Email + mot de passe (JWT) | Dashboard gestion événements |

---

## 2. Écran d'accueil (AccueilChoixScreen)

Premier écran affiché quand aucun rôle n'est stocké. Permet de choisir son rôle.

```
┌──────────────────────────────┐
│        SENGUICHET             │  ← Logo Indigo
│                               │
│  ┌──────────────────────────┐ │
│  │ 📱 Acheter un billet     │ │  → EntrerNumeroScreen
│  └──────────────────────────┘ │
│                               │
│  ┌──────────────────────────┐ │
│  │ 📷 Scanner des billets   │ │  → ConnexionControleurScreen
│  └──────────────────────────┘ │
│                               │
│  ┌──────────────────────────┐ │
│  │ 💼 Espace organisateur   │ │  → ConnexionOrganisateurScreen
│  └──────────────────────────┘ │
│                               │
└──────────────────────────────┘
```

- 3 cartes stylisées avec icônes et dégradé Indigo → Rose
- Pas de texte secondaire (minimal)
- Footer : "Paiement Wave & Orange Money"

---

## 3. Navigation par rôle

### 3.1 Piles de navigation

```
AppNavigator
│
├── [Toujours accessible]  AccueilChoixScreen
│
├── [Aucun rôle stocké]
│   ├── EntrerNumeroScreen → EntrerOTPScreen
│   ├── ConnexionControleurScreen
│   └── ConnexionOrganisateurScreen  ← NOUVEAU
│
├── [role = acheteur]
│   ├── HomeScreen (événements)
│   ├── EventSearchScreen
│   ├── EventDetailScreen
│   └── TicketScreen
│
├── [role = controleur]
│   ├── ScannerScreen            ← NOUVEAU (caméra)
│   └── ScanHistoryScreen        ← NOUVEAU (historique + download)
│
└── [role = organisateur]        ← NOUVEAU
    ├── OrganisateurDashboardScreen
    ├── CreerEvenementScreen
    └── VoirTicketsScreen
```

### 3.2 Changement de rôle

Bouton "Changer de mode" / "Déconnexion" → `deconnecter()` → efface AsyncStorage → retour à AccueilChoixScreen.

---

## 4. Composants techniques (Contrôleur)

### 4.1 QR Code — Structure du payload

Chaque billet génère un QR code unique avec la structure suivante (conforme Document Technique v1.0) :

| Champ | Type | Description |
|-------|------|-------------|
| `uuid` | UUID v4 | Identifiant unique du billet |
| `transaction_ref` | string | Référence de transaction |
| `hmac` | string (hex) | HMAC-SHA256 (clé secrète serveur) |
| `timestamp` | ISO 8601 | Date de génération |
| `event_id` | int | ID de l'événement |
| `category` | string | Catégorie : VIP, STANDARD, PELOUSE, CARRE_OR |

Le HMAC-SHA256 est la clé de voûte anti-fraude. Un billet falsifié aura un hash invalide, détectable même hors ligne.

### 4.2 Scan — Bibliothèque

- `expo-camera` avec `CameraView`
- `onBarcodeScanned` pour la détection
- Format QR code
- ScannerScreen = vue caméra plein écran avec masque de scan (carré lumineux central)

### 4.3 Base locale — SQLite

Utilisation de `expo-sqlite` pour stocker :

**Table `tickets_locaux`** (tickets téléchargés pour l'événement) :
| Champ | Type | Description |
|-------|------|-------------|
| `uuid` | TEXT PK | UUID du billet |
| `hmac` | TEXT | Signature cryptographique |
| `event_id` | INTEGER | ID événement |
| `category` | TEXT | Zone d'affectation |
| `statut` | TEXT | DISPONIBLE / UTILISE_LOCAL / EXPIRE |
| `timestamp_gen` | TEXT | Date de génération |
| `zone_controleur` | TEXT | Zone assignée au contrôleur |

**Table `scans_locaux`** (scans effectués hors ligne) :
| Champ | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK AUTO | |
| `uuid_billet` | TEXT | UUID scanné |
| `timestamp_scan` | TEXT | Horodatage du scan |
| `statut` | TEXT | EN_ATTENTE / SYNCHRONISE |
| `resultat` | TEXT | VALIDE / DEJA_UTILISE / EXPIRE / INCONNU / FRAUDE |

### 4.4 Processus de vérification offline (5 étapes)

Conforme Document Technique v1.0 :

1. **Lecture** du QR code via la caméra
2. **Recherche** du billet dans SQLite locale (par UUID)
3. **Vérification** de la signature HMAC-SHA256 (recalcul local vs payload)
4. **Vérification** du statut actuel : DISPONIBLE / UTILISE_LOCAL / EXPIRE
5. **Mise à jour** locale → UTILISE_LOCAL (empêche tout nouveau scan sur le même appareil)

### 4.5 Codes résultats

| Résultat | Couleur | Signification |
|----------|---------|---------------|
| VALIDE | 🟢 Vert | Billet trouvé, signature OK, DISPONIBLE → entrée autorisée |
| DEJA_UTILISE | 🟠 Orange | Billet déjà scanné sur cet appareil → accès refusé |
| EXPIRE | 🔴 Rouge | Billet hors date de validité → accès refusé |
| INCONNU | 🔴 Rouge foncé | Billet non trouvé dans la base locale → accès refusé |
| FRAUDE | 🔴 Rouge vif | Signature HMAC invalide → alerte immédiate |

### 4.6 Synchronisation au retour de connexion

Conforme Document Technique v1.0 :

1. L'application détecte le retour du réseau
2. Collecte tous les scans offline avec statut `EN_ATTENTE`
3. Envoie au serveur (batch signé JSON)
4. Le serveur valide chaque scan, détecte conflits et doublons
5. Le serveur met à jour PostgreSQL
6. Le serveur renvoie les statuts définitifs
7. L'application met à jour SQLite locale

### 4.7 Gestion des conflits inter-appareils

Deux contrôleurs scannent le même billet offline :

- Le serveur enregistre les deux scans avec leur horodatage
- **Premier scan** (timestamp le plus ancien) → `SYNCHRONISE - VALIDE`
- **Second scan** → `CONFLIT - FRAUDE_SUSPECTEE`
- Notification administrateur automatique
- Rapport dans table `SynchronisationOffline`

### 4.8 Segmentation par zone d'affectation

- Le contrôleur est affecté à une zone (VIP, STANDARD, PELOUSE, CARRE_OR)
- Lors du téléchargement des tickets, seuls les tickets de sa zone sont reçus
- Base allégée, scan rapide, zéro doublon inter-zone
- Sécurité renforcée par zone

---

## 5. Nouveaux écrans

### 5.1 AccueilChoixScreen.jsx

- 3 cartes de rôle avec icônes et couleurs différentes
- Pas d'authentification requise
- Logo SENGUICHET en haut

### 5.2 ConnexionOrganisateurScreen.jsx

- Email + mot de passe
- Validation avec le backend
- Stocke JWT dans AuthContext
- Lien "Mot de passe oublié ?"

### 5.3 ScannerScreen.jsx

- Caméra plein écran (CameraView avec barcode scanning)
- Masque de scan avec carré central lumineux + faisceau laser animé (vert menthe)
- Résultat affiché en superposition : vert/orange/rouge
- Bouton pour basculer vers l'historique

### 5.4 ScanHistoryScreen.jsx

- Liste des scans effectués (filtrée par date/résultat)
- Statistiques : total scannés, valides, invalides
- Bouton "Télécharger les tickets" → appelle API → stocke dans SQLite
- Statut de synchronisation : en attente / synchronisé

### 5.5 OrganisateurDashboardScreen.jsx

- Liste des événements créés
- Stats : tickets vendus, recettes
- Bouton pour créer un événement

---

## 6. API Endpoints nécessaires (backend)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/controleur/connexion` | Valide un code 4 chiffres → retourne event_id + zone + JWT |
| POST | `/api/auth/organisateur/connexion` | Email + mot de passe → JWT |
| GET | `/api/controleur/tickets?event_id=X&zone=Y` | Liste des UUIDs + HMACs pour l'événement/zone |
| POST | `/api/controleur/verifier` | Vérifie en ligne un UUID + HMAC |
| POST | `/api/controleur/sync` | Synchronisation batch des scans offline |
| GET | `/api/controleur/historique?event_id=X` | Historique des scans de l'événement |

---

## 7. Fichiers à créer

```
mobile/src/screens/
├── AccueilChoixScreen.jsx           ← NOUVEAU
├── auth/
│   └── ConnexionOrganisateurScreen.jsx  ← NOUVEAU
├── controleur/
│   ├── ScannerScreen.jsx            ← NOUVEAU
│   └── ScanHistoryScreen.jsx        ← NOUVEAU
└── organisateur/
    ├── OrganisateurDashboardScreen.jsx  ← NOUVEAU
    ├── CreerEvenementScreen.jsx     ← NOUVEAU
    └── VoirTicketsScreen.jsx        ← NOUVEAU

mobile/src/services/
├── authService.js                   ← AJOUTER endpoints organisateur
├── scanService.js                   ← NOUVEAU (scan offline + sync)
└── ticketService.js                 ← NOUVEAU (download + sync)

mobile/src/database/
└── database.js                      ← NOUVEAU (SQLite init + queries)
```

## 8. Dépendances à installer

```bash
npx expo install expo-camera expo-sqlite expo-crypto
```

---

## 9. Ordre d'implémentation recommandé

1. Écran AccueilChoixScreen + refonte AppNavigator
2. ConnexionOrganisateurScreen + rôle organisateur
3. Base SQLite + service de scan offline
4. ScannerScreen (caméra + vérification offline)
5. ScanHistoryScreen + téléchargement des tickets
6. Synchronisation réseau + gestion des conflits
7. Écrans organisateur (dashboard, créer événement, voir tickets)
