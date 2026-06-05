# Connexion Acheteur → Backend + Paiement — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connecter le flux acheteur mobile au backend : remplacer les données mockées par des appels API, ajouter un endpoint d'achat de billet, et implémenter une abstraction de paiement générique avec un provider Simulation.

**Architecture:** Le backend Express expose des endpoints publics pour les événements (sans auth), un endpoint d'achat qui crée un billet + transaction, et une abstraction `IPaymentProvider` (ProviderFactory + ProviderSimulation). Le mobile appelle ces endpoints via `apiService.js` et gère le fallback offline. Les tables MySQL `billet` et `transaction` existent déjà — le plan les utilise sans les recréer.

**Tech Stack:** Node.js/Express, MySQL (mysql2/promise), React Native (Expo), AsyncStorage, expo-crypto, JWT (admin/organisateur uniquement — pas de JWT acheteur)

---

### Task 1: Ajouter colonne `statut` à la table `billet`

**Files:**
- Modify: `backend/src/db/schema.sql` (ligne ~116, après `est_utilise`)
- Modify: `backend/src/db/migrate.js` (ajouter ALTER TABLE)

- [ ] **Step 1: Ajouter la colonne dans schema.sql**

Ajouter après `est_utilise TINYINT(1) NOT NULL DEFAULT 0,` :
```sql
  statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE',
```

- [ ] **Step 2: Ajouter ALTER TABLE dans migrate.js**

Ajouter après l'exécution du schema.sql :
```js
try {
  await connection.query(`
    ALTER TABLE billet
    ADD COLUMN IF NOT EXISTS statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE'
    AFTER est_utilise
  `);
} catch (e) {
  // Ignorer si colonne existe déjà
}
```

---

### Task 2: Payment Provider Abstraction

**Files:**
- Create: `backend/src/services/PaymentService.js`
- Create: `backend/src/services/providers/IPaymentProvider.js`
- Create: `backend/src/services/providers/ProviderSimulation.js`

- [ ] **Step 1: Créer IPaymentProvider.js**

```js
// Interface contract for payment providers
// Each provider implements initierPaiement, verifierPaiement, and rembourser

class IPaymentProvider {
  get nom() { throw new Error('Not implemented') }

  // Initie un paiement externe
  // @param {Object} params - { montant, devise, reference, callbackUrl, metadata }
  // @returns {Promise<{ redirectUrl: string|null, referenceOperateur: string }>}
  async initierPaiement(params) { throw new Error('Not implemented') }

  // Vérifie le statut d'un paiement initié
  // @param {string} referenceOperateur - reference retournée par initierPaiement
  // @returns {Promise<{ statut: string }>} - 'PENDING'|'SUCCESS'|'FAILED'
  async verifierPaiement(referenceOperateur) { throw new Error('Not implemented') }

  // Rembourse un paiement
  // @param {string} referenceOperateur
  // @param {number} montant
  // @returns {Promise<boolean>}
  async rembourser(referenceOperateur, montant) { throw new Error('Not implemented') }
}

module.exports = IPaymentProvider;
```

- [ ] **Step 2: Créer ProviderSimulation.js**

```js
// Provider Simulation : simule un paiement réussi sans appel externe
// Utilisé en phase de dev/test avant intégration des vrais providers

const IPaymentProvider = require('./IPaymentProvider');
const { v4: uuidv4 } = require('uuid');

class ProviderSimulation extends IPaymentProvider {
  get nom() { return 'SIMULATION' }

  async initierPaiement({ montant, devise, reference, callbackUrl, metadata }) {
    // Simule un délai de traitement de 2 secondes
    await new Promise(r => setTimeout(r, 2000));

    const referenceOperateur = 'SIM-' + uuidv4().slice(0, 8).toUpperCase();

    return {
      redirectUrl: null, // pas de redirection externe
      referenceOperateur,
    };
  }

  async verifierPaiement(referenceOperateur) {
    return { statut: 'SUCCESS' }; // toujours réussi en simulation
  }

  async rembourser(referenceOperateur, montant) {
    return true;
  }
}

module.exports = ProviderSimulation;
```

- [ ] **Step 3: Créer PaymentService.js**

