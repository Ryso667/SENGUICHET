# Fond dynamique acheteur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le fond d'écran du HomeScreen et EventSearchScreen dynamique : l'affiche de l'événement actif (centré dans le carousel / premier en haut dans la grille) devient l'arrière-plan.

**Architecture:** BlurBackground accepte déjà `afficheUrl` et `category`. On ajoute un état `activeEvent` dans chaque screen qui se met à jour au scroll via `onViewableItemsChanged` (carousel) ou `onMomentumScrollEnd` (grille). Pas de lib externe.

**Tech Stack:** React Native, Animated API, FlatList + ViewabilityConfig

---

### Task 1: EventCarousel — exposer l'index actif

**Files:**
- Modify: `mobile/src/components/EventCarousel.jsx`

- [ ] **Step 1: Ajouter la prop `onActiveIndexChange` et un ref pour tracker le dernier index notifié**

```js
// Après `const itemWidth = ...`
const lastIndexRef = useRef(-1)
```

- [ ] **Step 2: Ajouter le handler `onMomentumScrollEnd`**

```js
// Dans les props de Animated.ScrollView
onMomentumScrollEnd={Animated.event(
  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
  {
    useNativeDriver: true,
    listener: (event) => {
      if (!onActiveIndexChange) return
      const offsetX = event.nativeEvent.contentOffset.x
      const index = Math.round(offsetX / itemWidth)
      if (index !== lastIndexRef.current && index >= 0 && index < events.length) {
        lastIndexRef.current = index
        onActiveIndexChange(index)
      }
    },
  }
)}
```

- [ ] **Step 3: Mettre à jour la signature de la fonction et du destructuring**

```js
function EventCarousel({ events, onPress, onActiveIndexChange }) {
```

- [ ] **Step 4: Ajouter le test (vérification visuelle)**

Run: Vérifier que le carousel scroll et que `onActiveIndexChange` est appelé avec le bon index.

---

### Task 2: HomeScreen — fond dynamique depuis le carousel

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js`

- [ ] **Step 1: Ajouter `activeEvent` state (après `category`)**

```js
const [activeEvent, setActiveEvent] = useState(null)
```

- [ ] **Step 2: Initialiser `activeEvent` au chargement des événements**

```js
// Remplacer la ligne setCategory(formatted[0].category) par :
setCategory(formatted[0].category)
setActiveEvent(formatted[0])
```

- [ ] **Step 3: Ajouter le callback `onActiveIndexChange` au EventCarousel**

```js
<EventCarousel
  events={evenements}
  onPress={(event) => navigation.navigate('EventDetail', { eventId: event.id, event })}
  onActiveIndexChange={(index) => {
    const ev = evenements[index]
    if (ev) setActiveEvent(ev)
  }}
/>
```

- [ ] **Step 4: Mettre à jour BlurBackground pour utiliser `activeEvent`**

```js
// Remplacer ligne 70:
<BlurBackground
  category={activeEvent?.category || category}
  showImage={!!activeEvent?.affiche_url}
  afficheUrl={activeEvent?.affiche_url}
/>
```

---

### Task 3: EventSearchScreen — fond dynamique depuis la grille

**Files:**
- Modify: `mobile/src/screens/EventSearchScreen.js`

- [ ] **Step 1: Ajouter les imports FlatList, useMemo, useRef**

```js
import { useState, useCallback, useRef, useMemo } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, useWindowDimensions } from 'react-native'
```

- [ ] **Step 2: Ajouter `activeEvent` state, viewabilityConfig, useEffect et le handler**

```js
const [activeEvent, setActiveEvent] = useState(null)
// Memoizer filtered pour éviter les recréations à chaque render → useEffect stable
const filtered = useMemo(() => {
  return events.filter((e) => {
    const matchCat = activeCat === 'Tout' || e.category === activeCat
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })
}, [events, activeCat, search])

const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current

const onViewableItemsChanged = useRef(({ viewableItems }) => {
  if (viewableItems.length > 0) {
    const topItem = viewableItems[0]
    setActiveEvent(topItem.item)
  }
}).current

// Initialiser activeEvent au premier résultat filtré
useEffect(() => {
  if (filtered.length > 0) {
    setActiveEvent(filtered[0])
  }
}, [filtered])
```

- [ ] **Step 3: Remplacer le ScrollView + grid par FlatList avec numColumns**

```jsx
// Remplacer tout depuis `<ScrollView ...>` jusqu'à `</ScrollView>`
<FlatList
  data={filtered}
  renderItem={({ item, index }) => (
    <View style={{ width: (width - spacing.lg * 2 - 12) / 2, marginBottom: 12 }}>
      <AnimatedEventCard
        event={item}
        index={index}
        cardStyle={{ width: '100%', marginRight: 0 }}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      />
    </View>
  )}
  numColumns={2}
  keyExtractor={(item) => item.id?.toString()}
  columnWrapperStyle={styles.columnWrapper}
  contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.lg }}
  showsVerticalScrollIndicator={false}
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={viewabilityConfig}
  ListHeaderComponent={() => (
    <>
      <GlassContainer style={styles.searchBar} blurType="light" intensity={60}>
        <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Concert à Dakar..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Feather name="x" size={16} color="rgba(255,255,255,0.6)" onPress={() => setSearch('')} />
        )}
      </GlassContainer>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
        {CATEGORIES.map((cat) => (
          <GlassChip
            key={cat}
            label={cat}
            active={activeCat === cat}
            onPress={() => setActiveCat(cat)}
          />
        ))}
      </ScrollView>
    </>
  )}
  ListEmptyComponent={
    <EmptyState
      icon="search"
      title="Aucun résultat"
      subtitle="Essaie un autre mot-clé ou catégorie"
    />
  }
/>
```

- [ ] **Step 4: Mettre à jour le BlurBackground pour utiliser activeEvent**

```js
// Remplacer ligne 42:
<BlurBackground
  category={activeEvent?.category || (activeCat === 'Tout' ? null : activeCat)}
  showImage={!!activeEvent?.affiche_url}
  afficheUrl={activeEvent?.affiche_url}
/>
```

- [ ] **Step 5: Ajouter les nouveaux styles**

```js
// Dans StyleSheet.create, ajouter :
columnWrapper: {
  gap: 12,
},
```

- [ ] **Step 6: Supprimer les anciens styles inutilisés** (grid, scroll, scrollContent)

Supprimer `grid` du StyleSheet si plus utilisé.
