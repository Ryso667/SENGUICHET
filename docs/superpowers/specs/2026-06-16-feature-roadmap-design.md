# Roadmap Fonctionnalités — SENGUICHET

**Date :** 16 Juin 2026  
**Auteur :** Brainstorming collaboratif  
**Statut :** Spécification validée  

---

## 1. Page d'accueil

### 1.1 Section "Incontournables"
- Top 3 événements les plus vendus, mis en avant avec un badge "🔥 Incontournable"
- Données : un nouveau champ `popularite` (score basé sur ventes) sur l'API événements
- Fallback : si pas assez de données, afficher les 3 premiers événements

### 1.2 Filtres enrichis
- Ajouter un filtre par **période** : aujourd'hui / cette semaine / ce mois
- Les chips deviennent scrollables horizontalement (déjà le cas) avec une ligne supplémentaire
- ~~Filtre gratuit/payant~~ retiré (non pertinent pour une billetterie payante)

### 1.3 Vue calendrier
- Bouton bascule "Liste" ↔ "Calendrier" en haut à droite
- Vue calendrier mensuel avec pastilles colorées pour les jours avec événements
- Tap sur un jour → affiche la liste des événements de ce jour

### 1.4 Événements à proximité
- Section géolocalisée "Près de chez toi"
- Permission de localisation demandée une seule fois
- Calcule la distance et filtre dans un rayon de 50 km
- Afficher la distance sur chaque carte (ex: "À 3 km")

### 1.5 Suggestions personnalisées
- Section "Ça pourrait te plaire" basée sur les catégories d'achats précédents
- Si l'utilisateur n'a pas d'historique, ne pas afficher la section

### 1.6 Compte à rebours
- Timer affiché sur la carte des événements à venir dans les 7 jours
- Format : "Dans 2j 14h" ou "Demain" ou "Aujourd'hui"

---

## 2. Acheteur

### 2.1 Favoris ❤️
- Icône cœur sur chaque carte événement (Home, Explorer, EventDetail)
- Tap toggles le statut favori
- Stockage local : AsyncStorage (clé `favoris_<id>`)
- Nouvel onglet ou section "Mes favoris" dans Profil ou MesTickets
- Heart animation (scale bounce)

### 2.2 Partage d'événement
- Bouton "Partager" sur EventDetail (icône share)
- Utilise `Share` API de React Native
- Message : "🎫 [Titre] — [Date] à [Lieu] sur SENGUICHET"
- Lien profond ou URL publique de l'événement

### 2.3 Ajouter au calendrier natif
- Bouton "Ajouter au calendrier" sur EventDetail
- Utilise `expo-calendar`
- Crée un événement avec titre, date, lieu, note

### 2.4 Historique des achats
- Dans MesTickets, onglets : "Actifs" | "Passés"
- Les billets passés (date dépassée) sont archivés mais visibles

### 2.5 Scanner pour entrée
- L'acheteur peut présenter son QR code depuis l'app (déjà fait dans TicketScreen)
- Option : agrandir le QR en plein écran au tap

---

## 3. Organisateur

### 3.1 Export CSV des ventes
- Bouton "Exporter" sur DetailEvenementScreen
- Génère un CSV avec : nom, email, catégorie, prix, date d'achat, statut
- Partagé via `Share` API ou téléchargé

### 3.2 Statistiques avancées
- Graphiques interactifs dans StatistiquesScreen : ventes par jour/semaine, répartition par catégorie, taux de remplissage
- Données via API dédiée `/evenements/:id/stats`

### 3.3 Aperçu billet
- Depuis VoirTicketsScreen, tap sur un billet → aperçu visuel du QR
- Utile pour tester le scan

---

## 4. Général transverse

### 4.1 Mode sombre 🌙
- ThemeContext avec `light` / `dark`
- Détection automatique du système (`useColorScheme`)
- Toggle manuel dans Profil → Paramètres
- Palette dark : fond `#0F172A`, surface `#1E293B`, texte `#F1F5F9`
- Tous les composants reactifs au thème

### 4.2 Notifications push
- Expo Notifications (expo-notifications)
- Permission demandée au premier lancement
- Notifications : rappel J-1 avant événement acheté, confirmation d'achat
- Backend : endpoint pour envoyer des push tokens

### 4.3 Badge d'icône
- Badge sur l'icône de l'app pour les notifications non lues

---

## Priorité d'implémentation

| Priorité | Fonctionnalité | Effort | Impact |
|----------|---------------|--------|--------|
| 🥇 | Favoris ❤️ | Faible | Très fort |
| 🥇 | Partage d'événement | Faible | Fort |
| 🥇 | Filtres enrichis | Faible | Fort |
| 🥈 | Suggestions personnalisées | Moyen | Fort |
| 🥈 | Ajout calendrier natif | Faible | Moyen |
| 🥈 | Export CSV | Faible | Moyen (orga) |
| 🥈 | Statistiques avancées | Moyen | Fort (orga) |
| 🥉 | Mode sombre | Élevé | Très fort |
| 🥉 | Notifications push | Moyen | Fort |
| 🥉 | Vue calendrier | Moyen | Moyen |

---

**Décision :** On commence par les Favoris.
