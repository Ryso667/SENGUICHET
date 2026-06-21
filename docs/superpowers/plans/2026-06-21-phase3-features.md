# Phase 3 — Fonctionnalités (Calendrier, Codes promo, Push, CSV)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 features: calendrier acheteur synchronisé, codes promo (full stack), notifications push acheteur, export CSV avancé.

**Architecture:** Backend new endpoints + mobile UI. 4 independent sub-features that can be done in any order.

**Tech Stack:** Express.js, MySQL, Expo push, expo-file-system, expo-sharing

---

### 3.1 — Calendrier synchronisé acheteur

**Task 1: CalendarScreen — ajouter filtre "Mes billets"**

**Files:**
- Modify: `mobile/src/screens/CalendarScreen.jsx`

- [ ] **Step 1: Ajouter les imports et état**

Ajouter:
```jsx
import { mesBillets } from '../services/billetService'
```
Et après les useState existants:
```jsx
const [filtreCalendrier, setFiltreCalendrier] = useState('tout') // 'tout' | 'mes-billets'
const [ticketsDates, setTicketsDates] = useState({})
const [loadingTickets, setLoadingTickets] = useState(false)
```

- [ ] **Step 2: Charger les billets quand le filtre change**

Dans `useFocusEffect`, après le chargement des événements publics, si `filtreCalendrier === 'mes-billets'`:
```js
const tel = await AsyncStorage.getItem('@senguichet_telephone')
const email = await AsyncStorage.getItem('@senguichet_email')
if (tel || email) {
  setLoadingTickets(true)
  const billets = await mesBillets(tel, email)
  const map = {}
  billets.forEach(b => {
    const d = b.eventDate?.split('T')[0] || b.dateAchat?.split('T')[0]
    if (d) {
      if (!map[d]) map[d] = []
      map[d].push(b)
    }
  })
  setTicketsDates(map)
  setLoadingTickets(false)
}
```

- [ ] **Step 3: Ajouter les tabs de filtre en haut**

Ajouter sous le header, avant la grille calendrier:
```jsx
<View style={styles.filterRow}>
  {['tout', 'mes-billets'].map(f => (
    <TouchableOpacity
      key={f}
      style={[styles.filterChip, filtreCalendrier === f && styles.filterChipActive]}
      onPress={() => setFiltreCalendrier(f)}
    >
      <Text style={[styles.filterChipText, filtreCalendrier === f && styles.filterChipTextActive]}>
        {f === 'tout' ? 'Tous les événements' : 'Mes billets'}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

- [ ] **Step 4: Afficher les dots de couleur différente sur les jours**

Dans le rendu de chaque jour, vérifier si le jour a des tickets:
```jsx
const aTickets = ticketsDates[key]?.length > 0
// À côté du dot public existant:
{aTickets && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
```

- [ ] **Step 5: Naviguer vers RecuAchat quand on tape un jour avec tickets**

Dans `onPress` du jour, si `filtreCalendrier === 'mes-billets' && aTickets`:
```js
const billets = ticketsDates[key]
if (billets.length > 0) {
  navigation.navigate('RecuAchat', { reference: billets[0].reference, billetsAchetes: billets })
}
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/CalendarScreen.jsx
git commit -m "feat: calendrier acheteur avec filtre Mes billets et navigation vers recu"
```

---

### 3.2 — Codes promo

**Task 2: Backend — table + schema code_promo**

**Files:**
- Modify: `backend/src/db/schema.sql` (append table)
- Modify: `backend/src/db/migrate.js` (append table creation)

- [ ] **Step 1: Ajouter la table dans schema.sql**

```sql
-- Table des codes promo
CREATE TABLE IF NOT EXISTS code_promo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  evenement_id INT NULL,
  code VARCHAR(50) NOT NULL,
  type ENUM('pourcentage','fixe') NOT NULL DEFAULT 'pourcentage',
  valeur DECIMAL(10,2) NOT NULL,
  utilisations_max INT NOT NULL DEFAULT 0,
  utilisations_actuelles INT NOT NULL DEFAULT 0,
  date_expiration DATETIME NOT NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (code),
  FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE SET NULL
);
```

- [ ] **Step 2: Ajouter dans migrate.js**

Ajouter la même requête CREATE TABLE après les tables existantes (avant la dernière parenthèse du tableau `queries`).

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/schema.sql backend/src/db/migrate.js
git commit -m "feat: table code_promo dans schema et migration"
```

---

**Task 3: Backend — routes et contrôleur codes promo**

**Files:**
- Create: `backend/src/routes/codes.js`
- Create: `backend/src/controllers/codePromoController.js`
- Modify: `backend/src/routes/index.js`

