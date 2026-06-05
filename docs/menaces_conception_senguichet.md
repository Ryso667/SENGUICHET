# Modélisation des Menaces pour la Réunion de Conception (SENGUICHET)
*Ce document sert de support de présentation pour l'étape de conception (L3). Il identifie les 6 menaces majeures de l'architecture SENGUICHET, leurs scénarios d'attaque, leurs impacts et les solutions à valider lors de la réunion.*

---

## 📋 Tableau de Synthèse des Risques (À projeter en réunion)

| # | Menace Majeure | Risque principal | Niveau de Risque | Solution proposée |
| :-: | :--- | :--- | :-: | :--- |
| **1** | **Brute-Force du Code de Scan (4 chiffres)** | Usurpation du rôle de contrôleur de billets | **Élevé** | Rate-limiting strict + Session JWT éphémère |
| **2** | **Duplication de Billet (Capture d'écran QR)** | Multi-entrée avec un seul billet payé | **Moyen** | Règle du "First Scan Wins" en Base de Données |
| **3** | **Falsification de Paiement (Faux Webhook)** | Génération de billets gratuits | **Critique** | Signature HMAC-SHA256 + Double vérification API |
| **4** | **Aspiration de billets (IDOR)** | Vol des billets des autres clients | **Élevé** | Identifiants uniques UUID v4 non prédictibles |
| **5** | **Perte du Stockage Local Client** | Client qui perd ses billets (cache vidé) | **Moyen** | Mécanisme de récupération par Téléphone + OTP |
| **6** | **Détournement du compte Organisateur** | Modification des prix et vol de recettes | **Élevé** | Cookies sécurisés `HttpOnly`, `Secure`, `SameSite` |

---

## 🔍 Fiches de Menaces Détaillées (Support de discussion)

### 🚨 Menace 1 : Brute-Force du "Code de Scan" à 4 chiffres
Le staff se connecte en saisissant uniquement un code à 4 chiffres (ex: `2491`) généré pour l'événement.
*   **Scénario d'attaque :** Un attaquant écrit un script en Python/JavaScript qui teste les 10 000 combinaisons possibles sur l'API `/api/unlock-scanner` en moins de 3 minutes.
*   **Impact :** L'attaquant déverrouille le mode scanner, peut valider de faux billets ou marquer les vrais billets comme "déjà utilisés" avant l'arrivée des clients (sabotage).
*   **Solution à valider en conception :** 
    1.  **Rate Limiter :** Bloquer l'adresse IP/l'appareil pendant 15 minutes après 5 tentatives erronées.
    2.  **Session éphémère :** Renvoyer un token JWT temporaire lors de la validation du code à 4 chiffres, qui expire automatiquement quelques heures après la fin de l'événement.

---

### 🚨 Menace 2 : Duplication et revente multiple d'un QR Code ("Double-Scan")
Le client n'a pas de compte et stocke son billet localement. Il peut facilement le cloner.
*   **Scénario d'attaque :** Un acheteur fait une capture d'écran de son QR code et l'envoie à 5 amis ou le revend sur les réseaux sociaux.
*   **Impact :** Perte financière pour l'organisateur, problèmes de sécurité aux portes (surpeuplement de la salle) et disputes avec les clients légitimes bloqués à l'entrée.
*   **Solution à valider en conception :**
    1.  **First Scan Wins :** En base de données, la table `tickets` passe le statut `is_used` à `TRUE` dès le premier scan.
    2.  **Alerte visuelle riche :** Si le billet est scanné à nouveau, l'application du staff affiche en rouge : *"Déjà Scanné à [Heure précise du premier scan] ❌"*. Cela permet au staff de justifier le refus d'entrée.

---

### 🚨 Menace 3 : Falsification de la validation de paiement (Webhook Spoofing)
La transaction se fait via Wave/OM, qui informe le serveur par un appel HTTP (Webhook).
*   **Scénario d'attaque :** Un attaquant intercepte la structure de la requête HTTP envoyée par Wave et simule un paiement réussi en envoyant directement une requête POST forgée au serveur SENGUICHET (ex: `/api/webhook/wave` avec un statut `SUCCESS`).
*   **Impact :** Génération de billets officiels et valides sans qu'aucun argent réel n'ait été versé sur le compte de l'organisateur.
*   **Solution à valider en conception :**
    1.  **Vérification de Signature :** L'opérateur de paiement signe la requête avec une clé secrète partagée. Notre serveur Express doit impérativement recalculer cette signature (HMAC-SHA256) avant de valider l'achat.
    2.  **Double vérification (Optionnel mais recommandé) :** Le serveur fait un appel direct (API Request) vers Wave pour vérifier si la transaction `transaction_id` existe réellement et est valide.

---

### 🚨 Menace 4 : Téléchargement illicite de billets par modification d'identifiant (IDOR)
L'accès direct au billet se fait après l'achat.
*   **Scénario d'attaque :** Un utilisateur achète un billet et constate que son URL de téléchargement est `/api/tickets/152`. Il modifie simplement l'identifiant dans sa barre d'adresse pour accéder à `/api/tickets/153`, `/api/tickets/154`, etc.
*   **Impact :** Vol massif et facile des billets d'autres acheteurs.
*   **Solution à valider en conception :**
    *   **Identifiants cryptographiques :** N'utiliser aucun identifiant numérique séquentiel (`AUTO_INCREMENT`) dans les routes publiques. Le QR Code et l'URL d'accès doivent utiliser des **UUIDs v4** (ex: `tickets/a5e8c2-4b67-...`). Un UUID ne peut pas être deviné.

---

### 🚨 Menace 5 : Perte de données locales et réclamations clients
Le choix technique d'éliminer la connexion acheteur simplifie le parcours, mais crée un risque opérationnel.
*   **Scénario d'attaque/incident :** L'acheteur supprime accidentellement l'application, vide le cache de son téléphone, ou change d'appareil avant l'événement. Son billet stocké localement est définitivement perdu.
*   **Impact :** Taux élevé d'utilisateurs mécontents se présentant à l'entrée sans billet, ralentissement du flux d'entrée, surcharge de travail pour le staff de secours.
*   **Solution à valider en conception :**
    *   **Module de récupération simple :** Créer une interface sur l'application mobile permettant à l'utilisateur de saisir son numéro de téléphone. Le serveur recherche les tickets actifs correspondants et lui envoie un SMS de récupération (avec un code OTP) ou affiche les billets à l'écran après vérification.

---

### 🚨 Menace 6 : Vol de session ou piratage du compte de l'Organisateur
L'organisateur dispose d'un espace web pour créer ses événements et suivre ses ventes.
*   **Scénario d'attaque :** Un hacker utilise une faille XSS sur le site pour intercepter les tokens de session stockés dans le stockage local de l'organisateur.
*   **Impact :** Accès au tableau de bord financier, détournement des fonds, ou modification sauvage des prix des événements.
*   **Solution à valider en conception :**
    *   **En-têtes HTTP et Cookies sécurisés :** Ne pas stocker le token dans le `localStorage` du navigateur. Utiliser un **Cookie HttpOnly** avec les options `Secure` (HTTPS uniquement) et `SameSite=Strict` pour bloquer les vols via scripts malveillants.
