# Senguichet — Design UI/UX Premium, Dashboard & Ticket

## Date
2026-05-26

## Contexte
Feedback du boss après présentation de l'avancement :
1. UI/UX "plus jeune et premium"
2. Dashboard événement : tickets vendus par type, tickets scannés par type, numérotation des tickets
3. Exemple visuel d'un ticket
4. Question sur le logo

## Approche retenue : Évolution ciblée (Approche A)
On garde la structure existante (3 rôles, navigation, thème Iris & Rose) et on améliore par-dessus sans réécrire.

---

## 1. Design System Premium "Jeune & Premium"

### Palette élargie
- **Primaire** : `#6366F1` (Indigo/Iris) — inchangé
- **Secondaire** : `#EC4899` (Rose) — inchangé
- **Fond** : `#F8F9FD` → conserve mais ajoute un **dégradé hero subtil** (indigo→rose à 3% d'opacité en fond)
- **Glassmorphisme** : `rgba(255,255,255,0.7)` + `backdrop-filter: blur(20px)` pour cartes premium
- **Ombres colorées** : remplacer `rgba(15,23,42,0.1)` par des ombres teintées (indigo/rose selon la carte)
- **Nouveaux dégradés** :
  - Acheteur : `#6366F1` → `#06B6D4` (Indigo → Cyan)
  - Scanner : `#8B5CF6` → `#EC4899` (Violet → Rose)
  - Organisateur : `#EC4899` → `#F97316` (Rose → Orange)

### Typographie
- **Outfit Bold** pour les titres (inchangé)
- **Plus Jakarta Sans** pour le corps (inchangé)
- Taille des titres augmentée : `32px` pour les screens hero, `20px` pour les cartes

### Composants revisitée

**Cartes (glassmorphisme)** :
```
background: rgba(255,255,255,0.7)
backdrop-filter: blur(20px)
borderRadius: 20
border: 1px solid rgba(255,255,255,0.3)
```

**Boutons** :
- Dégradé Indigo → Rose conservé
- Ajout effet `scale(0.95)` au press avec `Animated.spring()`

**Micro-interactions** :
- Cartes : apparition avec `Animated.timing`, décalage de 80ms entre chaque carte
- Navigation : transitions stack conservées (native)
- Pull-to-refresh : personnalisé avec cercle indigo

### Écran AccueilChoix (3 cartes rôles)
- Chaque carte : fond en **dégradé plein écran** (pas juste icône)
- Grande illustration/emoji centré (taille 48px)
- Titre en blanc, description en blanc/70%
- Carte occupe ~30% de l'écran verticalement
- Pas de lien "Déjà un compte"

---

## 2. Dashboard Organisateur — Statistiques événement

### Modèle de données (état initial, stocké AsyncStorage côté mobile)
```javascript
{
  id: string,
  nom: string,
  date: string,
  categories: [{ nom: string, prix: number, capacite: number }],
  tickets: [{
    id: string,          // "TKT-001", "TKT-002", ...
    categorie: string,
    prix: number,
    telephone: string,
    statut: 'valide' | 'utilise' | 'expire',
    dateAchat: string,
    dateScan: string | null,
    numero: string       // Numéro de ticket unique (important pour physique)
  }],
  scans: [{ ticketId, statut, date }]
}
```

### Vues Dashboard

**En-tête** : Dégradé Indigo→Rose avec nom événement + date

**3 cartes stats (glassmorphisme)** :
- 🎟️ Tickets vendus : `N` (total + par catégorie)
- 📸 Tickets scannés : `N` (total + par catégorie)
- 💰 Recettes : `N CFA`

**Section "Ventes par type"** :
- Barres horizontales colorées par catégorie
- `Catégorie: X vendus / Y capacité`

**Section "Scans par type"** :
- Barres similaires
- `Catégorie: X scannés / Y vendus`

**Liste des tickets avec numérotation** :
- Chaque ligne : numéro (TKT-001), catégorie, téléphone, statut (badge coloré)
- Badge : Valide (vert) / Utilisé (gris) / Expiré (rouge)
- Numéro mis en évidence pour faciliter le matching avec tickets physiques

### Numérotation des tickets
- Format : `TKT-{ÉVÉNEMENT}-{NUMÉRO}` ex: `TKT-FEST-001`
- Incrémentation automatique
- Visible dans la liste ET sur le ticket (pour matching physique)

---

## 3. Ticket Premium

### Design visuel du ticket

```
┌─────────────────────────┐
│  🎵 DAKAR MUSIC FEST    │  ← En-tête dégradé
│  15 Juin 2026 • 20h     │
├─────────────────────────┤
│                         │
│       [===QR CODE===]   │
│                         │
│      TKT-FEST-001       │  ← Numéro unique (gras)
│                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │  ← Ligne perforation (pointillés)
│                         │
│  Catégorie  │ VIP       │  ← Grille 2×2
│  Prix       │ 25 000 CFA│
│  Téléphone  │ +221 ...  │
│  Statut     │ ✓ VALIDE  │
│                         │
└─────────────────────────┘
```

### Couleurs
- En-tête : Dégradé Indigo → Rose
- Fond ticket : Blanc pur
- Bords arrondis : `24px`
- Ombre portée : ombre colorée indigo
- Perforation : `border-top: 2px dashed #CBD5E1`

### Statuts
- VALIDE : badge vert néon `#10B981`
- UTILISÉ : badge gris `#94A3B8`
- EXPIRÉ : badge rouge `#EF4444`

---

## 4. Logo

Générer un logo temporaire en SVG :
- Icône : un billet / ticket stylisé avec une vague ou une note de musique
- Couleurs : Iris `#6366F1` → Rose `#EC4899`
- Texte : "SENGUICHET" en Outfit Bold
- Format : SVG, adaptable pour splash screen et header

---

## Implémentation (ordre)

1. **Design system** : mise à jour `theme.js` (glassmorphisme, ombres, dégradés)
2. **AccueilChoixScreen** : redesign des 3 cartes avec dégradés
3. **Dashboard organisateur** : stats réelles avec catégories, barres, numérotation
4. **Ticket premium** : redesign du visuel ticket + numérotation
5. **Logo** : génération SVG
6. **Micro-interactions** : animations (entrée cartes, press boutons)
