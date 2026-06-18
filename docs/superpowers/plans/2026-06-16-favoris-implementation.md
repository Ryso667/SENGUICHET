# Favoris ❤️ — Plan d'implémentation

> **Pour les workers agentic :** Utiliser `subagent-driven-development` (recommandé) ou `executing-plans` pour implémenter tâche par tâche.

**Objectif :** Ajouter un système de favoris ❤️ sur les événements (toggle cœur, stockage local AsyncStorage, liste dédiée).

**Architecture :** Stockage local AsyncStorage (pas d'API backend). Le bouton cœur est un composant réutilisable `FavoriButton` placé sur AnimatedEventCard, HomeScreen (cartes locales) et EventDetailScreen. Une nouvelle screen `MesFavorisScreen` liste les événements favoris, accessible depuis ProfilScreen.

**Tech Stack :** React Native, AsyncStorage, expo-haptics, MaterialCommunityIcons, Animated API

---

### Tâche 1 : Utilitaire FavorisStorage

**Fichier :**
- Créer : `mobile/src/utils/favorisStorage.js`

- [ ] **Étape 1 : Créer le module FavorisStorage**

```javascript
// Service de stockage des favoris ❤️
// Utilise AsyncStorage pour persister localement les IDs et données des événements favoris
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@senguichet_favoris'

// Récupère tous les favoris stockés
export async function getAllFavoris() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Récupère la liste des IDs favoris
export async function getFavorisIds() {
  const favoris = await getAllFavoris()
  return Object.keys(favoris)
}

// Vérifie si un événement est favori
export async function estFavori(eventId) {
  const ids = await getFavorisIds()
  return ids.includes(String(eventId))
}

// Bascule le statut favori d'un événement
// eventData : { id, title, date, location, category, affiche_url, emoji, month, day }
// Retourne le nouveau statut (true = favori, false = retiré)
export async function basculerFavori(eventId, eventData = {}) {
  const favoris = await getAllFavoris()
  const key = String(eventId)
  if (favoris[key]) {
    delete favoris[key]
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoris))
    return false
  } else {
    favoris[key] = {
      id: eventId,
      ...eventData,
      dateAjout: new Date().toISOString(),
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoris))
    return true
  }
}
```

- [ ] **Étape 2 : Vérifier la syntaxe (pas de test unitaire — AsyncStorage nécessite un mock)**

---

### Tâche 2 : Composant FavoriButton

**Fichier :**
- Créer : `mobile/src/components/FavoriButton.jsx`

- [ ] **Étape 1 : Créer le composant FavoriButton**

```javascript
// Bouton cœur favori ❤️ avec animation bounce et haptique
// Props : eventId (string/number requis), eventData (object optionnel pour stockage)
//         size (number, défaut 22), onToggle (callback optionnel)
import { useRef, useState, useEffect } from 'react'
import { TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../constants/theme'
import { estFavori, basculerFavori } from '../utils/favorisStorage'
import { hapticSelection } from '../utils/haptics'

export default function FavoriButton({ eventId, eventData = {}, size = 22, onToggle, style }) {
  const [estActif, setEstActif] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    estFavori(eventId).then(setEstActif)
  }, [eventId])

  const handlePress = async () => {
    hapticSelection?.()
    const nouveauStatut = await basculerFavori(eventId, eventData)
    setEstActif(nouveauStatut)
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, friction: 3, tension: 200 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3, tension: 200 }),
    ]).start()
    onToggle?.(nouveauStatut)
  }

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={10} style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialCommunityIcons
          name={estActif ? 'heart' : 'heart-outline'}
          size={size}
          color={estActif ? colors.red : 'rgba(255,255,255,0.8)'}
        />
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
})
```

Note : sur fond clair (HomeScreen `renderEventCard`), il faudra passer une couleur différente pour le cœur inactif via `color` dans le style. On gère ça avec un prop optionnel `inactiveColor`.

- [ ] **Étape 2 : Ajouter le prop `inactiveColor` au composant**

Modifier la ligne de couleur inactif :

```javascript
color={estActif ? colors.red : inactiveColor}
```

Et dans les props :

```javascript
export default function FavoriButton({ eventId, eventData = {}, size = 22, inactiveColor = 'rgba(255,255,255,0.8)', onToggle, style }) {
```

---

### Tâche 3 : Ajouter le bouton favori à AnimatedEventCard

**Fichier :**
- Modifier : `mobile/src/components/AnimatedEventCard.jsx`

- [ ] **Étape 1 : Importer FavoriButton**

Ajouter après l'import `useSpringAnimation` :

```javascript
import FavoriButton from './FavoriButton'
```

- [ ] **Étape 2 : Ajouter FavoriButton dans le rendu**

Ajouter après la `passeBadge` (ligne 85 environ) et avant l'icône/emoji de catégorie :

```javascript
          <FavoriButton
            eventId={event.id}
            eventData={{
              title: event.title,
              date: event.date,
              location: event.location,
              category: event.category,
              affiche_url: event.affiche_url,
              month: event.month,
              day: event.day,
              emoji: event.emoji,
              priceLabel: event.priceLabel,
            }}
            size={20}
            style={styles.favoriBtn}
          />
```

- [ ] **Étape 3 : Ajouter le style du bouton favori**

Position absolue en haut à droite, légèrement décalé de l'emoji :

```javascript
  favoriBtn: {
    position: 'absolute',
    right: 10,
    top: 38,
  },
```

(Ajouter dans l'objet `styles`)

---

### Tâche 4 : Ajouter le bouton favori à HomeScreen (renderEventCard)

**Fichier :**
- Modifier : `mobile/src/screens/HomeScreen.js`

- [ ] **Étape 1 : Importer FavoriButton**

```javascript
import FavoriButton from '../components/FavoriButton'
```

- [ ] **Étape 2 : Ajouter FavoriButton dans renderEventCard**

Dans la fonction `renderEventCard`, ajouter le bouton cœur dans le `eventCardImage`, après la View `eventCardBadge` (ligne 65) :

```javascript
        <FavoriButton
          eventId={item.id}
          eventData={{
            title: item.title,
            date: item.date,
            location: item.lieu,
            category: item.category,
            affiche_url: item.affiche_url,
            month: item.month,
            day: item.day,
            emoji: item.emoji,
            priceLabel: item.priceLabel,
          }}
          size={20}
          inactiveColor={colors.textTertiary}
          style={styles.favoriBtn}
        />
```

Et importer `colors` en haut :

```javascript
import { spacing, colors } from '../constants/theme'
```

- [ ] **Étape 3 : Ajouter le style**

```javascript
  favoriBtn: {
    position: 'absolute',
    top: 8,
    left: 10,
    zIndex: 10,
  },
```

---

### Tâche 5 : Ajouter le bouton favori à EventDetailScreen

**Fichier :**
- Modifier : `mobile/src/screens/EventDetailScreen.js`

- [ ] **Étape 1 : Importer FavoriButton**

```javascript
import FavoriButton from '../components/FavoriButton'
```

- [ ] **Étape 2 : Ajouter FavoriButton à côté du bouton retour**

Après `floatingBack` (ligne 221), ajouter :

```javascript
      <FavoriButton
        eventId={event?.id}
        eventData={{
          title: event?.title,
          date: event?.date,
          location: event?.lieu,
          category: event?.category,
          affiche_url: event?.affiche_url,
        }}
        size={24}
        style={[styles.floatingFavori, { top: insets.top + 8 }]}
      />
```

- [ ] **Étape 3 : Ajouter le style floatingFavori**

```javascript
  floatingFavori: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
```

---

### Tâche 6 : Créer MesFavorisScreen

**Fichier :**
- Créer : `mobile/src/screens/MesFavorisScreen.jsx`

- [ ] **Étape 1 : Créer l'écran**

```javascript
// Écran Mes favoris ❤️
// Liste les événements favoris stockés localement dans AsyncStorage
// Chaque item : titre, date, image, bouton cœur pour retirer
// Tap sur un item → navigue vers EventDetail
import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { getAllFavoris, basculerFavori } from '../utils/favorisStorage'
import { formaterDateLisible } from '../utils/dateUtils'

export default function MesFavorisScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [favoris, setFavoris] = useState([])

  useFocusEffect(
    useCallback(() => {
      chargerFavoris()
    }, [])
  )

  const chargerFavoris = async () => {
    const data = await getAllFavoris()
    setFavoris(Object.values(data).reverse()) // plus récent d'abord
  }

  const retirerFavori = async (eventId) => {
    await basculerFavori(eventId)
    chargerFavoris()
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        {item.affiche_url ? (
          <Image source={{ uri: item.affiche_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.cardEmoji}>{item.emoji || '\uD83C\uDFAB'}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDate}>
          {item.date ? formaterDateLisible(item.date) : ''}
        </Text>
        {item.location && (
          <View style={styles.cardLocation}>
            <Feather name="map-pin" size={12} color={colors.textTertiary} />
            <Text style={styles.cardLocationText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => retirerFavori(item.id)}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="heart" size={22} color={colors.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={{ width: 36 }} />
      </View>
      {favoris.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={56} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptySub}>Ajoute des événements en cœur pour les retrouver ici</Text>
        </View>
      ) : (
        <FlatList
          data={favoris}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.text },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { marginRight: spacing.md },
  cardImage: { width: 56, height: 56, borderRadius: borderRadius.md, resizeMode: 'cover' },
  cardImagePlaceholder: { width: 56, height: 56, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 24 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontFamily: fonts.outfit.bold, color: colors.text },
  cardDate: { fontSize: 12, fontFamily: fonts.jakarta.regular, color: colors.textSecondary },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocationText: { fontSize: 11, fontFamily: fonts.jakarta.regular, color: colors.textTertiary, flex: 1 },
  heartBtn: { padding: 4, marginLeft: spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.outfit.bold, color: colors.text, marginTop: spacing.md },
  emptySub: { fontSize: 13, fontFamily: fonts.jakarta.regular, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
})
```

---

### Tâche 7 : Ajouter MesFavorisScreen à la navigation

**Fichier :**
- Modifier : `mobile/src/navigation/AppNavigator.js`

- [ ] **Étape 1 : Importer MesFavorisScreen**

```javascript
import MesFavorisScreen from '../screens/MesFavorisScreen'
```

- [ ] **Étape 2 : Ajouter la screen dans GuestNavigator**

Après `Notifications` :

```javascript
      <Stack.Screen name="MesFavoris" component={MesFavorisScreen} options={header('Mes favoris')} />
```

---

### Tâche 8 : Ajouter "Mes favoris" dans ProfilScreen

**Fichier :**
- Modifier : `mobile/src/screens/ProfilScreen.jsx`

- [ ] **Étape 1 : Ajouter un bouton "Mes favoris" dans la section acheteur**

Entre le bouton "Mes billets" (ligne 73) et le bouton "Espace organisateur" (ligne 74), ajouter :

```javascript
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MesFavoris')}>
            <MaterialCommunityIcons name="heart-outline" size={20} color={colors.red} />
            <Text style={styles.actionBtnText}>Mes favoris</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
```

Ajouter l'import de `MaterialCommunityIcons` :

```javascript
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
```

---

### Auto-review

**Couverture du spec :**
- Icône cœur sur HomeScreen (renderEventCard) ✅ (Tâche 4)
- Icône cœur sur EventCarousel via AnimatedEventCard ✅ (Tâche 3)
- Icône cœur sur EventDetailScreen ✅ (Tâche 5)
- Tap toggles le statut favori ✅ (Tâche 2)
- Stockage local AsyncStorage ✅ (Tâche 1)
- Section "Mes favoris" accessible depuis Profil ✅ (Tâche 8)
- Heart animation (scale bounce) ✅ (Tâche 2)
- Liste des favoris ✅ (Tâche 6)
- Navigation vers EventDetail depuis un favori ✅ (Tâche 6)

**Placeholders :** Aucun.

**Cohérence des types :** `basculerFavori(eventId, eventData)` est utilisé partout de la même manière. `getAllFavoris()` retourne `{ [id]: eventData }`.

**Vérification :** Le composant `FavoriButton` utilise `useEffect` pour initialiser l'état depuis AsyncStorage — nécessite que le composant soit monté (pas de SSR issue en RN). Les props `eventData` passées depuis chaque écran incluent les champs nécessaires pour `MesFavorisScreen`.
