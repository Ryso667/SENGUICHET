# Phase 1 — États vides et Recherche

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les états vides inline par le composant EmptyState réutilisable sur 4 écrans + ajouter les suggestions de recherche récentes sur EventSearchScreen.

**Architecture:** 4 screens partagent le même composant EmptyState (existe déjà, utilise useTheme). EventSearchScreen reçoit AsyncStorage + RecentSearchChips. Aucun backend nécessaire.

**Tech Stack:** React Native, AsyncStorage, expo-haptics

---

### Task 1: MesTicketsScreen — Remplacer ListEmptyComponent inline par EmptyState

**Files:**
- Modify: `mobile/src/screens/MesTicketsScreen.jsx` (lignes ~197-219)

- [ ] **Step 1: Lire le fichier pour vérifier les imports actuels et la structure**

Run: `grep -n "import" mobile/src/screens/MesTicketsScreen.jsx`

- [ ] **Step 2: Ajouter l'import EmptyState**

Ajouter en haut du fichier, avec les autres imports de composants:
```jsx
import EmptyState from '../components/EmptyState'
```

- [ ] **Step 3: Remplacer le ListEmptyComponent inline par EmptyState**

Remplacer les lignes 197-219 du `ListEmptyComponent`:
```jsx
ListEmptyComponent={
  !syncing ? (
    <EmptyState
      icon={ongletActif === 'actifs' ? '🎫' : '🎟️'}
      title={ongletActif === 'actifs' ? 'Aucun billet actif' : 'Aucun billet passé'}
      subtitle={ongletActif === 'actifs'
        ? 'Explore les événements et achète ton premier billet'
        : 'Tes billets utilisés ou expirés apparaîtront ici'}
      actionLabel={ongletActif === 'actifs' ? 'Explorer' : undefined}
      onAction={ongletActif === 'actifs' ? () => {
        hapticLight()
        navigation.navigate('Home')
      } : undefined}
    />
  ) : null
}
```

- [ ] **Step 4: Supprimer les styles inline devenus inutilisés**

Vérifier si `emptyContainer`, `emptyTitle`, `emptySubtitle`, `emptyCta`, `emptyCtaText` sont encore référencés ailleurs dans `makeStyles`. Si non, les supprimer.

```bash
grep -n "emptyContainer\|emptyTitle\|emptySubtitle\|emptyCta\|emptyCtaText" mobile/src/screens/MesTicketsScreen.jsx
```