- [ ] **Step 1: Créer le contrôleur**

`backend/src/controllers/codePromoController.js`:
```js
const db = require('../config/db')

// Valider un code promo et retourner la réduction
// POST /api/codes/valider
exports.valider = async (req, res) => {
  try {
    const { code, evenementId, montant } = req.body
    const [rows] = await db.query(
      `SELECT * FROM code_promo WHERE code = ? AND actif = 1
       AND (date_expiration > NOW() OR date_expiration IS NULL)
       AND (evenement_id IS NULL OR evenement_id = ?)
       AND (utilisations_max = 0 OR utilisations_actuelles < utilisations_max)`,
      [code, evenementId || null]
    )
    if (rows.length === 0) return res.status(404).json({ valide: false, message: 'Code invalide ou expiré' })

    const promo = rows[0]
    const reduction = promo.type === 'pourcentage'
      ? Math.round(montant * promo.valeur / 100)
      : Math.min(Number(promo.valeur), montant)

    res.json({ valide: true, reduction, type: promo.type, valeur: promo.valeur, promoId: promo.id })
  } catch (err) {
    res.status(500).json({ message: 'Erreur validation code promo', error: err.message })
  }
}

// Incrémenter le compteur d'utilisation
// POST /api/codes/utiliser
exports.utiliser = async (req, res) => {
  try {
    const { promoId } = req.body
    await db.query('UPDATE code_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?', [promoId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour code promo', error: err.message })
  }
}

// Lister les codes de l'organisateur connecté
// GET /api/organisateur/codes
exports.lister = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT cp.*, e.titre as evenement_titre
       FROM code_promo cp
       LEFT JOIN evenement e ON cp.evenement_id = e.id
       WHERE cp.organisateur_id = ?
       ORDER BY cp.created_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: 'Erreur liste codes promo', error: err.message })
  }
}

// Créer un code promo
// POST /api/organisateur/codes
exports.creer = async (req, res) => {
  try {
    const { code, type, valeur, utilisations_max, date_expiration, evenement_id } = req.body
    await db.query(
      `INSERT INTO code_promo (organisateur_id, code, type, valeur, utilisations_max, date_expiration, evenement_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, code.toUpperCase(), type, valeur, utilisations_max || 0, date_expiration, evenement_id || null]
    )
    res.status(201).json({ message: 'Code promo créé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création code promo', error: err.message })
  }
}
```

- [ ] **Step 2: Créer la route**

`backend/src/routes/codes.js`:
```js
const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/codePromoController')
const auth = require('../middleware/auth')

router.post('/valider', ctrl.valider)
router.post('/utiliser', ctrl.utiliser)
router.get('/organisateur/codes', auth(['ORGANISATEUR']), ctrl.lister)
router.post('/organisateur/codes', auth(['ORGANISATEUR']), ctrl.creer)

module.exports = router
```

- [ ] **Step 3: Ajouter dans index.js**

```js
router.use('/codes', require('./codes'))
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/codePromoController.js backend/src/routes/codes.js backend/src/routes/index.js
git commit -m "feat: validation et gestion des codes promo (backend)"
```

---

**Task 4: Mobile — champ code promo dans EventDetailScreen**

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Step 1: Ajouter un champ code promo dans le bottom sheet de paiement**

Dans le bloc `paymentEtape === 'confirm'`, après l'input téléphone, ajouter:
```jsx
<View style={styles.promoRow}>
  <TextInput
    style={styles.promoInput}
    placeholder="Code promo"
    placeholderTextColor={colors.textTertiary}
    value={codePromo}
    onChangeText={setCodePromo}
    autoCapitalize="characters"
  />
  <TouchableOpacity
    style={[styles.promoBtn, codePromoValidating && { opacity: 0.5 }]}
    onPress={validerCodePromo}
    disabled={codePromoValidating || !codePromo.trim()}
  >
    <Text style={styles.promoBtnText}>
      {codePromoValidating ? '...' : codePromoValide ? '✓' : 'Appliquer'}
    </Text>
  </TouchableOpacity>
</View>
```
Et afficher la réduction dans le total:
```jsx
{promotion > 0 && (
  <Text style={styles.promoDiscount}>-{promotion.toLocaleString()} FCFA</Text>
)}
```

- [ ] **Step 2: Ajouter l'état et la fonction de validation**

```jsx
const [codePromo, setCodePromo] = useState('')
const [codePromoValide, setCodePromoValide] = useState(null) // null | true | false
const [codePromoValidating, setCodePromoValidating] = useState(false)
const [promotion, setPromotion] = useState(0)
const [promoId, setPromoId] = useState(null)

