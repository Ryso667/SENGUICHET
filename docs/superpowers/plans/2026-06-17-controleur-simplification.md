# Simplification Contrôleur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'interface contrôleur non technique — messages simples, 0 bouton, historique lecture seule

**Architecture:** Modifications uniquement dans les écrans contrôleur (3 fichiers) + messages dans scanService. La logique offline/sync reste inchangée.

**Tech Stack:** React Native, Expo, SQLite

---

### Task 1: Simplifier les messages de scan

**Files:**
- Modify: `mobile/src/services/scanService.js:59-99`
- Modify: `mobile/src/screens/controleur/ScannerScreen.jsx:21-27,191-192`

- [ ] **Step 1: Simplifier les messages retournés par `verifierBillet()`**

Remplacer les messages techniques dans `scanService.js` :

```javascript
// Dans les `return { resultat: ..., message: ... }` de verifierBillet()
// Ligne 71 : Remplacer
return { resultat: RESULTATS.FRAUDE, message: 'Signature cryptographique invalide — alerte fraude' }
// Par
return { resultat: RESULTATS.FRAUDE, message: 'QR code falsifié 🚫' }

// Ligne 79 : Remplacer
return { resultat: RESULTATS.EXPIRE, message: 'QR code expiré — veuillez rafraîchir le billet' }
// Par
return { resultat: RESULTATS.EXPIRE, message: 'QR code expiré ⏳' }

// Ligne 87 : Remplacer
return { resultat: RESULTATS.INCONNU, message: 'Billet introuvable dans la base locale' }
// Par
return { resultat: RESULTATS.INCONNU, message: 'Billet non trouvé ❓' }

// Ligne 93 : Remplacer
return { resultat: RESULTATS.DEJA_UTILISE, message: 'Billet déjà scanné sur cet appareil' }
// Par
return { resultat: RESULTATS.DEJA_UTILISE, message: 'Déjà scanné ⚠️' }

// Ligne 98 : Remplacer
return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée' }
// Par (déjà simple, on garde)
return { resultat: RESULTATS.VALIDE, message: 'Entrée autorisée ✅' }
```

- [ ] **Step 2: Mettre à jour les labels COULEURS dans ScannerScreen.jsx**

Remplacer le bloc `COULEURS` (lignes 21-27) :

```javascript
const COULEURS = {
  VALIDE: { fond: '#66BB6A', icone: 'check-circle', label: 'Entrée autorisée ✅' },
  DEJA_UTILISE: { fond: '#FFA726', icone: 'alert-circle', label: 'Déjà scanné ⚠️' },
  EXPIRE: { fond: '#FF4D6D', icone: 'clock-outline', label: 'QR code expiré ⏳' },
  INCONNU: { fond: '#FF4D6D', icone: 'help-circle', label: 'Billet non trouvé ❓' },
  FRAUDE: { fond: '#FF4D6D', icone: 'alert-octagon', label: 'QR code falsifié 🚫' },
}
```

- [ ] **Step 3: Supprimer le message technique en sous-titre du résultat**

Dans `ScannerScreen.jsx`, ligne 169, supprimer la ligne :

```javascript
// AVANT (lignes 165-171) :
{scanne && (
  <View style={[styles.resultat, { backgroundColor: (COULEURS[scanne.resultat] || COULEURS.INCONNU).fond }]}>
    <MaterialCommunityIcons name={(COULEURS[scanne.resultat] || COULEURS.INCONNU).icone} size={scale(64)} color="#fff" />
    <Text style={styles.resultatMessage}>{(COULEURS[scanne.resultat] || COULEURS.INCONNU).label}</Text>
    {scanne.message && <Text style={styles.resultatDetail}>{scanne.message}</Text>}
  </View>
)}

// APRÈS :
{scanne && (
  <View style={[styles.resultat, { backgroundColor: (COULEURS[scanne.resultat] || COULEURS.INCONNU).fond }]}>
    <MaterialCommunityIcons name={(COULEURS[scanne.resultat] || COULEURS.INCONNU).icone} size={scale(64)} color="#fff" />
    <Text style={styles.resultatMessage}>{(COULEURS[scanne.resultat] || COULEURS.INCONNU).label}</Text>
  </View>
)}
```

- [ ] **Step 4: Supprimer `resultatDetail` des styles (plus utilisé)**

Dans `ScannerScreen.jsx`, ligne 192, supprimer :

```javascript
// Supprimer cette ligne de makeStyles
resultatDetail: { fontFamily: fonts.outfit.regular, fontSize: fontScale(14), color: 'rgba(255,255,255,0.8)', marginBottom: scale(32) },
```

---

### Task 2: Simplifier le Dashboard contrôleur

**Files:**
- Modify: `mobile/src/screens/controleur/ControleurDashboardScreen.jsx:35-36`

- [ ] **Step 1: Remplacer les 2 GlassButton par 1 gros bouton + 1 lien**

Dans `ControleurDashboardScreen.jsx`, remplacer :

