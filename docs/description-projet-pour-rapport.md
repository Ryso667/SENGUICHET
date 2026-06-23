# Projet SENGUICHET — Description complète pour rédaction de rapport de stage

> Fichier destiné à un agent IA pour la rédaction du rapport de stage.
> Le PDF `Rapport de stage.pdf` dans `docs/` sert UNIQUEMENT d'exemple de structure et de format.
> Ce fichier décrit UNIQUEMENT le projet SENGUICHET (rien du rapport PDF exemple).

---

## 1. INFORMATIONS GÉNÉRALES

### 1.1. Stagiaire
- **Nom :** Sory Ibrahim Soumaré
- **Établissement :** École Supérieure Polytechnique (ESP) — Université Cheikh Anta Diop de Dakar (UCAD)
- **Département :** Génie Informatique
- **Diplôme préparé :** Diplôme Universitaire de Technologie (DUT) en Informatique — Option Informatique
- **Promotion :** 2023-2024
- **Année universitaire :** 2024-2025

### 1.2. Encadrement
- **Encadrant pédagogique :** _(à renseigner)_
- **Maître de stage :** _(à renseigner)_

### 1.3. Lieu et période
- **Structure d'accueil :** _(à renseigner)_
- **Période :** _(à renseigner)_

### 1.4. Projet
- **Nom du projet :** SENGUICHET (contraction de "Sénégal" et "Guichet" — guichet numérique)
- **Type :** Plateforme de billetterie événementielle multi-rôles
- **Stack :** React Native/Expo (mobile), Node.js/Express (API), TiDB MySQL (base), Vercel (déploiement)

---

## 2. CONTEXTE DU PROJET
Le projet SENGUICHET est né d'un besoin de **digitaliser la gestion événementielle** (création d'événements, vente de billets, contrôle d'accès) pour les organisations.

