# Modification / Suppression Événements + Audit — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter modification et suppression d'événements dans le dashboard organisateur, avec journal d'audit local.

**Architecture:** 3 fichiers modifiés : `eventService.js` (logique), `CreerEvenementScreen.jsx` (mode édition), `OrganisateurDashboardScreen.jsx` (boutons Modifier/Supprimer). Audit log dans AsyncStorage via `@senguichet_audit`.

**Tech Stack:** React Native, AsyncStorage, expo-crypto (IDs)

---

### Task 1: eventService.js — Audit + Modification + Suppression

**File:** `mobile/src/services/eventService.js`

- [ ] **Step 1: Ajouter `ajouterAudit` et `getAuditLogs`**

Après la fonction `getTicketsAcheteur`, ajouter :

```js
const AUDIT_KEY = '@senguichet_audit'

export async function ajouterAudit(action, { eventId, eventNom, par, changements }) {
  const raw = await AsyncStorage.getItem(AUDIT_KEY)
  const logs = raw ? JSON.parse(raw) : []
  logs.push({
    id: generateId(),
    action,
    eventId,
    eventNom,
    par: par || 'inconnu',
    changements: changements || null,
    timestamp: new Date().toISOString(),
  })
  await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(logs))
}

export async function getAuditLogs() {
  const raw = await AsyncStorage.getItem(AUDIT_KEY)
  return raw ? JSON.parse(raw).reverse() : []
}
```

- [ ] **Step 2: Ajouter `modifierEvenement`**

```js
export async function modifierEvenement(id, updates) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Événement introuvable')
  const old = events[idx]
  const updated = {
    ...old,
    nom: updates.nom ?? old.nom,
    date: updates.date ?? old.date,
    lieu: updates.lieu ?? old.lieu,
    heure: updates.heure ?? old.heure,
    categorie: updates.categorie ?? old.categorie,
    description: updates.description ?? old.description,
    categories: updates.categories.map(c => ({
      id: c.id || generateId(),
      nom: c.nom,
      prix: Number(c.prix),
      capacite: Number(c.capacite),
    })),
    poster: updates.poster?.uri ?? old.poster,
    bg: updates.bg ?? old.bg,
    emoji: updates.emoji ?? old.emoji,
  }
  events[idx] = updated
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return updated
}
```

- [ ] **Step 3: Ajouter `supprimerEvenement`**

```js
export async function supprimerEvenement(id) {
  const events = await getAllEvenements()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Événement introuvable')
  events[idx].supprime = true
  events[idx].deletedAt = new Date().toISOString()
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}
```

- [ ] **Step 4: Audit dans `creerEvenement`**

Ajouter en fin de `creerEvenement`, après le `setItem` :

```js
await ajouterAudit('creation', { eventId: evt.id, eventNom: evt.nom, par: evt.email || 'organisateur' })
```

Modifier la signature pour accepter `email` :
```js
export async function creerEvenement({ nom, date, description, categorie, categories, poster, lieu, heure, email }) {
```
Avant `events.push(evt)`, ajouter `evt.email = email || ''`

- [ ] **Step 5: Commit**

```bash
git add mobile/src/services/eventService.js
git commit -m "feat: ajout audit log, modifierEvenement, supprimerEvenement"
```

---

### Task 2: CreerEvenementScreen — Mode édition

**File:** `mobile/src/screens/organisateur/CreerEvenementScreen.jsx`

- [ ] **Step 1: Détecter le mode édition via route.params**

Ajouter en début de composant :
```js
const eventExistant = route.params?.event || null
```

Remplacer l'initialisation des states pour pré-remplir si `eventExistant` :
```js
const [nom, setNom] = useState(eventExistant?.nom || '')
const [categorie, setCategorie] = useState(eventExistant?.categorie || '')
const [categorieCustom, setCategorieCustom] = useState('')
const [date, setDate] = useState(eventExistant?.date || '')
const [lieu, setLieu] = useState(eventExistant?.lieu || '')
const [heure, setHeure] = useState(eventExistant?.heure || '')
const [description, setDescription] = useState(eventExistant?.description || '')
const [poster, setPoster] = useState(eventExistant?.poster ? { uri: eventExistant.poster } : null)
const [categories, setCategories] = useState(
  eventExistant?.categories?.map(c => ({ nom: c.nom, prix: String(c.prix), capacite: String(c.capacite), id: c.id }))
  || [{ nom: '', prix: '', capacite: '' }]
)
```

