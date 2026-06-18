# Design : Simplification du parcours contrôleur

## Résumé
Rendre l'interface contrôleur utilisable par un agent de terrain non technique :
suppression des boutons techniques, messages simplifiés, flux en lecture seule.

## Sections

### A. Messages de scan simplifiés
Dans `scanService.js`, remplacer les messages techniques par :

| Résultat | Message |
|----------|---------|
| VALIDE | "Entrée autorisée ✅" |
| FRAUDE | "QR code falsifié 🚫" |
| EXPIRE | "QR code expiré ⏳" |
| INCONNU | "Billet non trouvé ❓" |
| DEJA_UTILISE | "Déjà scanné ⚠️" |

### B. Parcours en 3 écrans (inchangé)
1. **Accueil** (ControleurDashboardScreen) — grand bouton "Scanner un billet" + lien "Historique"
2. **Scanner** (ScannerScreen) — caméra + overlay résultat avec icône/couleur par statut
3. **Historique** (ScanHistoryScreen) — stats + liste lecture seule

### C. Historique : suppression des boutons techniques
Retirer de `ScanHistoryScreen` :
- Bouton "Synchroniser"
- Bouton "Télécharger"
- Bouton "Vider" (remplacé par rien — plus nécessaire)
- Badge "NON SYNCHRONISÉ" sur chaque scan

Garder :
- Bannière de stats (Tickets locaux + compteurs par résultat)
- Liste des scans (date, numéro, résultat)
- Pull-to-refresh
- État vide (EmptyState)

### D. Sync et download en arrière-plan
- Téléchargement auto des tickets : déjà fait au focus caméra (intervalle 30s)
- Synchronisation auto : déjà faite après chaque scan
- Aucune action manuelle nécessaire

### E. Dashboard simplifié
- Remplacer les 2 boutons (Scanner / Historique) par :
  - **1 gros bouton accent** "Scanner un billet" (icône caméra)
  - **1 petit lien** "Historique des scans" en dessous
- Conserver le thème + déconnexion

## Fichiers impactés
- `mobile/src/services/scanService.js` — messages simplifiés
- `mobile/src/screens/controleur/ScannerScreen.jsx` — couleurs overlay si besoin
- `mobile/src/screens/controleur/ScanHistoryScreen.jsx` — suppression boutons + badge
- `mobile/src/screens/controleur/ControleurDashboardScreen.jsx` — layout simplifié

## Non modifié
- Logique métier / offline / SQLite — inchangée
- Sync arrière-plan — déjà en place
- ScannerScreen — seul les messages changent