Les solutions existantes (billetteries classiques) sont souvent :
- Payantes ou avec commissions élevées
- Non adaptées au contexte sénégalais (besoin de modes de paiement et de fonctionnalités hors-ligne)
- Monolithiques (un seul type d'utilisateur)

SENGUICHET propose une **plateforme complète et gratuite** avec trois profils distincts.

---

## 3. PROBLÉMATIQUE ET OBJECTIFS

### 3.1. Problématique
1. Comment permettre aux organisateurs d'événements de créer et gérer facilement des événements et leurs billets ?
2. Comment offrir aux acheteurs une expérience simple d'achat et de présentation de billets ?
3. Comment assurer un contrôle fiable des billets, y compris dans des zones sans connexion Internet ?
4. Comment gérer l'authentification et les autorisations pour 3 profils radicalement différents (acheteur/contrôleur/organisateur) ?
5. Comment notifier automatiquement les utilisateurs (confirmation, rappels, codes OTP) ?

### 3.2. Objectifs spécifiques
- Développer un système d'authentification multi-rôles (acheteur OTP email, contrôleur code 4 chiffres, organisateur email + mot de passe bcrypt)
- Créer une application mobile React Native/Expo avec 3 piles de navigation distinctes
- Implementer le scan de QR codes hors-ligne avec validation cryptographique (HMAC-SHA256)
- Synchroniser les données hors-ligne (SQLite locale → API) par lots
- Développer un tableau de bord web pour les organisateurs
- Mettre en place des notifications automatiques (email SMTP, SMS Orange API)
- Déployer l'API sur Vercel (serverless) avec base TiDB Cloud

### 3.3. Livrables attendus
- Application mobile fonctionnelle (Android/iOS)
- API REST déployée
- Interface web dashboard organisateur
- Base de données opérationnelle
- Code source commenté en français
- Documentation technique

---

## 4. MÉTHODOLOGIE

### 4.1. Démarche
La méthodologie adoptée suit un processus itératif :

1. **Analyse des besoins** — Entretiens avec les parties prenantes, identification des acteurs et fonctionnalités
2. **Conception** — Architecture système, modèle de données, schémas d'architecture, maquettes d'écrans
3. **Développement** — Itératif en 3 phases (auth → fonctionnalités principales → finalisation)
4. **Tests** — Tests fonctionnels sur mobile (Expo Go), tests API, tests de la synchro hors-ligne
5. **Déploiement** — Mise en production API (Vercel) et base (TiDB Cloud)

### 4.2. Planification
La planification du stage a été organisée comme suit :

**Phase 1 :** Analyse des besoins, spécifications, architecture
**Phase 2 :** Développement backend (API, auth, base de données)
**Phase 3 :** Développement mobile (navigation, écrans, scan QR)
**Phase 4 :** Déploiement, tests, documentation

---

## 5. ANALYSE DES BESOINS ET SPÉCIFICATIONS

### 5.1. Acteurs du système
Trois rôles distincts ont été identifiés :

1. **Acheteur** — Personne qui achète des billets pour des événements
   - S'inscrit par OTP email (code test : 123456)
   - Consulte et achète des billets
   - Présente son billet (QR code) à l'entrée
   

2. **Contrôleur** — Personne qui contrôle les billets à l'entrée des événements
   - Scanne les QR codes des billets
   - Travaille hors-ligne (pas de connexion Internet nécessaire)
   - Voit le statut du billet (VALIDE, DEJA_UTILISE, EXPIRE, INCONNU, FRAUDE)
   - Les données sont synchronisées à la reconnexion

3. **Organisateur** — Personne qui crée et gère des événements
   - Se connecte par email + mot de passe
   - Crée/modifie/supprime des événements
   - Gère les billets vendus
   - Consulte les statistiques
   - Accède au dashboard web complet

### 5.2. Relations entre acteurs
Chaque acteur est indépendant et dispose de sa propre pile de navigation dans l'application.

### 5.3. Fonctionnalités par rôle

**Acheteur :**
- Inscription par OTP email
- Consultation des événements disponibles
- Achat de billets
- Affichage du QR code du billet
- Historique des achats
- Modification du profil
- Dark mode toggle

**Contrôleur :**
- Scan de QR codes via caméra
- Validation hors-ligne (HMAC-SHA256 + SQLite)
- Affichage du statut avec code couleur
- Téléchargement des tickets en amont (offline)
- Synchronisation batch automatique
- Changement de code d'accès

**Organisateur :**
- Dashboard avec statistiques
- Création d'événements (titre, dates, lieu, capacité, prix, affiche)
- Visualisation des billets vendus
- Gestion des demandes
- Paramètres du compte

*(Les diagrammes de cas d'utilisation détaillés sont dans le PDF de référence)*

---

## 6. CONCEPTION ET ARCHITECTURE

### 6.1. Architecture globale du système

```
┌─────────────────────────────────────────────────┐
│                 Application Mobile               │
│              (React Native / Expo)               │
│                                                   │
│   ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│   │ Acheteur  │  │ Contrôleur │  │Organisateur│  │
│   │   Pile    │  │   Pile     │  │   Pile     │  │
│   └────┬─────┘  └─────┬──────┘  └─────┬──────┘  │
│        │              │               │          │
│   ┌────▼──────────────▼───────────────▼──────┐   │
│   │           AuthContext (JWT)              │   │
│   └────────────────┬────────────────────────┘   │
│                    │                            │
│   ┌───────────────┐│┌────────────────────────┐ │
│   │  SQLite (off) │││   SecureStore (tokens) │ │
│   └───────────────┘│└────────────────────────┘ │
└────────────────────┼────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────┐
│              API REST (Node.js)                  │
│              Déployée sur Vercel                 │
│                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ Auth     │  │ Billets  │  │ Événements   │  │
│   │ routes   │  │ routes   │  │ routes       │  │
│   └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│   ┌────▼──────────────▼───────────────▼──────┐   │
│   │         Services / Middlewares           │   │
│   └────────────────┬────────────────────────┘   │
│                    │                            │
│   ┌───────────────┐│┌────────────────────────┐ │
│   │ Email (SMTP)  │││   SMS (Orange API)    │ │
│   └───────────────┘│└────────────────────────┘ │
└────────────────────┼────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           TiDB Cloud (MySQL)                     │
│                                                   │
│   organisateur  │  acheteur  │  controleuspectr  │
│   evenement     │  billet    │  code_otp         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│         Frontend Web (Dashboard Orga)            │
│         9 pages — thème vert clair               │
│         #15803D accent / #FAFAFA fond            │
└──────────────────────────────────────────────────┘
```

### 6.2. Modèle de données (MySQL/TiDB)

**Table `organisateur`**
- id (INT PK AUTO_INCREMENT)
- nom (VARCHAR)
- email (VARCHAR UNIQUE)
- mot_de_passe (VARCHAR — hash bcrypt)
- telephone (VARCHAR)
- statut (VARCHAR)
- created_at (TIMESTAMP)

**Table `acheteur`**
- id (INT PK AUTO_INCREMENT)
- email_acheteur (VARCHAR UNIQUE)
- nom_acheteur (VARCHAR)
- telephone_acheteur (VARCHAR)
- created_at (TIMESTAMP)

**Table `controleur`**
- id (INT PK AUTO_INCREMENT)
- email (VARCHAR)
- code_acces (VARCHAR)
- nom (VARCHAR)
- organisateur_id (INT FK → organisateur.id)
- created_at (TIMESTAMP)

**Table `evenement`**
- id (INT PK AUTO_INCREMENT)
- titre (VARCHAR)
- description (TEXT)
- affiche_url (VARCHAR — stocke l'URL de l'image)
- date_debut (DATETIME)
- date_fin (DATETIME)
- lieu (VARCHAR)
- capacite_totale (INT)
- prix (DECIMAL)
- statut (VARCHAR — actif/annulé/terminé)
- organisateur_id (INT FK → organisateur.id)
- created_at (TIMESTAMP)

**Table `billet`**
- id (INT PK AUTO_INCREMENT)
- uuid (VARCHAR UNIQUE — identifiant public)
- numero (VARCHAR(20) NOT NULL — numéro de billet)
- statut (VARCHAR — valide/utilisé/expiré)
- evenement_id (INT FK → evenement.id)
- acheteur_id (INT FK → acheteur.id)
- date_achat (TIMESTAMP)
- qr_hash (VARCHAR — HMAC-SHA256 hash)

**Table `code_otp`**
- id (INT PK AUTO_INCREMENT)
- email (VARCHAR)
- code (VARCHAR)
- expire_at (DATETIME)
- utilise (BOOLEAN)

### 6.3. Composants de l'application mobile

**Navigation :**
- 3 piles de navigation conditionnelles selon le rôle
- Bottom tabs pour les onglets principaux
- Bouton "Quitter" pour changer de rôle / se déconnecter

**AuthContext :**
- Stocke le rôle, les tokens JWT
- Persistance via AsyncStorage
- Suggestions d'email (auto-complétion)
- Déconnexion = effacement des données sensibles

**ThemeContext :**
- 3 modes : système, sombre, clair
- Cycle : system → dark → light (via ProfilScreen)
- Persistance dans AsyncStorage
- Pattern : `useTheme()` + `makeStyles(colors)`

**Scan contrôleur (hors-ligne) :**
1. Téléchargement des tickets en amont quand la connexion est disponible
2. Stockage dans SQLite locale
3. Scan via CameraView (expo-camera)
4. Validation HMAC-SHA256 pour détecter les fraudes
5. 5 statuts : VALIDE (vert), DEJA_UTILISE (orange), EXPIRE (rouge), INCONNU (gris), FRAUDE (rouge foncé)
6. Synchronisation des scans (sync batch) à la reconnexion

### 6.4. API REST (endpoints principaux)

**Auth :**
- POST /api/auth/inscription-acheteur — inscription acheteur avec OTP
- POST /api/auth/verifier-otp — validation du code OTP
- POST /api/auth/login-organisateur — connexion organisateur
- POST /api/auth/login-controleur — connexion contrôleur

**Événements :**
- GET /api/evenements — liste des événements
- POST /api/evenements — créer un événement (orga)
- GET /api/evenements/:id — détail d'un événement
- PUT /api/evenements/:id — modifier (orga)

**Billets :**
- POST /api/billets/acheter — acheter un billet
- GET /api/billets/mes-billets — billets de l'acheteur
- POST /api/billets/valider — valider un billet (contrôleur)
- GET /api/billets/:uuid — page publique du billet (HTML responsive)

**Notifications :**
- Email : confirmation billet, code OTP, notification partenariat
- SMS : via Orange API (sandbox)

---

## 7. TECHNOLOGIES ET OUTILS

### 7.1. Backend
| Technologie | Version | Rôle |
|---|---|---|
| Node.js | 18+ | Moteur d'exécution |
| Express | 4.x | Framework API REST |
| MySQL2 | — | Driver base de données |
| JWT (jsonwebtoken) | — | Tokens d'authentification |
| bcrypt | — | Hash des mots de passe (work factor 10) |
| Nodemailer | — | Envoi d'emails SMTP (Gmail) |
| @vercel/node | — | Déploiement serverless |

### 7.2. Frontend Mobile
| Technologie | Rôle |
|---|---|
| React Native | Framework mobile |
| Expo | Toolchain de développement |
| expo-camera | Scan de QR codes |
| expo-sqlite | Base de données locale hors-ligne |
| expo-crypto | HMAC-SHA256 pour validation |
| expo-secure-store | Stockage sécurisé des JWT |
| AsyncStorage | Persistance des préférences et rôles |

### 7.3. Frontend Web
| Technologie | Rôle |
|---|---|
| React | Bibliothèque UI |
| CSS personnalisé | Thème vert clair (#15803D) |
| Vercel | Hébergement |

### 7.4. Infrastructure
| Service | Rôle |
|---|---|
| Vercel | Hébergement API + frontend web |
| TiDB Cloud Serverless | Base de données MySQL |
| Gmail SMTP | Envoi d'emails |
| Orange API | SMS (mode sandbox) |

---

## 8. RÉALISATION ET RÉSULTATS

### 8.1. Authentification multi-rôles
**Acheteur — OTP email :**
- L'utilisateur entre son email
- Un code OTP à 6 chiffres est généré et stocké dans `code_otp`
- Le code est envoyé par email (Gmail SMTP)
- En développement, le code test est `123456`
- À validation, un compte acheteur est créé et un JWT est émis

**Contrôleur — Code 4 chiffres :**
- L'organisateur crée des comptes contrôleurs avec un code d'accès
- Le contrôleur entre son email + code à 4 chiffres
- En mode mock, tous les codes sont acceptés
- Pas de JWT (session simple)

**Organisateur — Email + mot de passe :**
- Inscription avec email, mot de passe (bcrypt work factor 10)
- Connexion avec email + mot de passe
- Messages d'erreur génériques ("Identifiant ou mot de passe incorrect")
- JWT émis et stocké dans SecureStore

### 8.2. Application mobile
**Écrans développés :**
- AccueilChoixScreen — 3 cartes (Acheter / Scanner / Organisateur)
- Écrans acheteur (9) : BilletsAcheteur, ScanBilletAcheteur, Profil...
- Écrans contrôleur (3) : Scan, Validation, Sync
- Écrans organisateur (10) : Dashboard, Événements, Billets...
- Navigation : 3 piles conditionnelles + bottom tabs

**Dark mode :**
- Implémenté via ThemeContext
- Pattern : `useTheme()` + `makeStyles(colors)`
- 3 modes : système / sombre / clair
- Migré sur tous les écrans (37+ fichiers)

### 8.3. Scan contrôleur hors-ligne
Le scan fonctionne en 3 étapes :
1. **Téléchargement amont (online) :** les tickets de l'événement sont téléchargés et stockés dans SQLite
2. **Scan et validation (offline) :** le QR code est scanné, son HMAC est vérifié contre la base locale, le statut est affiché
3. **Synchronisation (online) :** les scans effectués hors-ligne sont envoyés à l'API par lots

**Algorithmes de validation :**
- HMAC-SHA256 pour signer les QR codes (empêche la falsification)
- Vérification de l'unicité (détection des doublons)
- Vérification de la date d'expiration

### 8.4. Dashboard organisateur (frontend web)
- 9 pages redesignées en thème vert clair (#15803D)
- Palette : #15803D accent, #FAFAFA fond, #FFFFFF cartes
- Pages : Sidebar, DashboardLayout, DashboardHome, MesEvenements, DetailEvenement, Statistiques, MesDemandes, GestionBillets, Parametres, Confidentialite
- Design responsive

### 8.5. Notifications
- **Email SMTP (Gmail) :** confirmation d'achat de billet, code OTP, notification de partenariat
- **SMS Orange API :** en mode sandbox (en attente d'activation)
- **Page publique du billet :** `GET /api/billets/:uuid` affiche un HTML responsive avec les infos du billet

### 8.6. Déploiement
- API déployée sur Vercel : https://backend-beta-six-39.vercel.app
- Base TiDB Cloud Serverless (SSL requis)
- Variables d'environnement configurées sur Vercel

---

## 9. SÉCURITÉ (OWASP)

### 9.1. Stockage des mots de passe
- bcrypt work factor ≥ 10
- Limite 72 bytes / 72 caractères max
- Ne JAMAIS stocker en clair
- Sel géré automatiquement par bcrypt

### 9.2. Authentification
- Messages d'erreur génériques ("Identifiant ou mot de passe incorrect")
- Min 8 caractères (si MFA), 15 sinon
- Max au moins 64 caractères
- Ne PAS limiter les caractères autorisés
- Transmission uniquement sur TLS

### 9.3. Mobile (MASVS)
- Tokens JWT dans SecureStore (expo-secure-store)
- Effacement des données sensibles à la déconnexion
- Pas de logs contenant mots de passe ou tokens
- Validation HMAC-SHA256 pour les QR codes

---

## 10. DIFFICULTÉS RENCONTRÉES ET SOLUTIONS

| Difficulté | Solution |
|---|---|
| Stockage sécurisé des tokens JWT sur mobile | Passage d'AsyncStorage à expo-secure-store |
| Scan QR hors-ligne avec validation fiable | HMAC-SHA256 + SQLite locale + sync batch |
| 3 piles de navigation conditionnelles | Context-based navigation avec AuthContext |
| OTP en environnement serverless (Vercel) | Stockage OTP en base MySQL (plus de fichier JSON) |
| SSL/TLS avec TiDB Cloud | Configuration SSL avec rejectUnauthorized: false en dev |
| Déploiement Vercel (fichier unique lambda) | Utilisation de @vercel/node |

---

## 11. ÉTAT D'AVANCEMENT (JUIN 2026)

### Implémenté
- ✅ Authentification 3 rôles (acheteur OTP, contrôleur code, organisateur bcrypt)
- ✅ AuthContext avec AsyncStorage, rôles persistants
- ✅ AccueilChoixScreen
- ✅ Scan contrôleur hors-ligne (CameraView, SQLite, HMAC-SHA256, 5 statuts)
- ✅ Téléchargement tickets offline + sync batch
- ✅ Dashboard organisateur, Créer événement, Voir tickets
- ✅ Navigation conditionnelle (3 piles), bottom tabs
- ✅ Notifications email SMTP + SMS Orange API (sandbox)
- ✅ Page publique GET /api/billets/:uuid
- ✅ Dark mode complet (mobile/)
- ✅ Dashboard web (9 pages, thème vert clair)
- ✅ API déployée sur Vercel + TiDB Cloud

### À venir
- 🔜 Paiement en ligne (Wave, Orange Money)
- 🔜 Mode production Orange SMS
- 🔜 Tests utilisateurs
- 🔜 Documentation utilisateur finale

---

## 12. STRUCTURE SUGGÉRÉE POUR LE RAPPORT DE STAGE

*(Sur le modèle du PDF `Rapport de stage.pdf`)*

**Page de garde :** Université, école, titre, stagiaire, encadrants, lieu, période, promotion

**Dédicace et remerciements**

**Avant-propos :** Présentation du contexte du stage (formation DUT, objectifs du stage)

**Résumé / Abstract :** Résumé en français et anglais du projet SENGUICHET

**Listes :** Figures, tableaux, acronymes (API, JWT, OTP, QR, HMAC, SQL, CRUD, OWASP, MASVS...)

**Introduction :** Contexte général, problématique, objectifs du stage

**Chapitre 1 — Présentation du lieu de stage et du sujet :**
- 1.1 Présentation de la structure d'accueil (missions, organisation)
- 1.2 Présentation du projet SENGUICHET (contexte, problématique, objectifs)
- 1.3 Démarche méthodologique (étapes, diagramme de Gantt)

**Chapitre 2 — Analyse des besoins et spécifications :**
- 2.1 Introduction
- 2.2 Acteurs du système (acheteur, contrôleur, organisateur)
- 2.3 Fonctionnalités par rôle (cas d'utilisation avec schémas)
- 2.4 Diagrammes de séquence et fiches textuelles des cas d'utilisation principaux

**Chapitre 3 — Conception et réalisation :**
- 3.1 Introduction
- 3.2 Architecture du système (schéma global)
- 3.3 Modèle de données (schéma entité-relation)
- 3.4 Technologies utilisées (Node.js, React Native/Expo, TiDB, Vercel...)
- 3.5 Présentation de l'application mobile (écrans, navigation, dark mode)
- 3.6 Présentation du dashboard web (pages, thème)
- 3.7 Scan hors-ligne et sécurité
- 3.8 Déploiement

**Conclusion :** Bilan du stage (compétences acquises, difficultés, perspectives)

**Webographie :** Références (OWASP, Expo, Vercel, TiDB, React Native...)

**Annexes :** Captures d'écran de l'application, extraits de code

---

## 13. RÉFÉRENCES ET WEBOGRAPHIE

1. Documentation OWASP — Password Storage Cheat Sheet, Authentication Cheat Sheet, Mobile ASVS
2. Documentation Expo — https://docs.expo.dev/ (Camera, SQLite, SecureStore, Crypto)
3. Documentation Vercel — https://vercel.com/docs (déploiement Node.js serverless)
4. Documentation TiDB Cloud — https://tidbcloud.com/docs (base de données Serverless MySQL)
5. Documentation React Native — https://reactnative.dev/docs/
6. Documentation MySQL — https://dev.mysql.com/doc/
7. Documentation Node.js Express — https://expressjs.com/
8. Documentation bcrypt — https://www.npmjs.com/package/bcrypt
9. Documentation Nodemailer — https://nodemailer.com/

---

## 14. ACRONYMES ET SIGLES

| Sigle | Signification |
|---|---|
| API | Application Programming Interface |

| CRUD | Create, Read, Update, Delete |
| DUT | Diplôme Universitaire de Technologie |
| ESP | École Supérieure Polytechnique |
| HMAC | Hash-based Message Authentication Code |
| JWT | JSON Web Token |
| MASVS | Mobile Application Security Verification Standard |
| MySQL | My Structured Query Language |
| OTP | One-Time Password |
| OWASP | Open Web Application Security Project |
| QR | Quick Response |
| REST | Representational State Transfer |
| SMTP | Simple Mail Transfer Protocol |
| SQL | Structured Query Language |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| TiDB | Distributed SQL database |
| UCAD | Université Cheikh Anta Diop de Dakar |

---

> Généré le 23 juin 2026 — Fichier destiné à un agent IA.
> Le PDF `Rapport de stage.pdf` sert de référence pour le FORMAT et la STRUCTURE uniquement.
> Tout le contenu ci-dessus décrit exclusivement le projet SENGUICHET.
