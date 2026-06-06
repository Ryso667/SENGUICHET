# Spec : Fond dynamique acheteur (carousel + grille)

## Résumé

L'arrière-plan du HomeScreen et de l'EventSearchScreen change dynamiquement pour afficher l'affiche (`affiche_url`) de l'événement actuellement visible ou centré, créant un effet immersif lors du défilement.

## Écrans concernés

- `mobile/src/screens/HomeScreen.js` — carousel horizontal `EventCarousel`
- `mobile/src/screens/EventSearchScreen.js` — grille verticale 2 colonnes

## Principe général

Chaque screen maintient un état `activeEvent` (id, affiche_url, category) initialisé au premier événement. `BlurBackground` reçoit ces props dynamiquement. Au scroll, l'événement visible/centré devient l'event actif → le fond se met à jour.

## HomeScreen (carousel)

- Ajouter un état `activeEvent` initialisé au premier élément de `evenements`
- Le carousel expose un callback `onActiveIndexChange(index)` via `onViewableItemsChanged` (seuil 60%)
- Quand l'index change : `setActiveEvent(evenements[index])`
- `BlurBackground` reçoit `category={activeEvent.category}` et `afficheUrl={activeEvent.affiche_url}`
- Effet de transition : React Native gère le changement d'URL image nativement (image load)

## EventSearchScreen (grille)

- Ajouter un état `activeEvent` initialisé au premier élément de `eventsFiltres`
- `FlatList` utilise `onViewableItemsChanged` avec `viewAreaCoveragePercentThreshold: 60`
- L'event actif = le premier item du haut qui est ≥ 60% visible
- `BlurBackground` reçoit `category={activeEvent.category}` et `afficheUrl={activeEvent.affiche_url}`

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `mobile/src/screens/HomeScreen.js` | + activeEvent state, + viewabilityConfig, event carousel callback |
| `mobile/src/screens/EventSearchScreen.js` | + activeEvent state, + viewabilityConfig, + onViewableItemsChanged |
| `mobile/src/components/EventCarousel.jsx` | Exposer `onActiveIndexChange` callback via `onViewableItemsChanged` |

## Détails techniques

- `viewabilityConfig` : `{ itemVisiblePercentThreshold: 60 }` — l'item est "actif" quand ≥ 60% visible
- Pas de lib externe supplémentaire — `onViewableItemsChanged` est une API native de FlatList
- `BlurBackground` accepte déjà `category` et `afficheUrl` en props, aucun changement nécessaire
- Fallback : si l'event actif n'a pas d'`affiche_url`, le gradient par catégorie reste affiché