const validerCodePromo = async () => {
  if (!codePromo.trim() || !selectedTicket) return
  setCodePromoValidating(true)
  try {
    const res = await appelAPI('/codes/valider', {
      method: 'POST',
      body: { code: codePromo.trim(), evenementId: event.id, montant: selectedTicket.price * quantite }
    })
    if (res.valide) {
      setCodePromoValide(true)
      setPromotion(res.reduction)
      setPromoId(res.promoId)
      hapticSuccess()
    } else {
      setCodePromoValide(false)
      setPromotion(0)
    }
  } catch {
    setCodePromoValide(false)
    setPromotion(0)
  }
  setCodePromoValidating(false)
}
```

Le total affiché devient `prix * quantite - promotion`.

- [ ] **Step 3: Envoyer promoId dans la requête d'achat**

Dans `confirmerPaiement`, ajouter `promoId` au body si présent:
```jsx
if (promoId) body.promoId = promoId
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "feat: champ code promo dans le flow d'achat (mobile)"
```

---

**Task 5: Backend — appliquer la réduction dans le flow d'achat**

**Files:**
- Modify: `backend/src/controllers/billetController.js`

- [ ] **Step 1: Modifier la fonction `acheter`**

Après extraction de `quantite` (ligne 27), ajouter:
```js
const promoId = req.body.promoId || null
let reduction = 0
if (promoId) {
  const [promos] = await db.query(
    `SELECT * FROM code_promo WHERE id = ? AND actif = 1
     AND (date_expiration IS NULL OR date_expiration > NOW())
     AND (utilisations_max = 0 OR utilisations_actuelles < utilisations_max)`,
    [promoId]
  )
  if (promos.length > 0) {
    const promo = promos[0]
    reduction = promo.type === 'pourcentage'
      ? Math.round(cat.prix * quantite * promo.valeur / 100)
      : Math.min(Number(promo.valeur), cat.prix * quantite)
    await db.query('UPDATE code_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?', [promoId])
  }
}
```

Modifier `montantTotal = cat.prix * quantite - reduction`.

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/billetController.js
git commit -m "feat: applique reduction code promo dans le flow d'achat"
```

---

### 3.3 — Notifications push acheteur

**Task 6: Backend — étendre NotificationService pour les acheteurs**

**Files:**
- Modify: `backend/src/services/NotificationService.js`
- Add to migrate.js: push_tokens table extension (optional)

- [ ] **Step 1: Étendre NotificationService**

Ajouter une fonction exportée:
```js
// Envoie une notification push à un acheteur
// @param {number} acheteurId - ID de l'acheteur
// @param {object} data - { type, message, evenementId }
exports.envoyerNotificationAcheteur = async (acheteurId, data) => {
  try {
    const { Expo } = await import('expo-server-sdk')
    const expo = new Expo()
    const [tokens] = await db.query('SELECT token FROM push_tokens WHERE acheteur_id = ?', [acheteurId])
    const messages = tokens
      .filter(r => Expo.isExpoPushToken(r.token))
      .map(r => ({ to: r.token, sound: 'default', title: 'SENGUICHET', body: data.message, data: { ...data } }))
    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages)
      for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk)
    }
  } catch (err) {
    console.error('Erreur push acheteur:', err.message)
  }
}
```

- [ ] **Step 2: Ajouter colonne acheteur_id à push_tokens dans migrate.js**

```sql
-- Ajouter la colonne acheteur_id si pas déjà
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS acheteur_id INT NULL AFTER organisateur_id;
```

- [ ] **Step 3: Commiter**

```bash
git add backend/src/services/NotificationService.js
git commit -m "feat: support push notifications pour acheteurs (backend)"
```

---

**Task 7: Backend — route register-token pour acheteur**

**Files:**
- Modify: `backend/src/routes/notifications.js`
- Modify: `backend/src/controllers/billetController.js` (envoyer push après achat)

- [ ] **Step 1: Modifier la route register-token**

Dans `POST /register-token`, accepter aussi `acheteur_id` (optionnel). Si `acheteur_id` est fourni, stocker avec ce champ.

Modifier les middlewares: `authMiddleware(['ORGANISATEUR'])` → `authMiddleware(['ORGANISATEUR', 'ACHEUTEUR'])` ou ajouter une route séparée.

- [ ] **Step 2: Ajouter push dans le flow d'achat**