```js
// Point d'entrée unique pour les paiements
// ProviderFactory instancie le bon provider selon le type

const ProviderSimulation = require('./providers/ProviderSimulation');

class PaymentService {
  static getProvider(type) {
    switch (type) {
      case 'SIMULATION':
        return new ProviderSimulation();
      // case 'ORANGE_MONEY': return new ProviderOrangeMoney();
      // case 'WAVE': return new ProviderWave();
      // case 'FREE_MONEY': return new ProviderFreeMoney();
      default:
        throw new Error(`Provider ${type} non supporté`);
    }
  }
}

module.exports = PaymentService;
```

- [ ] **Step 4: Installer uuid** (si pas déjà fait)

Run: `npm install uuid` dans backend/

---

### Task 3: Backend — Endpoints publics événements

**Files:**
- Modify: `backend/src/controllers/evenementController.js` (ajouter listerPublic, detailPublic)
- Modify: `backend/src/routes/evenement.js` (ajouter 2 routes publiques AVANT le middleware auth)

- [ ] **Step 1: Ajouter listerPublic et detailPublic dans evenementController.js**

```js
// Liste les événements publics avec statut='actif' et date_fin >= NOW
// Accessible sans authentification — uniquement les événements validés par l'admin
const listerPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.titre, e.description, e.lieu, e.ville, e.categorie,
        e.date_debut, e.date_fin, e.capacite_totale, e.affiche_url,
        (SELECT MIN(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_min,
        (SELECT MAX(ct.prix) FROM categorie_ticket ct WHERE ct.evenement_id = e.id) AS prix_max
      FROM evenement e
      WHERE e.statut = 'actif' AND (e.date_fin IS NULL OR e.date_fin >= NOW())
      ORDER BY e.date_debut ASC`
    );

    res.json(rows.map(r => ({
      id: r.id,
      titre: r.titre,
      description: r.description,
      lieu: r.lieu,
      ville: r.ville,
      categorie: r.categorie,
      date_debut: r.date_debut,
      date_fin: r.date_fin,
      capacite_totale: r.capacite_totale,
      affiche_url: r.affiche_url,
      prix_min: r.prix_min || 0,
      prix_max: r.prix_max || 0,
    })));
  } catch (err) {
    console.error("Lister public error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Détail public d'un événement avec ses catégories de billets
const detailPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, titre, description, lieu, ville, categorie, date_debut, date_fin, capacite_totale, affiche_url FROM evenement WHERE id = ? AND statut = 'actif'",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Événement introuvable" });

    const [tickets] = await pool.query(
      "SELECT id, nom, description, prix, capacite, places_disponibles FROM categorie_ticket WHERE evenement_id = ?",
      [id]
    );

    res.json({ evenement: rows[0], types_billets: tickets });
  } catch (err) {
    console.error("Detail public error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};
```

Ajouter à `module.exports` : `listerPublic, detailPublic`.

- [ ] **Step 2: Ajouter les routes publiques dans evenement.js**

Ajouter AVANT le `router.use(authMiddleware(...))` :
```js
// Routes publiques (sans authentification)
router.get('/public', evenementController.listerPublic);
router.get('/public/:id', evenementController.detailPublic);
```

---

### Task 4: Backend — Contrôleur billets (achat + liste)

**Files:**
- Create: `backend/src/controllers/billetController.js`
- Create: `backend/src/routes/billets.js`
- Modify: `backend/src/routes/index.js` (monter /billets)

- [ ] **Step 1: Créer billetController.js**

```js
// Contrôleur des billets : achat et consultation
// POST /api/billets/acheter — crée billet + transaction + initie paiement
// GET /api/billets/mes-billets — liste les billets d'un téléphone

const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const PaymentService = require("../services/PaymentService");

const HMAC_SECRET = process.env.HMAC_SECRET || 'senguichet-cle-secrete-hmac';

const acheter = async (req, res) => {
  try {
    const { evenementId, categorieTicketId, telephone, quantite = 1, provider = 'SIMULATION' } = req.body;

    if (!evenementId || !categorieTicketId || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier que l'événement existe et est actif
    const [events] = await pool.query(
      "SELECT id, titre FROM evenement WHERE id = ? AND statut = 'actif'",
      [evenementId]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable ou inactif" });

    // Vérifier la catégorie et les places disponibles
    const [categories] = await pool.query(
      "SELECT id, nom, prix, places_disponibles FROM categorie_ticket WHERE id = ? AND evenement_id = ?",
      [categorieTicketId, evenementId]
    );
    if (!categories.length) return res.status(404).json({ message: "Catégorie introuvable" });

    const cat = categories[0];
    if (cat.places_disponibles < quantite) {
      return res.status(400).json({ message: "Places insuffisantes" });
    }

    const montantTotal = cat.prix * quantite;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Créer le billet
      const uuid = uuidv4();
      const numero = `TKT-${Date.now().toString(36).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      // Générer la signature HMAC (identique au format utilisé par le scan offline)
      const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${cat.nom}`;
      const payload_signature = crypto.createHmac('sha256', HMAC_SECRET).update(signaturePayload).digest('hex');

      const [billetResult] = await conn.query(
        `INSERT INTO billet (uuid, evenement_id, categorie_ticket_id, telephone_acheteur, payload_signature, prix_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
        [uuid, evenementId, categorieTicketId, telephone, payload_signature, montantTotal]
      );

      const billetId = billetResult.insertId;

      // Créer la transaction
      const reference = 'PAI-' + uuidv4().slice(0, 12).toUpperCase();
      await conn.query(
        `INSERT INTO transaction (reference, billet_id, montant, frais, devise, statut, moyen_paiement, telephone_payeur)
         VALUES (?, ?, ?, 0, 'FCFA', 'PENDING', ?, ?)`,
        [reference, billetId, montantTotal, provider, telephone]
      );

      // Mettre à jour la transaction_id dans le billet
      const [txRows] = await conn.query("SELECT id FROM transaction WHERE reference = ?", [reference]);
      await conn.query("UPDATE billet SET transaction_id = ? WHERE id = ?", [txRows[0].id, billetId]);

      await conn.commit();

      // Initier le paiement via le provider (hors transaction)
      const paymentProvider = PaymentService.getProvider(provider);
      let paymentResult;
      try {
        paymentResult = await paymentProvider.initierPaiement({
          montant: montantTotal,
          devise: 'FCFA',
          reference,
          callbackUrl: `/api/paiements/notifier/${reference}`,
        });

        // Mettre à jour la référence opérateur
        if (paymentResult.referenceOperateur) {
          await pool.query(
            "UPDATE transaction SET reference_operateur = ? WHERE reference = ?",
            [paymentResult.referenceOperateur, reference]
          );
        }
      } catch (paymentError) {
        console.error("Payment initiation error:", paymentError);
        paymentResult = { redirectUrl: null, referenceOperateur: null };
      }

      // Contenu du QR code
      const qrPayload = JSON.stringify({
        uuid,
        hmac: payload_signature,
        event_id: evenementId,
        category: cat.nom,
        timestamp,
        transaction_ref: reference,
      });

      res.status(201).json({
        billet: {
          id: billetId,
          uuid,
          numero,
          prix: montantTotal,
          evenement: events[0].titre,
          categorie: cat.nom,
          dateAchat: timestamp,
          qrPayload,
        },
        paiement: {
          reference,
          redirectUrl: paymentResult.redirectUrl,
          referenceOperateur: paymentResult.referenceOperateur,
          provider,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Acheter billet error:", err);
    res.status(500).json({ message: "Erreur lors de l'achat" });
  }
};

const mesBillets = async (req, res) => {
  try {
    const { telephone } = req.query;
    if (!telephone) return res.status(400).json({ message: "Paramètre téléphone requis" });

    const [rows] = await pool.query(
      `SELECT b.id, b.uuid, b.prix_paye, b.statut, b.payload_signature, b.date_creation,
        e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
        ct.nom AS categorie_nom, ct.prix AS categorie_prix
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.telephone_acheteur = ?
      ORDER BY b.date_creation DESC`,
      [telephone]
    );

    res.json(rows);
  } catch (err) {
    console.error("Mes billets error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { acheter, mesBillets };
```

- [ ] **Step 2: Créer routes/billets.js**

```js
const express = require("express");
const router = express.Router();
const billetController = require("../controllers/billetController");

// Routes billets sans authentification (le téléphone sert d'identifiant)
router.post("/acheter", billetController.acheter);
router.get("/mes-billets", billetController.mesBillets);

module.exports = router;
```

- [ ] **Step 3: Modifier routes/index.js pour monter /billets**

```js
router.use("/billets", require("./billets"));
```

Ajouter après `router.use("/evenements", evenementRoutes);`

---

### Task 5: Backend — Statut paiement

**Files:**
- Create: `backend/src/controllers/paiementController.js`
- Create: `backend/src/routes/paiements.js`
- Modify: `backend/src/routes/index.js`

- [ ] **Step 1: Créer paiementController.js**

```js
// Contrôleur des paiements : vérification de statut et notification provider

const pool = require("../config/db");
const PaymentService = require("../services/PaymentService");

const statutPaiement = async (req, res) => {
  try {
    const { reference } = req.params;
    const [rows] = await pool.query(
      "SELECT statut, reference_operateur, moyen_paiement FROM transaction WHERE reference = ?",
      [reference]
    );
    if (!rows.length) return res.status(404).json({ message: "Transaction introuvable" });

    const tx = rows[0];

    // Pour la simulation, le statut est toujours SUCCESS
    // Pour les vrais providers, on appellerait le provider pour vérifier
    let statut = tx.statut;
    if (tx.statut === 'PENDING' && tx.moyen_paiement === 'SIMULATION') {
      const provider = PaymentService.getProvider('SIMULATION');
      const result = await provider.verifierPaiement(tx.reference_operateur);
      statut = result.statut === 'SUCCESS' ? 'SUCCESS' : 'PENDING';

      if (statut === 'SUCCESS') {
        await pool.query(
          "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
          [reference]
        );
        // Activer le billet si le paiement est réussi
        await pool.query(
          `UPDATE billet SET statut = 'ACTIF' WHERE id = (
            SELECT billet_id FROM transaction WHERE reference = ?
          )`,
          [reference]
        );
      }
    }

    res.json({ statut, reference });
  } catch (err) {
    console.error("Statut paiement error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { statutPaiement };
```

- [ ] **Step 2: Créer routes/paiements.js**

```js
const express = require("express");
const router = express.Router();
const paiementController = require("../controllers/paiementController");

router.get("/:reference/statut", paiementController.statutPaiement);

module.exports = router;
```

- [ ] **Step 3: Modifier routes/index.js**

```js
router.use("/paiements", require("./paiements"));
```

Ajouter après `router.use("/billets", require("./billets"));`

---

### Task 6: Mobile — eventService.js : fonctions API publiques

**Files:**
- Modify: `mobile/src/services/eventService.js` (ajouter fetchEvenementsPublics, fetchEvenementDetailPublic)

- [ ] **Step 1: Ajouter les fonctions API publiques**

```js
// Récupère la liste des événements publics (actifs, validés par admin)
// Appelle GET /api/evenements/public — accessible sans authentification
export async function fetchEvenementsPublics() {
  try {
    const data = await appelAPI('/evenements/public')
    if (!Array.isArray(data)) return []
    return data.map(e => ({
      id: String(e.id),
      title: e.titre || '',
      description: e.description || '',
      location: e.lieu || '',
      ville: e.ville || '',
      category: e.categorie || '',
      date: e.date_debut || '',
      dateFin: e.date_fin || '',
      capacite: e.capacite_totale || 0,
      priceMin: e.prix_min || 0,
      priceMax: e.prix_max || 0,
    }))
  } catch (err) {
    console.warn('fetchEvenementsPublics error:', err)
    return [] // fallback silencieux
  }
}

// Récupère le détail d'un événement public avec ses catégories de billets
// Appelle GET /api/evenements/public/:id
export async function fetchEvenementDetailPublic(id) {
  try {
    const data = await appelAPI(`/evenements/public/${id}`)
    if (!data || !data.evenement) return null

    const e = data.evenement
    return {
      id: String(e.id),
      title: e.titre || '',
      description: e.description || '',
      location: e.lieu || '',
      ville: e.ville || '',
      category: e.categorie || '',
      date: e.date_debut || '',
      dateFin: e.date_fin || '',
      capacite: e.capacite_totale || 0,
      tickets: (data.types_billets || []).map(t => ({
        id: String(t.id),
        name: t.nom,
        price: t.prix,
        desc: t.description || '',
        places_disponibles: t.places_disponibles,
      })),
    }
  } catch (err) {
    console.warn('fetchEvenementDetailPublic error:', err)
    return null
  }
}
```

---

### Task 7: Mobile — HomeScreen avec API

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js`

- [ ] **Step 1: Ajouter les imports et la fonction formatrice**

Ajouter dans les imports :
```js
import { fetchEvenementsPublics } from '../services/eventService'
import { getDefaultImage } from '../config/images'
import { formaterBadgeDate } from '../utils/dateUtils'
```

Ajouter une fonction `formaterPourEventCard` pour convertir le format API vers le format attendu par `EventCard` :
```js
// Transforme un événement du format API (titre, date_debut, ...) vers le format EventCard
// Utilise getDefaultImage pour les couleurs/icônes par catégorie
function formaterPourEventCard(e) {
  const def = getDefaultImage(e.category)
  const { day, month } = formaterBadgeDate(e.date)
  const time = e.date ? new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
  const priceLabel = e.priceMin > 0
    ? `${e.priceMin.toLocaleString()}F${e.priceMax > e.priceMin ? ` – ${e.priceMax.toLocaleString()}F` : ''}`
    : '—'
  return {
    id: e.id,
    title: e.title,
    month, day,
    bg: def.bg,
    emoji: def.emoji,
    location: e.location,
    category: e.category,
    date: e.date,
    time,
    priceLabel,
  }
}
```

- [ ] **Step 2: Remplacer les MOCKS par l'appel API**

Supprimer la constante `MOCKS` (lignes 23-48).

Changer `useState(MOCKS)` en `useState([])` :
```js
const [evenements, setEvenements] = useState([])
```

Remplacer la fonction `formaterEvenement` (lignes 52-69) et le `useEffect` par :
```js
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', async () => {
    refresh()
    const events = await fetchEvenementsPublics()
    setEvenements(events.map(formaterPourEventCard))
  })
  return unsubscribe
}, [navigation, refresh])
```

- [ ] **Step 3: Mettre à jour la navigation EventDetail**

```js
onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
```

---

### Task 8: Mobile — EventSearchScreen avec API

**Files:**
- Modify: `mobile/src/screens/EventSearchScreen.js`

- [ ] **Step 1: Ajouter les imports et la fonction formatrice**

Ajouter dans les imports :
```js
import { fetchEvenementsPublics } from '../services/eventService'
import { getDefaultImage } from '../config/images'
import { formaterBadgeDate, formaterDateLisible } from '../utils/dateUtils'
```

Ajouter la fonction `formaterPourEventCard` (identique à Task 7) :
```js
function formaterPourEventCard(e) {
  const def = getDefaultImage(e.category)
  const { day, month } = formaterBadgeDate(e.date)
  const time = e.date ? new Date(e.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
  const priceLabel = e.priceMin > 0
    ? `${e.priceMin.toLocaleString()}F${e.priceMax > e.priceMin ? ` – ${e.priceMax.toLocaleString()}F` : ''}`
    : '—'
  return {
    ...e,
    month, day, bg: def.bg, emoji: def.emoji, time, priceLabel,
  }
}
```

- [ ] **Step 2: Remplacer MOCKS par l'appel API**

Supprimer la constante `MOCKS` (lignes 14-38).

Remplacer `useState(MOCKS)` par `useState([])` :
```js
const [allEvents, setAllEvents] = useState([])
```

Remplacer `formaterEvenement` et le `useEffect` par :
```js
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', async () => {
    const events = await fetchEvenementsPublics()
    setAllEvents(events.map(formaterPourEventCard))
  })
  return unsubscribe
}, [navigation])
```

Le filtrage (`results`) reste inchangé car les champs s'appellent toujours `title`, `location`, `category`.

- [ ] **Step 3: Mettre à jour la navigation EventDetail**

```js
onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
```

---

### Task 9: Mobile — EventDetailScreen avec API

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Step 1: Remplacer les imports**

Ajouter :
```js
import { useEffect, useState } from 'react'
import { fetchEvenementDetailPublic } from '../services/eventService'
```

Supprimer l'import de `acheterTicket` et `getAllEvenements` de eventService.

- [ ] **Step 2: Charger les données depuis l'API**

Remplacer la destructuration du `route.params` par :
```js
const { eventId, event } = route.params
const [eventData, setEventData] = useState(event || null)
const [loading, setLoading] = useState(!event)

