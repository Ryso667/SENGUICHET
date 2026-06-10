# EventDetailScreen Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign EventDetailScreen avec glass plus léger, modal simplifié, téléphone dans le modal, couleurs alignées sur le thème terracotta.

**Architecture:** Modifications dans un seul fichier (`EventDetailScreen.js`) — couleurs, intensités glass, et structure du modal. Pas de nouveau composant.

**Tech Stack:** React Native, expo-blur, expo-linear-gradient, react-native-masked-view/masked-view

---

### Task 1: Aligner les couleurs du hero sur le thème terracotta

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js:258,260,265,269,270,289,290,363,364,409,410,424,474,475`

- [ ] **Step 1: Remplacer les couleurs bleues par le terracotta**

```js
// Remplacer heroCategory color (L258)
// Avant: <Text style={[styles.heroCategory, { color: '#06B6D4' }]}>
// Après: <Text style={[styles.heroCategory, { color: colors.accent }]}>

// Remplacer LinearGradient du titre (L260)
// Avant: <LinearGradient colors={['#2563EB', '#06B6D4']}
// Après: <LinearGradient colors={['#C7513A', '#D4835A']}

// Remplacer heroDivider backgroundColor (L265)
// Avant: { backgroundColor: '#2563EB' }
// Après: { backgroundColor: colors.accent }

// Remplacer heroIconBadge backgroundColor (L269, L289)
// Avant: { backgroundColor: hexToRgba('#2563EB', 0.15) }
// Après: { backgroundColor: hexToRgba(colors.accent, 0.15) }

// Remplacer LinearGradient du bouton Acheter (L363-364)
// Avant: colors={['#2563EB', '#06B6D4']}
// Après: colors={gradients.primary} (déjà défini dans theme.js)
// Ou: colors={['#C7513A', '#B84530']}

// Remplacer sheet item selected (L409-410)
// Avant: backgroundColor: 'rgba(37,99,235,0.2)', borderColor: '#2563EB'
// Après: backgroundColor: hexToRgba(colors.accent, 0.2), borderColor: colors.accent

// Remplacer sheetCheck backgroundColor (L424)
// Avant: { backgroundColor: '#2563EB' }
// Après: { backgroundColor: colors.accent }

// Remplacer payAmountCard borderColor (L474)
// Avant: { borderColor: hexToRgba('#2563EB', 0.27) }
// Après: { borderColor: hexToRgba(colors.accent, 0.27) }

// Remplacer payAmountValue color (L475)
// Avant: { color: '#1AB3E5' }
// Après: { color: colors.textWhite }
```

- [ ] **Step 2: Vérifier les changements**

Lire le fichier et confirmer qu'aucune occurrence de `#2563EB` ou `#06B6D4` ne subsiste dans les styles (le fond BlurBackground par catégorie n'est pas concerné).

### Task 2: Réduire l'intensité du glass

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js`

- [ ] **Step 1: Réduire intensity sur tous les GlassContainer**

Rechercher les usages de `<GlassContainer` dans EventDetailScreen.js :

```js
// L268 — heroDateCard
// Avant: <GlassContainer style={styles.heroDateCard}>
// Après: inchangé (le default intensity={70} sera changé dans GlassContainer ou ici)

// L288 — heroLocationCard
// L303 — descCard
// L318 — categorySelector
// L353 — bottomBarTotal
// L393 — sheetContainer
// L405 — sheetItem
// L461 — paySheetContainer
```

Ajouter `intensity={30}` explicitement sur chaque GlassContainer de EventDetailScreen :

```js
// Exemple pour heroDateCard (L268)
<GlassContainer intensity={30} style={styles.heroDateCard}>
```

Ne PAS changer le `intensity={90}` du bottomBar BlurView.

- [ ] **Step 2: Vérifier**

Confirmer que tous les `<GlassContainer` (sauf bottomBarTotal qui a déjà intensity={30}) ont bien l'intensity réduite.

### Task 3: Simplifier le fond du modal de paiement

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js:444-449`

- [ ] **Step 1: Remplacer le fond dégradé du modal par un overlay simple**

```js
// Remplacer le LinearGradient plein écran du paySheetOverlay (L444-449)
// Avant:
<View style={styles.paySheetOverlay}>
  <LinearGradient
    colors={categoryGradients[event?.category] || categoryGradients.default}
    style={StyleSheet.absoluteFill}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  />
  
// Après:
<View style={styles.paySheetOverlay}>
  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
```

Faire la même chose pour `sheetOverlay` (L382-387).

- [ ] **Step 2: Vérifier**

Aucun `LinearGradient` ne sert de fond plein écran dans les modals.

### Task 4: Déplacer le champ téléphone dans le modal de paiement

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.js:334-347` (supprimer de la page), `470-478` (ajouter dans le modal)

- [ ] **Step 1: Supprimer le champ téléphone de la page principale**

```js
// Supprimer ces lignes (L334-347) :
// <Text style={styles.formLabel}>Téléphone</Text>
// <GlassContainer style={styles.formPhoneRow}>... </GlassContainer>
```

- [ ] **Step 2: Ajouter le champ téléphone dans le modal de paiement**

Après la carte de montant (`payAmountCard`) et avant le bouton Wave :

```js
// Après la section payAmountCard (L478 environ), avant le confirmPayBtn (L481)
<Text style={styles.modalPhoneLabel}>Ton téléphone</Text>
<GlassContainer intensity={30} style={styles.modalPhoneRow}>
  <Feather name="smartphone" size={16} color={colors.textWhiteMuted} />
  <Text style={styles.modalPhoneCode}>+221</Text>
  <TextInput
    style={styles.modalPhoneInput}
    value={telephone}
    onChangeText={(t) => setTelephone(formaterTel(t))}
    keyboardType="phone-pad"
    placeholder="77 XXX XX XX"
    placeholderTextColor={colors.textWhiteMuted}
  />
</GlassContainer>
```

- [ ] **Step 3: Ajouter les styles du téléphone dans le modal**

```js
// Ajouter dans StyleSheet :
modalPhoneLabel: {
  fontFamily: fonts.jakarta.semiBold,
  fontSize: 12,
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  marginBottom: spacing.sm,
  marginTop: spacing.sm,
  alignSelf: 'flex-start',
  width: '100%',
},
modalPhoneRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 14,
  paddingVertical: 4,
  width: '100%',
  marginBottom: spacing.md,
},
modalPhoneCode: {
  fontFamily: fonts.jakarta.semiBold,
  fontSize: 15,
  color: colors.textWhiteMuted,
},
modalPhoneInput: {
  flex: 1,
  fontSize: 15,
  fontFamily: fonts.jakarta.semiBold,
  color: colors.textWhite,
  paddingVertical: 10,
},
```

### Task 5: Commit

- [ ] **Step 1: Commit les changements**

```bash
git add mobile/src/screens/EventDetailScreen.js
git commit -m "refactor: redesign EventDetailScreen - glass léger, modal simplifié, téléphone déplacé, couleurs terracotta"
```