- [ ] **Step 2: Changer le titre et le bouton en mode édition**

Remplacer le titre :
```jsx
<Text style={styles.titre}>{eventExistant ? 'Modifier l\'événement' : 'Créer un événement'}</Text>
<Text style={styles.sousTitre}>{eventExistant ? 'Modifiez les informations' : 'Remplissez les informations de votre événement'}</Text>
```

Remplacer le bouton créer :
```jsx
<BoutonPrincipal
  titre={eventExistant ? 'Modifier l\'événement' : 'Créer l\'événement'}
  onPress={handleCreer}
/>
```

- [ ] **Step 3: Adapter handleConfirm pour mode édition**

Remplacer `handleConfirm` :
```js
const handleConfirm = async () => {
  setRecapVisible(false)
  try {
    const data = { nom, date, lieu, heure, categorie: categorieFinale, description, categories, poster }
    if (eventExistant) {
      await modifierEvenement(eventExistant.id, data)
      await ajouterAudit('modification', {
        eventId: eventExistant.id,
        eventNom: nom,
        par: email,
        changements: { nom, date, lieu, heure },
      })
      Alert.alert('✅ Modifié', 'L\'événement a été mis à jour.')
    } else {
      const evt = await creerEvenement({ ...data, email })
      Alert.alert('Événement créé !', `Code : ${evt.code}\nPartage ce code avec les contrôleurs.`)
    }
    navigation.navigate('Dashboard')
  } catch (e) {
    Alert.alert('Erreur', e.message)
  }
}
```

Ajouter les imports manquants en haut :
```js
import { modifierEvenement, ajouterAudit, creerEvenement } from '../../services/eventService'
```
(Remplacer l'import existant de `creerEvenement`)

Ajouter `email` depuis AuthContext :
```js
import { useAuth } from '../../context/AuthContext'
// ...
const { email } = useAuth()
```

- [ ] **Step 4: Ajouter `route` dans les props**

```js
export default function CreerEvenementScreen({ navigation, route }) {
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/organisateur/CreerEvenementScreen.jsx
git commit -m "feat: CreerEvenementScreen supporte mode édition"
```

---

### Task 3: Dashboard — Boutons Modifier / Supprimer

**File:** `mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx`

- [ ] **Step 1: Ajouter les imports en haut**

```js
import { getAllEvenements, getEvenementStats, supprimerEvenement, ajouterAudit } from '../../services/eventService'
```

- [ ] **Step 2: Filtrer les événements supprimés dans loadData**

```js
async function loadData() {
  const evts = await getAllEvenements()
  const actifs = evts.filter(e => !e.supprime)
  setEvents(actifs)
  const s = {}
  for (const e of actifs) {
    s[e.id] = await getEvenementStats(e.id)
  }
  setStats(s)
}
```

- [ ] **Step 3: Ajouter les boutons Modifier et Supprimer dans la zone dépliée**

Après le bouton "Voir les tickets", ajouter :
```jsx
<View style={s.actionRow}>
  <TouchableOpacity
    style={s.editBtn}
    onPress={() => navigation.navigate('CreerEvenement', { event: evt })}
  >
    <Text style={s.editBtnText}>✏️ Modifier</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={s.deleteBtn}
    onPress={() => {
      Alert.alert(
        'Supprimer',
        `Supprimer "${evt.nom}" ? Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: async () => {
            await supprimerEvenement(evt.id)
            await ajouterAudit('suppression', { eventId: evt.id, eventNom: evt.nom, par: email })
            loadData()
          }},
        ]
      )
    }}
  >
    <Text style={s.deleteBtnText}>🗑️ Supprimer</Text>
  </TouchableOpacity>
</View>
```

- [ ] **Step 4: Ajouter les styles**

Dans l'objet `s` :
```js
actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
editBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: colors.accentLight },
editBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.accent },
deleteBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: '#fef2f2' },
deleteBtnText: { fontSize: 13, fontFamily: fonts.outfit.semiBold, color: colors.red },
```

- [ ] **Step 5: Ajouter `email` depuis AuthContext (déjà importé)**

Vérifier que `email` est extrait de `useAuth()` (déjà fait ligne 23).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/organisateur/OrganisateurDashboardScreen.jsx
git commit -m "feat: boutons Modifier/Supprimer dans dashboard + audit"
```