useEffect(() => {
  if (eventId && !event) {
    fetchEvenementDetailPublic(eventId).then(data => {
      if (data) setEventData(data)
    })
  }
}, [eventId])
```

Utiliser `eventData` au lieu de `event` pour l'affichage.

- [ ] **Step 3: Remplacer handleBuy**

Supprimer l'appel à `acheterTicket()` et `getAllEvenements()`. Remplacer par :
```js
// Sera remplacé par API : appel POST /api/billets/acheter + navigation vers PaiementScreen
const handleBuy = () => {
  const tel = `+221 ${phone.replace(/\s/g, '')}`
  const prix = selectedTicket.price
  Alert.alert(
    'Confirmer le paiement',
    `${selectedTicket.name} — ${prix?.toLocaleString() || '?'} FCFA\nTéléphone: ${tel}`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () => {
          navigation.navigate('Paiement', {
            evenementId: eventData.id,
            categorieTicketId: selectedTicket.id,
            telephone: tel,
            prix,
            provider: 'SIMULATION',
          })
        },
      },
    ]
  )
}
```

---

### Task 10: Mobile — Créer billetService.js et paiementService.js

**Files:**
- Create: `mobile/src/services/billetService.js`
- Create: `mobile/src/services/paiementService.js`

- [ ] **Step 1: Créer billetService.js**

```js
// Service d'achat et consultation de billets via le backend
// Appelle POST /api/billets/acheter et GET /api/billets/mes-billets