```javascript
// AVANT (lignes 35-36) :
<GlassButton title="Scanner un QR" icon="camera" onPress={() => navigation.navigate('Scanner')} />
<GlassButton title="Historique des scans" icon="clock" onPress={() => navigation.navigate('Historique')} />

// APRÈS :
<TouchableOpacity
  style={styles.scanBtn}
  onPress={() => navigation.navigate('Scanner')}
  activeOpacity={0.8}
>
  <MaterialCommunityIcons name="qr-code-scan" size={32} color="#FFFFFF" />
  <Text style={styles.scanBtnTexte}>Scanner un billet</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.histLien} onPress={() => navigation.navigate('Historique')}>
  <Feather name="clock" size={16} color={colors.accent} />
  <Text style={styles.histLienTexte}>Historique des scans</Text>
  <Feather name="chevron-right" size={14} color={colors.accent} />
</TouchableOpacity>
```

- [ ] **Step 2: Ajouter les styles `scanBtn`, `scanBtnTexte`, `histLien`, `histLienTexte`**

Dans `makeStyles`, après `sousTitre` (ligne 96), ajouter :

```javascript
scanBtn: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  width: '100%', paddingVertical: 20,
  backgroundColor: colors.accent,
  borderRadius: 16,
},
scanBtnTexte: {
  fontFamily: fonts.outfit.bold,
  fontSize: 18,
  color: '#FFFFFF',
},
histLien: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  paddingVertical: 12,
},
histLienTexte: {
  fontFamily: fonts.outfit.semiBold,
  fontSize: 14,
  color: colors.accent,
},
```

- [ ] **Step 3: Supprimer l'import inutilisé `GlassButton`**

Remplacer :
```javascript
import GlassContainer from '../../components/GlassContainer'
import GlassButton from '../../components/GlassButton'
```
Par :
```javascript
import GlassContainer from '../../components/GlassContainer'
```

- [ ] **Step 4: Vérifier que l'import `MaterialCommunityIcons` est présent**

L'import (ligne 6) doit être :
```javascript
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
```

---

### Task 3: Simplifier l'historique des scans

**Files:**
- Modify: `mobile/src/screens/controleur/ScanHistoryScreen.jsx:8,83-98,127-157,183-190,261-264`

- [ ] **Step 1: Supprimer l'import de `reinitialiser` et `reinitialiserEvenement` (non utilisés)**

Remplacer ligne 8 :
```javascript
import { telechargerTickets, getHistorique, synchroniser, getStats, reinitialiser, reinitialiserEvenement } from '../../services/scanService'
```
Par :
```javascript
import { getHistorique, getStats } from '../../services/scanService'
```

- [ ] **Step 2: Supprimer les états `sync`, `download`, `downloadMsg` inutilisés**

Remplacer les lignes 34-37 :
```javascript
const [sync, setSync] = useState(false)
const [download, setDownload] = useState(false)
const [downloadMsg, setDownloadMsg] = useState(null)
```
Par (rien — supprimer ces 3 lignes).

- [ ] **Step 3: Supprimer les handlers `handleSync`, `handleDownload`, `handleVider`**

Supprimer les lignes 54-97 (les 3 fonctions `handleSync`, `handleDownload`, `handleVider`).

- [ ] **Step 4: Remplacer les boutons d'actions par un simple message**

Remplacer le bloc `<View style={styles.actions}>...` (lignes 127-157) par :
```javascript
<Text style={styles.infoAuto}>
  Les tickets sont automatiquement téléchargés et synchronisés.
  Les scans apparaissent ci-dessous.
</Text>
```

- [ ] **Step 5: Supprimer le badge "NON SYNCHRONISÉ" des cartes de scan**

Dans la boucle des scans, remplacer les lignes 183-190 :
```javascript
<View style={styles.carteDroite}>
  {item.synced === 0 ? (
    <View style={styles.badge}>
      <Text style={styles.badgeTexte}>NON SYNCHRONISÉ</Text>
    </View>
  ) : (
    <Feather name="check-circle" size={12} color={colors.green} />
  )}
  <View style={[styles.carteStatutBadge, { backgroundColor: p.dot + '18' }]}>
    <Text style={[styles.carteStatut, { color: p.dot }]}>{p.label}</Text>
  </View>
</View>
```
Par :
```javascript
<View style={styles.carteDroite}>
  <View style={[styles.carteStatutBadge, { backgroundColor: p.dot + '18' }]}>
    <Text style={[styles.carteStatut, { color: p.dot }]}>{p.label}</Text>
  </View>
</View>
```

- [ ] **Step 6: Ajouter le style `infoAuto` et supprimer les styles inutilisés**

Dans `makeStyles`, après le style `eventName`, ajouter :
```javascript
infoAuto: {
  fontFamily: fonts.outfit.regular, fontSize: 12, color: colors.textSecondary,
  textAlign: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
},
```

Supprimer les styles inutilisés (qui n'ont plus de référence) : `actions`, `actionBtn`, `actionTexte`, `downloadMsg`, `downloadMsgError`, `badge`, `badgeTexte`.

- [ ] **Step 7: Supprimer également `useTabBarScroll` et `tabScrollY` si l'import n'est plus utile**

Vérifier si `tabScrollY` est encore utilisé. Il est passé à `onScroll` du ScrollView donc on le garde.
