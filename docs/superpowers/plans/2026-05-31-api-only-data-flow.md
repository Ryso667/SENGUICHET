# API-Only Data Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all AsyncStorage/SQLite mock data from buyer flows. Only API data from MySQL backend.

**Architecture:** HomeScreen "Mes tickets" section switches from `useTickets()` (SQLite) to API `mesBillets()`. Remove dead AsyncStorage code from `eventService.js`. Keep SQLite only for controller offline scan. Add one-time cleanup migration.

**Tech Stack:** React Native, Expo, SQLite (controller only), AsyncStorage (preferences only)

---

### Task 1: Nettoyer les vieilles données dans AsyncStorage dès la première connexion

**Files:**
- Modify: `mobile/src/context/AuthContext.tsx` (ou .js)
- Create: `mobile/src/utils/cleanupLegacyData.js`

- [ ] **Step 1: Créer le utilitaire de nettoyage**

```js
// Utilitaires de nettoyage des données legacy stockées localement
// Nettoie AsyncStorage et SQLite des vieilles données de test
// Appelé une seule fois après mise à jour
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SQLite from 'expo-sqlite'

const CLEANUP_KEY = '@senguichet_cleanup_v2'

// Nettoie toutes les données mockées stockées localement
export async function nettoyerDonneesLegacy() {
  try {
    const dejaNettoye = await AsyncStorage.getItem(CLEANUP_KEY)
    if (dejaNettoye) return

    // Supprimer les clés de tickets et événements mockés
    await AsyncStorage.multiRemove([
      '@senguichet_tickets',
      '@senguichet_evenements',
      '@senguichet_audit',
    ])

    // Supprimer les marqueurs de migration (seront recréés si besoin)
    const toutesClefs = await AsyncStorage.getAllKeys()
    const clefsMigration = toutesClefs.filter(k => k.startsWith('@senguichet_migrated_db_'))
    if (clefsMigration.length > 0) {
      await AsyncStorage.multiRemove(clefsMigration)
    }

    // Nettoyer SQLite buyer_tickets
    const db = await SQLite.openDatabaseAsync('senguichet.db')
    await db.execAsync('DROP TABLE IF EXISTS buyer_tickets;')
    await db.closeAsync()

    await AsyncStorage.setItem(CLEANUP_KEY, '1')
    console.log('✅ Nettoyage données legacy effectué')
  } catch (e) {
    console.warn('⚠️ Nettoyage legacy ignoré:', e.message)
  }
}
```

- [ ] **Step 2: Ajouter l'appel au cleanup dans AuthContext**

Dans `mobile/src/context/AuthContext.tsx` ou `.js`, importer `nettoyerDonneesLegacy` et l'appeler au démarrage :

```js
import { nettoyerDonneesLegacy } from '../utils/cleanupLegacyData'

// Dans le useEffect ou le useState initial, ajouter :
useEffect(() => {
  nettoyerDonneesLegacy()
}, [])
```

---

### Task 2: HomeScreen — section "Mes tickets" via API au lieu de SQLite

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js`

- [ ] **Step 1: Remplacer `useTickets` hook par appel API `mesBillets`**

```js
// Remplacer l'import
import { mesBillets } from '../services/billetService'
// Supprimer : import { useTickets } from '../hooks/useTickets'
```

- [ ] **Step 2: Modifier le state et useEffect**

```js
// Remplacer :
const { tickets, refresh } = useTickets()

// Par :
const [tickets, setTickets] = useState([])
const { numeroTel } = useAuth()

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', async () => {
    const events = await fetchEvenementsPublics()
    setEvenements(events.map(formaterPourEventCard))
    // Charger les tickets depuis l'API
    if (numeroTel) {
      const data = await mesBillets(numeroTel)
      setTickets(data || [])
    }
  })
  return unsubscribe
}, [navigation, numeroTel])
```

Note : `numeroTel` est déjà extrait via `useAuth()` plus bas.

- [ ] **Step 3: Adapter l'affichage des tickets au format API**

Les tickets API ont les champs : `numero`, `evenement_titre`, `evenement_lieu`, `categorie_nom`, `prix_paye`, `statut`, `date_creation`

Dans le rendu :

```js
// Remplacer t.eventNom → t.evenement_titre
// Remplacer t.categorie → t.categorie_nom
// Remplacer t.eventDate → t.date_creation (ou t.date_debut de l'événement)
// Remplacer t.statut → t.statut (déjà compatible : ACTIF/UTILISE/EN_ATTENTE)
// Remplacer t.id → t.numero ou t.id
```

Changer le mapping :

```js
{tickets.slice(0, 3).map((t) => (
  <TouchableOpacity
    key={t.numero || t.id}
    style={styles.ticketCard}
    onPress={() => navigation.navigate('Ticket', { ticket: t })}
    activeOpacity={0.7}
  >
    ...
    <Text style={styles.ticketTitle}>{t.evenement_titre}</Text>
    <Text style={styles.ticketMeta}>{t.categorie_nom} · {formaterDateLisible(t.date_creation)}</Text>
    ...
    <View style={[styles.dot, { backgroundColor: (STATUTS[t.statut]?.dot || '#059669') }]} />
    <Text style={[styles.ticketLabel, { color: (STATUTS[t.statut]?.color || '#059669') }]}>
      {STATUTS[t.statut]?.label || 'VALIDE'}
    </Text>
    ...
  </TouchableOpacity>
))}
```

- [ ] **Step 4: Adapter le header "x ticket(s) actif(s)"**

```js
// Ligne 61-63, remplacer :
{tickets.length > 0
  ? `${tickets.length} ticket${tickets.length > 1 ? 's' : ''} actif${tickets.length > 1 ? 's' : ''}`
  : 'Aucun ticket actif'}