import { appelAPI } from './apiService'

// Achète un billet : crée le billet côté serveur et initie le paiement
// @param {Object} params - { evenementId, categorieTicketId, telephone, quantite, provider }
// @returns {Promise<{ billet, paiement }>}
export async function acheterBillet({ evenementId, categorieTicketId, telephone, quantite = 1, provider = 'SIMULATION' }) {
  return await appelAPI('/billets/acheter', {
    method: 'POST',
    body: { evenementId, categorieTicketId, telephone, quantite, provider },
  })
}

// Récupère les billets d'un téléphone
// @param {string} telephone
// @returns {Promise<Array>}
export async function mesBillets(telephone) {
  const data = await appelAPI(`/billets/mes-billets?telephone=${encodeURIComponent(telephone)}`)
  return Array.isArray(data) ? data : []
}
```

- [ ] **Step 2: Créer paiementService.js**

```js
// Service de vérification du statut des paiements
// Appelle GET /api/paiements/:reference/statut

import { appelAPI } from './apiService'

// Vérifie le statut d'un paiement
// @param {string} reference - référence de la transaction
// @returns {Promise<{ statut: string, reference: string }>}
export async function verifierStatutPaiement(reference) {
  return await appelAPI(`/paiements/${reference}/statut`)
}
```

---

### Task 11: Mobile — Créer PaiementScreen.jsx

**Files:**
- Create: `mobile/src/screens/PaiementScreen.jsx`

- [ ] **Step 1: Créer l'écran**

```jsx
// Écran de paiement : initie le paiement et affiche le statut
// Provider SIMULATION : animation 2s puis succès automatique
// Provider réel (plus tard) : WebView avec redirectUrl