S'ils ne sont utilisés que dans le bloc remplacé, supprimer ces blocs de `StyleSheet.create()`.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/MesTicketsScreen.jsx
git commit -m "feat: remplace ListEmptyComponent inline par EmptyState sur MesTicketsScreen"
```

---

### Task 2: MesFavorisScreen — Remplacer l'état vide conditionnel par EmptyState

**Files:**
- Modify: `mobile/src/screens/MesFavorisScreen.jsx` (lignes ~83-88)

- [ ] **Step 1: Ajouter l'import EmptyState**

```jsx
import EmptyState from '../components/EmptyState'
```

- [ ] **Step 2: Remplacer le rendu conditionnel vide par EmptyState**

Remplacer (lignes 83-88):
```jsx
{favoris.length === 0 ? (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons name="heart-outline" size={56} color={colors.textTertiary} />
    <Text style={styles.emptyTitle}>Aucun favori</Text>
    <Text style={styles.emptySub}>Ajoute des événements en cœur pour les retrouver ici</Text>
  </View>
) : (
```

Par:
```jsx
{favoris.length === 0 ? (
  <EmptyState
    icon="💔"
    title="Aucun favori"
    subtitle="Ajoute des événements en cœur pour les retrouver ici"
  />
) : (
```

- [ ] **Step 3: Supprimer les styles inutilisés**

Vérifier si `emptyState`, `emptyTitle`, `emptySub` sont référencés ailleurs. Si non, les supprimer.

- [ ] **Step 4: Vérifier que l'import MaterialCommunityIcons n'est plus nécessaire**

Si `MaterialCommunityIcons` n'est plus utilisé nulle part dans le fichier, supprimer son import.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/MesFavorisScreen.jsx
git commit -m "feat: remplace etat vide inline par EmptyState sur MesFavorisScreen"
```

---

### Task 3: GestionEvenementsScreen — Remplacer l'état vide GlassContainer par EmptyState

**Files:**
- Modify: `mobile/src/screens/organisateur/GestionEvenementsScreen.jsx` (lignes ~138-149)

- [ ] **Step 1: Ajouter l'import EmptyState**

```jsx
import EmptyState from '../../components/EmptyState'
```

- [ ] **Step 2: Remplacer l'état vide conditionnel par EmptyState**

Remplacer (lignes 138-149):
```jsx
) : filtered.length === 0 ? (
  /* État vide — calqué sur le web */
  <GlassContainer blurType="light" style={s.emptyState}>
    <MaterialCommunityIcons name="ticket-outline" size={56} color="rgba(0,0,0,0.12)" />
    <Text style={s.emptyTitle}>Aucun événement trouvé</Text>
    <Text style={s.emptySub}>Vous n'avez pas encore d'événement. Faites une demande à l'équipe SENGUICHET.</Text>
    <TouchableOpacity onPress={() => navigation.navigate('Demandes')} activeOpacity={0.8}>
      <LinearGradient colors={gradients.primary} style={s.emptyBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={s.emptyBtnText}>Demander un événement</Text>
      </LinearGradient>
    </TouchableOpacity>
  </GlassContainer>
```

Par:
```jsx
) : filtered.length === 0 ? (
  <EmptyState
    icon="🎫"
    title="Aucun événement trouvé"
    subtitle="Vous n'avez pas encore d'événement. Faites une demande à l'équipe SENGUICHET."
    actionLabel="Demander un événement"
    onAction={() => navigation.navigate('Demandes')}
  />
```

- [ ] **Step 3: Supprimer les styles inutilisés**

Vérifier si `emptyState`, `emptyTitle`, `emptySub`, `emptyBtn`, `emptyBtnText` sont encore référencés ailleurs. Si non, les supprimer de `makeStyles`.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/organisateur/GestionEvenementsScreen.jsx
git commit -m "feat: remplace etat vide inline par EmptyState sur GestionEvenementsScreen"
```

---

### Task 4: NotificationsScreen — Remplacer l'état vide conditionnel par EmptyState

**Files:**
- Modify: `mobile/src/screens/NotificationsScreen.js` (lignes ~88-97)

- [ ] **Step 1: Ajouter l'import EmptyState**

```jsx
import EmptyState from '../components/EmptyState'
```

- [ ] **Step 2: Remplacer les rendus conditionnels vides par EmptyState + ActivityIndicator**

Remplacer (lignes 88-97):
```jsx
{chargement ? (
  <View style={styles.center}>
    <Feather name="bell" size={40} color={colors.textTertiary} />
    <Text style={styles.emptyText}>Chargement...</Text>
  </View>
) : notifications.length === 0 ? (
  <View style={styles.center}>
    <Feather name="bell-off" size={40} color={colors.textTertiary} />
    <Text style={styles.emptyText}>Aucune notification</Text>
  </View>
) : (
```

Par:
```jsx
{chargement ? (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={colors.accent} />
  </View>
) : notifications.length === 0 ? (
  <EmptyState
    icon="🔔"
    title="Aucune notification"
    subtitle="Tu seras notifié des événements et mises à jour ici"
  />
) : (
```

- [ ] **Step 3: Supprimer les styles inutilisés**

Vérifier si `center`, `emptyText` sont encore référencés ailleurs dans le fichier. Si "Chargement..." / "Aucune notification" / `center` n'est utilisé que dans les blocs remplacés, supprimer les styles correspondants.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/screens/NotificationsScreen.js
git commit -m "feat: remplace etat vide inline par EmptyState sur NotificationsScreen"
```

---

### Task 5: EventSearchScreen — Ajouter les suggestions de recherche récentes

**Files:**
- Modify: `mobile/src/screens/EventSearchScreen.js`

**Contexte:** Quand le champ de recherche est vide, on veut afficher les recherches récentes (AsyncStorage, max 5) et les catégories populaires sous forme de chips. Quand l'utilisateur tape, comportement actuel.

- [ ] **Step 1: Créer le composant RecentSearchChips**

Créer `mobile/src/components/RecentSearchChips.jsx`:
```jsx
// Ligne horizontale de chips "Recherches récentes" avec icône clock et swipe-to-delete
// Props : recherches (string[]), onSelect (function), onDelete (function)
import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

export default function RecentSearchChips({ recherches, onSelect, onDelete }) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  if (!recherches || recherches.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recherches récentes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recherches.map((r, i) => (
          <TouchableOpacity
            key={`${r}-${i}`}
            style={styles.chip}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={13} color={colors.textSecondary} />
            <Text style={styles.chipText} numberOfLines={1}>{r}</Text>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onDelete(i)}
            >
              <Feather name="x" size={12} color={colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  label: {
    fontFamily: fonts.outfit.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginRight: spacing.sm,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: fonts.jakarta.medium,
    fontSize: 13,
    color: colors.text,
    maxWidth: 120,
  },
})
```

- [ ] **Step 2: Ajouter la gestion AsyncStorage dans EventSearchScreen**

Dans `EventSearchScreen.js`, ajouter près des imports:
```jsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import RecentSearchChips from '../components/RecentSearchChips'
```

Ajouter dans le corps du composant, après les useState existants:
```jsx
const RECHERCHES_KEY = '@senguichet_recent_searches'
const [recentSearches, setRecentSearches] = useState([])

// Charger les recherches récentes au focus
useFocusEffect(useCallback(() => {
  AsyncStorage.getItem(RECHERCHES_KEY).then(val => {
    if (val) setRecentSearches(JSON.parse(val))
  })
}, []))
```

- [ ] **Step 3: Ajouter les fonctions de gestion des recherches**

Ajouter avant le return:
```jsx
const ajouterRecherche = useCallback(async (query) => {
  const trimmed = query.trim()
  if (!trimmed) return
  const updated = [trimmed, ...recentSearches.filter(r => r !== trimmed)].slice(0, 5)
  setRecentSearches(updated)
  await AsyncStorage.setItem(RECHERCHES_KEY, JSON.stringify(updated))
}, [recentSearches])

const supprimerRecherche = useCallback(async (index) => {
  const updated = recentSearches.filter((_, i) => i !== index)
  setRecentSearches(updated)
  await AsyncStorage.setItem(RECHERCHES_KEY, JSON.stringify(updated))
}, [recentSearches])
```

- [ ] **Step 4: Lier la soumission de recherche à l'enregistrement**

Trouver où le state `search` est utilisé pour filtrer. Quand l'utilisateur tape "Rechercher" ou le texte est utilisé, ajouter l'appel à `ajouterRecherche`.

Modifier la fonction de filtre ou ajouter un `onSubmitEditing` sur le TextInput:
```jsx
onSubmitEditing={() => ajouterRecherche(search)}
```

- [ ] **Step 5: Afficher le composant RecentSearchChips dans la SearchHeader**

Modifier `SearchHeader` pour accepter les props `recentSearches`, `onRecentSelect`, `onRecentDelete`.

Ajouter dans `SearchHeader`, entre le `GlassContainer` de recherche et la `ScrollView` de catégories:
```jsx
{!search && (
  <RecentSearchChips
    recherches={recentSearches}
    onSelect={(q) => { setSearch(q); ajouterRecherche(q) }}
    onDelete={supprimerRecherche}
  />
)}
```

Et mettre à jour l'appel de `SearchHeader` dans le composant principal avec les nouvelles props.

- [ ] **Step 6: Ajuster le ListEmptyComponent**

Quand la recherche est vide mais qu'il y a des suggestions, on ne veut pas afficher "Aucun résultat". Modifier `ListEmptyComponent` pour montrer les suggestions seulement quand `search` est non vide:
```jsx
ListEmptyComponent={
  search.length > 0 ? (
    <EmptyState
      icon="🔍"
      title="Aucun résultat"
      subtitle="Essaie un autre mot-clé ou catégorie"
    />
  ) : null
}
```

- [ ] **Step 7: Commit**

```bash
git add mobile/src/components/RecentSearchChips.jsx mobile/src/screens/EventSearchScreen.js
git commit -m "feat: ajoute suggestions de recherche recentes sur EventSearchScreen"
```