Dans `billetController.js` `acheter()` après la création des billets, envoyer push à l'acheteur:
```js
if (acheteurId) {
  envoyerNotificationAcheteur(acheteurId, {
    type: 'achat',
    message: `Achat confirmé: ${cat.nom} ×${quantite} - ${montantTotal.toLocaleString()} FCFA`,
    evenementId: evenementId
  }).catch(e => console.error('Push acheteur error:', e.message))
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/notifications.js backend/src/controllers/billetController.js
git commit -m "feat: enregistrement push token acheteur + notification post-achat"
```

---

**Task 8: Mobile — enregistrer push token après connexion acheteur**

**Files:**
- Modify: `mobile/src/context/AuthContext.jsx`
- Modify: `mobile/src/services/notificationService.js` (ajouter route acheteur)

- [ ] **Step 1: Dans AuthContext**

Dans `connecterAcheteurOTP()`, après avoir stocké les infos (ligne ~210), ajouter:
```jsx
try {
  const pushToken = await obtenirTokenPush()
  if (pushToken) await enregistrerTokenAcheteur(pushToken)
} catch (e) {
  console.error('Erreur enregistrement push acheteur:', e.message)
}
```

- [ ] **Step 2: Dans notificationService.js**

Ajouter:
```jsx
export async function enregistrerTokenAcheteur(token) {
  return await appelAPI('/notifications/register-token', {
    method: 'POST',
    body: { token, role: 'acheteur' }
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/context/AuthContext.jsx mobile/src/services/notificationService.js
git commit -m "feat: enregistrement push token lors de la connexion acheteur"
```

---

### 3.4 — Export CSV avancé

**Task 9: Mobile — bouton "Exporter tout" sur le Dashboard**

**Files:**
- Modify: `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] **Step 1: Ajouter un bouton "Exporter tout"**

Dans le header ou à côté du titre "Mes événements récents", ajouter:
```jsx
<TouchableOpacity style={styles.exportBtn} onPress={exporterToutCSV} disabled={exportingAll}>
  <MaterialCommunityIcons name="file-delimited-outline" size={18} color={colors.accent} />
  <Text style={styles.exportBtnText}>{exportingAll ? 'Export...' : 'CSV tout'}</Text>
</TouchableOpacity>
```

- [ ] **Step 2: Fonction d'export**

```jsx
const [exportingAll, setExportingAll] = useState(false)

const exporterToutCSV = async () => {
  try {
    setExportingAll(true)
    const billets = await fetchBilletsEvenementAPI() // ou appeler mesBillets()
    // Même logique CSV que DetailEvenementScreen
    const echapper = v => `"${String(v || '').replace(/"/g, '""')}"`
    const entetes = ['Événement', 'Nom', 'Email', 'Téléphone', 'Catégorie', 'Prix', 'Date achat', 'Statut']
    const lignes = billets.map(b => [
      b.evenement, b.nom, b.email, b.telephone,
      b.categorie, b.prix, b.dateAchat, b.statut
    ].map(echapper).join(','))
    const csv = [entetes.join(','), ...lignes].join('\n')
    const uri = FileSystem.cacheDirectory + 'billets-tous.csv'
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 })
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Exporter tous les billets' })
  } catch (e) {
    Alert.alert('Erreur', "Impossible d'exporter les billets")
  }
  setExportingAll(false)
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx
git commit -m "feat: bouton Exporter tout sur le Dashboard organisateur"
```

---

**Task 10: Mobile — bouton "Exporter" sur GestionEvenementsScreen**

**Files:**
- Modify: `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx`

- [ ] **Step 1: Ajouter un bouton "CSV" dans le header**

À côté des boutons "Statistiques" et "Demander":
```jsx
<TouchableOpacity onPress={exporterFiltreCSV} disabled={exportingFiltre}>
  <MaterialCommunityIcons name="file-delimited-outline" size={20} color={colors.accent} />
</TouchableOpacity>
```

- [ ] **Step 2: Ajouter la fonction d'export filtré**

```jsx
const [exportingFiltre, setExportingFiltre] = useState(false)

async function exporterFiltreCSV() {
  try {
    setExportingFiltre(true)
    const filtres = { statut: filtreActif !== 'tous' ? filtreActif : undefined }
    const billets = await fetchBilletsEvenementAPI(null, filtres) // ou endpoint backend filtré
    // Même logique CSV que Task 9
    // Nommer le fichier: billets-{filtreActif || 'tous'}.csv
  } catch (e) {
    Alert.alert('Erreur', "Impossible d'exporter")
  }
  setExportingFiltre(false)
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/organisateur/GestionEvenementsScreen.jsx
git commit -m "feat: bouton export CSV filtre sur GestionEvenementsScreen"
```