import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts, colors, borderRadius } from '../constants/theme'
import { acheterBillet } from '../services/billetService'
import { verifierStatutPaiement } from '../services/paiementService'
import BuyerLayout from '../components/BuyerLayout'

const STATUTS = {
  EN_COURS: { icon: 'loader', color: '#00C8FF', text: 'Paiement en cours...' },
  SUCCESS: { icon: 'check-circle', color: '#16a34a', text: 'Paiement réussi !' },
  ECHEC: { icon: 'alert-circle', color: '#dc2626', text: 'Paiement échoué' },
}

export default function PaiementScreen({ route, navigation }) {
  const { evenementId, categorieTicketId, telephone, prix, provider } = route.params
  const [statut, setStatut] = useState('EN_COURS')
  const [billetData, setBilletData] = useState(null)
  const spinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    )
    spin.start()
    return () => spin.stop()
  }, [spinAnim])

  useEffect(() => {
    let cancelled = false

    const flow = async () => {
      try {
        // Étape 1 : acheter le billet (crée billet + initie paiement)
        const result = await acheterBillet({ evenementId, categorieTicketId, telephone, provider })

        if (cancelled) return
        setBilletData(result.billet)

        // Étape 2 : pour SIMULATION, vérifier le statut immédiatement
        if (provider === 'SIMULATION') {
          await new Promise(r => setTimeout(r, 2500)) // simule délai paiement
          const statutResult = await verifierStatutPaiement(result.paiement.reference)

          if (cancelled) return
          if (statutResult.statut === 'SUCCESS') {
            setStatut('SUCCESS')
            setTimeout(() => {
              navigation.replace('ConfirmationAchat', { billet: result.billet })
            }, 1500)
          } else {
            setStatut('ECHEC')
          }
        }
      } catch (err) {
        if (!cancelled) setStatut('ECHEC')
      }
    }

    flow()
    return () => { cancelled = true }
  }, [])

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const config = STATUTS[statut]

  return (
    <BuyerLayout>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            {statut === 'EN_COURS' ? (
              <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
                <Feather name="loader" size={48} color={config.color} />
              </Animated.View>
            ) : (
              <Feather name={config.icon} size={48} color={config.color} />
            )}
          </View>
          <Text style={styles.statutText}>{config.text}</Text>
          {billetData && (
            <Text style={styles.montant}>{prix?.toLocaleString()} FCFA</Text>
          )}
          {statut === 'EN_COURS' && (
            <Text style={styles.subText}>Ne quittez pas cette page</Text>
          )}
        </View>
      </SafeAreaView>
    </BuyerLayout>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { marginBottom: 24 },
  statutText: { fontFamily: fonts.outfit.semiBold, fontSize: 18, color: colors.slate, marginBottom: 8 },
  montant: { fontFamily: fonts.outfit.bold, fontSize: 24, color: colors.accent, marginBottom: 8 },
  subText: { fontFamily: fonts.jakarta.regular, fontSize: 13, color: colors.mid },
})
```

---

### Task 12: Mobile — Navigation : ajouter les nouveaux écrans

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.js`