```

Ce code reste inchangé car `tickets` vient maintenant de l'API avec le même format de comptage.

---

### Task 3: Supprimer le hook `useTickets`

**Files:**
- Delete: `mobile/src/hooks/useTickets.js`

- [ ] **Step 1: Supprimer le fichier**

```bash
Remove-Item -LiteralPath "mobile/src/hooks/useTickets.js" -Force
```

Vérifier qu'aucun autre fichier n'importe `useTickets` :

```bash
Select-String -Pattern "useTickets" -Path "mobile/src/**/*.js" -SimpleMatch
```

Ne devrait retourner que HomeScreen (déjà migré dans Task 2).

---

### Task 4: Nettoyer eventService.js — supprimer les fonctions AsyncStorage mortes

**Files:**
- Modify: `mobile/src/services/eventService.js`

- [ ] **Step 1: Identifier et supprimer les fonctions mortes**

Supprimer ces fonctions de `eventService.js` (elles ne sont plus appelées par aucun écran) :

| Fonction | Raison |
|----------|--------|
| `getAllEvenements` | Remplacé par `fetchEvenementsAPI` |
| `getEvenement(id)` | Remplacé par `fetchEvenementDetailAPI` |
| `genererCodeSecurise` | Login dans le hook mort |
| `creerEvenement` | Remplacé par `creerEvenementAPI` |
| `acheterTicket` | Remplacé par `acheterBillet` (billetService) |
| `getAllTickets` | Remplacé par `mesBillets` (billetService) |
| `getTicketsByEvent` | Remplacé par API |
| `getEvenementStats` | Jamais appelé par les écrans |
| `getTicketsAcheteur` | Remplacé par `mesBillets` |
| `modifierEvenement` | Remplacé par `modifierEvenementAPI` |
| `supprimerEvenement` | Remplacé par `annulerEvenementAPI` |
| `ajouterAudit` | AsyncStorage mort |
| `getAuditLogs` | AsyncStorage mort |

Supprimer aussi les imports associés :

```js
// Supprimer :
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import { insererTicketAchete } from '../database/database'
import { getDefaultImage } from '../config/images'

// Garder :
import { appelAPI } from './apiService'
```

Conserver uniquement :
```js
// Fonctions API — à GARDER
export async function fetchEvenementsAPI()
export async function creerEvenementAPI(data)
export async function fetchEvenementDetailAPI(id)
export async function modifierEvenementAPI(id, data)
export async function annulerEvenementAPI(id)
export async function fetchEvenementsPublics(filtres)
export async function fetchEvenementDetailPublic(eventId)
```

---

### Task 5: Nettoyer database/database.js — garder seulement scan contrôleur

**Files:**
- Modify: `mobile/src/database/database.js`

- [ ] **Step 1: Supprimer les tables et fonctions acheteur**

Dans `database.js`, garder uniquement ce qui est lié au scan contrôleur offline :
- Table `scans` (logs de scan)
- Table `tickets` (tickets téléchargés pour offline)
- Fonctions : `initDatabase`, `insererScan`, `getScansEnAttente`, `supprimerScans`, `insererTicketTelecharge`, `getTicketByUUID`, `getTicketsPourOffline`

Supprimer tout ce qui est lié à `buyer_tickets` :
- Table `buyer_tickets` (DROP dans l'init)
- Fonctions : `getTicketsActifs`, `getTicketsSupprimes`, `supprimerTicket`, `restaurerTicket`, `insererTicketAchete`

---

### Task 6: Vérifier que le flux d'achat bout-en-bout fonctionne

**Files:**
- Examine: `mobile/src/screens/EventDetailScreen.js` (déjà API ✅)
- Examine: `mobile/src/screens/PaiementScreen.js` (vérifier source de données)

- [ ] **Step 1: Vérifier PaiementScreen**

Lire `PaiementScreen.js` pour confirmer qu'il utilise l'API et non AsyncStorage.

```bash
Select-String -Pattern "AsyncStorage|getAllTickets|acheterTicket" -Path "mobile/src/screens/PaiementScreen.js" -SimpleMatch
```

S'il utilise `acheterTicket` (AsyncStorage), le remplacer par `acheterBillet` (API) depuis `billetService.js`.

---

### Task 7: Supprimer eventService.js — code commenté ou imports morts

**Files:**
- Modify: `mobile/src/services/eventService.js`

- [ ] **Step 1: Supprimer les constantes et helpers morts**

```js
// Supprimer :
const CLE_SECRETE_QR = '...'
const EVENTS_KEY = '@senguichet_evenements'
const TICKETS_KEY = '@senguichet_tickets'
const AUDIT_KEY = '@senguichet_audit'
function generateId() { ... }
function formatNum(n, len) { ... }
```