- [ ] **Step 1: Ajouter les imports et écrans**

Ajouter dans la BuyerStack :
```js
import PaiementScreen from '../screens/PaiementScreen'
import ConfirmationAchatScreen from '../screens/ConfirmationAchatScreen'
```

Ajouter les écrans dans le Stack.Navigator :
```js
<Stack.Screen name="Paiement" component={PaiementScreen} options={{ headerShown: false }} />
<Stack.Screen name="ConfirmationAchat" component={ConfirmationAchatScreen} options={{ headerShown: false }} />
```

---

### Task 13: Mobile — Mise à jour MesTicketsScreen avec API

**Files:**
- Modify: `mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **Step 1: Ajouter l'appel API**

Ajouter l'import :
```js
import { mesBillets } from '../services/billetService'
```

Remplacer le chargement SQLite par API (avec fallback offline) :
```js
useEffect(() => {
  chargerBillets()
}, [telephone])

const chargerBillets = async () => {
  setLoading(true)
  try {
    const billets = await mesBillets(telephone)
    // Transformer le format backend vers le format attendu par l'UI
    const actifs = billets.filter(b => b.statut === 'ACTIF' || b.statut === 'EN_ATTENTE')
    const supprimes = [] // géré localement pour l'instant
    setTickets(actifs.map(b => ({
      id: b.uuid,
      eventNom: b.evenement_titre,
      eventDate: b.date_debut,
      eventLieu: b.evenement_lieu,
      categorie: b.categorie_nom,
      prix: b.prix_paye,
      telephone: b.telephone_acheteur,
      numero: b.uuid?.slice(0, 8).toUpperCase(),
      statut: b.statut === 'ACTIF' ? 'valide' : 'en_attente',
      dateAchat: b.date_creation,
    })))
  } catch (err) {
    // Fallback offline : lecture SQLite
    const localTickets = await getTicketsActifs(telephone)
    setTickets(localTickets)
  }
  setLoading(false)
}
```

---

### Task 14: Vérification et tests

- [ ] **Step 1: Lancer le backend et tester les endpoints**

```bash
cd backend && node src/db/migrate.js
npm start
```

Tester :
```bash
curl http://localhost:8080/api/evenements/public
curl http://localhost:8080/api/evenements/public/1
```

- [ ] **Step 2: Tester l'achat**

```bash
curl -X POST http://localhost:8080/api/billets/acheter \
  -H "Content-Type: application/json" \
  -d '{"evenementId": 1, "categorieTicketId": 1, "telephone": "+221771234567", "provider": "SIMULATION"}'
```

- [ ] **Step 3: Tester le statut paiement**

```bash
curl http://localhost:8080/api/paiements/PAI-XXXXXXXXXXXX/statut
```
