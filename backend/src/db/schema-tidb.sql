-- Schéma TiDB pour SENGUICHET
-- Version: 1.0 (adapté pour TiDB Cloud)
-- Suppression des fonctionnalités MySQL non supportées par TiDB :
--   - CREATE DATABASE / USE (pas nécessaire)
--   - ENGINE=InnoDB (TiDB ignore)
--   - Triggers (remplacés par logique applicative)

-- ============================================================
-- 1. TABLES UTILISATEURS
-- ============================================================

CREATE TABLE IF NOT EXISTS administrateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telephone VARCHAR(20) DEFAULT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
);

CREATE TABLE IF NOT EXISTS acheteur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) DEFAULT NULL,
  nom VARCHAR(100) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL UNIQUE,
  date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dernier_acces DATETIME DEFAULT NULL,
  INDEX idx_acheteur_telephone (telephone),
  INDEX idx_acheteur_email (email)
);

CREATE TABLE IF NOT EXISTS organisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  nom_structure VARCHAR(150) DEFAULT NULL,
  statut ENUM('EN_ATTENTE', 'VALIDE', 'REFUSE') NOT NULL DEFAULT 'VALIDE',
  date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_organisateur_email (email),
  INDEX idx_organisateur_statut (statut)
);

CREATE TABLE IF NOT EXISTS controleur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(100) DEFAULT NULL,
  acces_actif TINYINT(1) NOT NULL DEFAULT 1,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. TABLES EVENEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS evenement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  lieu VARCHAR(200) NOT NULL,
  ville VARCHAR(100) DEFAULT NULL,
  categorie VARCHAR(50) DEFAULT NULL,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME DEFAULT NULL,
  capacite_totale INT NOT NULL DEFAULT 0,
  affiche_url VARCHAR(500) DEFAULT NULL,
  scan_code VARCHAR(4) NOT NULL,
  statut ENUM('en_attente','actif','refuse','suspendu','annule') NOT NULL DEFAULT 'en_attente',
  commentaire_admin TEXT DEFAULT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
  INDEX idx_evenement_organisateur (organisateur_id),
  INDEX idx_evenement_statut (statut),
  INDEX idx_evenement_scan_code (scan_code)
);

CREATE TABLE IF NOT EXISTS demande_evenement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  type_action ENUM('CREATION', 'MODIFICATION', 'SUPPRESSION') NOT NULL DEFAULT 'CREATION',
  evenement_id INT DEFAULT NULL,
  titre VARCHAR(200) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  lieu VARCHAR(200) DEFAULT NULL,
  date_debut DATETIME DEFAULT NULL,
  date_fin DATETIME DEFAULT NULL,
  capacite INT NOT NULL DEFAULT 0,
  affiche_url VARCHAR(500) DEFAULT NULL,
  payload JSON DEFAULT NULL,
  statut ENUM('soumis', 'en_analyse', 'approuve', 'refuse') NOT NULL DEFAULT 'soumis',
  commentaire_admin TEXT DEFAULT NULL,
  administrateur_id INT DEFAULT NULL,
  date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_traitement DATETIME DEFAULT NULL,
  FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE SET NULL,
  FOREIGN KEY (administrateur_id) REFERENCES administrateur(id) ON DELETE SET NULL,
  INDEX idx_demande_statut (statut),
  INDEX idx_demande_organisateur (organisateur_id),
  INDEX idx_demande_type_action (type_action),
  INDEX idx_demande_evenement (evenement_id)
);

CREATE TABLE IF NOT EXISTS categorie_ticket (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evenement_id INT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  prix INT NOT NULL,
  capacite INT NOT NULL DEFAULT 0,
  places_disponibles INT NOT NULL DEFAULT 0,
  couleur_hex VARCHAR(7) DEFAULT '#6366F1',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  INDEX idx_categorie_evenement (evenement_id)
);

CREATE TABLE IF NOT EXISTS affectation_controleur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  controleur_id INT NOT NULL,
  evenement_id INT NOT NULL,
  categorie_ticket_id INT DEFAULT NULL,
  zone VARCHAR(100) DEFAULT NULL,
  date_affectation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (controleur_id) REFERENCES controleur(id) ON DELETE CASCADE,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  FOREIGN KEY (categorie_ticket_id) REFERENCES categorie_ticket(id) ON DELETE SET NULL,
  UNIQUE KEY uq_affectation (controleur_id, evenement_id, categorie_ticket_id),
  INDEX idx_affectation_controleur (controleur_id),
  INDEX idx_affectation_evenement (evenement_id)
);

-- ============================================================
-- 3. TABLES BILLETTERIE
-- ============================================================

CREATE TABLE IF NOT EXISTS billet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  numero VARCHAR(20) NOT NULL,
  evenement_id INT NOT NULL,
  categorie_ticket_id INT NOT NULL,
  acheteur_id INT DEFAULT NULL,
  telephone_acheteur VARCHAR(20) NOT NULL,
  transaction_id INT DEFAULT NULL,
  payload_signature VARCHAR(64) NOT NULL,
  prix_paye INT NOT NULL,
  est_utilise TINYINT(1) NOT NULL DEFAULT 0,
  statut ENUM('EN_ATTENTE','ACTIF','UTILISE','REMBOURSE') NOT NULL DEFAULT 'EN_ATTENTE',
  date_expiration DATETIME DEFAULT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  FOREIGN KEY (categorie_ticket_id) REFERENCES categorie_ticket(id) ON DELETE CASCADE,
  FOREIGN KEY (acheteur_id) REFERENCES acheteur(id) ON DELETE SET NULL,
  INDEX idx_billet_uuid (uuid),
  INDEX idx_billet_evenement (evenement_id),
  INDEX idx_billet_telephone (telephone_acheteur),
  INDEX idx_billet_utilise (est_utilise)
);

CREATE TABLE IF NOT EXISTS scan_billet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billet_id INT NOT NULL,
  controleur_id INT DEFAULT NULL,
  evenement_id INT NOT NULL,
  statut ENUM('VALIDE', 'DEJA_UTILISE', 'CONFLIT', 'INVALIDE', 'EN_ATTENTE') NOT NULL,
  horodatage_scan DATETIME NOT NULL,
  horodatage_local DATETIME DEFAULT NULL,
  est_offline TINYINT(1) NOT NULL DEFAULT 0,
  date_synchronisation DATETIME DEFAULT NULL,
  FOREIGN KEY (billet_id) REFERENCES billet(id) ON DELETE CASCADE,
  FOREIGN KEY (controleur_id) REFERENCES controleur(id) ON DELETE SET NULL,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  INDEX idx_scan_billet (billet_id),
  INDEX idx_scan_controleur (controleur_id),
  INDEX idx_scan_evenement (evenement_id),
  INDEX idx_scan_statut (statut),
  INDEX idx_scan_horodatage (horodatage_scan)
);

CREATE TABLE IF NOT EXISTS historique_statut_billet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billet_id INT NOT NULL,
  ancien_statut VARCHAR(50) DEFAULT NULL,
  nouveau_statut VARCHAR(50) NOT NULL,
  declencheur VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  date_modification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (billet_id) REFERENCES billet(id) ON DELETE CASCADE,
  INDEX idx_historique_billet (billet_id),
  INDEX idx_historique_date (date_modification)
);

-- ============================================================
-- 4. TABLES PAIEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  billet_id INT DEFAULT NULL,
  montant INT NOT NULL,
  frais INT NOT NULL DEFAULT 0,
  devise VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  statut ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  moyen_paiement ENUM('WAVE', 'ORANGE_MONEY', 'FREE_MONEY', 'CARTE', 'AUTRE') NOT NULL DEFAULT 'WAVE',
  reference_operateur VARCHAR(100) DEFAULT NULL,
  telephone_payeur VARCHAR(20) DEFAULT NULL,
  date_transaction DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_mise_a_jour DATETIME DEFAULT NULL,
  FOREIGN KEY (billet_id) REFERENCES billet(id) ON DELETE SET NULL,
  INDEX idx_transaction_reference (reference),
  INDEX idx_transaction_statut (statut),
  INDEX idx_transaction_date (date_transaction)
);

CREATE TABLE IF NOT EXISTS commission (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  organisateur_id INT NOT NULL,
  montant_brut INT NOT NULL,
  pourcentage DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  montant_commission INT NOT NULL,
  montant_net INT NOT NULL,
  statut ENUM('ATTENTE', 'PRELEVEE', 'REVERSEE') NOT NULL DEFAULT 'ATTENTE',
  date_calcul DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_reversement DATETIME DEFAULT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
  FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
  INDEX idx_commission_organisateur (organisateur_id),
  INDEX idx_commission_statut (statut)
);

CREATE TABLE IF NOT EXISTS remboursement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  billet_id INT DEFAULT NULL,
  montant INT NOT NULL,
  motif TEXT DEFAULT NULL,
  statut ENUM('DEMANDE', 'APPROUVE', 'EFFECTUE', 'REFUSE') NOT NULL DEFAULT 'DEMANDE',
  traite_par INT DEFAULT NULL,
  date_demande DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_traitement DATETIME DEFAULT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE CASCADE,
  FOREIGN KEY (billet_id) REFERENCES billet(id) ON DELETE SET NULL,
  FOREIGN KEY (traite_par) REFERENCES administrateur(id) ON DELETE SET NULL,
  INDEX idx_remboursement_transaction (transaction_id)
);

-- ============================================================
-- 5. TABLES OFFLINE & SYNCHRONISATION
-- ============================================================

CREATE TABLE IF NOT EXISTS synchronisation_offline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  controleur_id INT NOT NULL,
  evenement_id INT NOT NULL,
  type_action ENUM('PUSH_SCAN', 'PULL_TICKETS', 'PULL_EVENT') NOT NULL,
  payload JSON DEFAULT NULL,
  horodatage_action DATETIME NOT NULL,
  horodatage_sync DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('EN_ATTENTE', 'SYNCHRONISE', 'CONFLIT', 'ECHEC') NOT NULL DEFAULT 'EN_ATTENTE',
  tentative INT NOT NULL DEFAULT 0,
  message_erreur TEXT DEFAULT NULL,
  FOREIGN KEY (controleur_id) REFERENCES controleur(id) ON DELETE CASCADE,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  INDEX idx_sync_controleur (controleur_id),
  INDEX idx_sync_statut (statut),
  INDEX idx_sync_horodatage (horodatage_sync)
);

-- ============================================================
-- 6. TABLES ANNEXES
-- ============================================================

CREATE TABLE IF NOT EXISTS code_otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  code VARCHAR(6) NOT NULL,
  type ENUM('AUTH', 'VERIFICATION', 'PAIEMENT') NOT NULL DEFAULT 'AUTH',
  est_utilise TINYINT(1) NOT NULL DEFAULT 0,
  date_expiration DATETIME NOT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_telephone (telephone),
  INDEX idx_otp_code (code),
  INDEX idx_otp_expiration (date_expiration)
);

CREATE TABLE IF NOT EXISTS notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destinataire_type ENUM('organisateur', 'controleur', 'acheteur', 'administrateur') NOT NULL,
  destinataire_id INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
  est_lu TINYINT(1) NOT NULL DEFAULT 0,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_lecture DATETIME DEFAULT NULL,
  INDEX idx_notification_destinataire (destinataire_type, destinataire_id),
  INDEX idx_notification_lu (est_lu),
  INDEX idx_notification_date (date_creation)
);

-- ============================================================
-- 7. TABLE DEMANDES DE PARTENARIAT
-- ============================================================

CREATE TABLE IF NOT EXISTS partenaire_demande (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  organisation VARCHAR(200) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(200) NOT NULL,
  type_evenement VARCHAR(50) NOT NULL,
  nb_evenements VARCHAR(20) DEFAULT NULL,
  site_web VARCHAR(300) DEFAULT NULL,
  description TEXT NOT NULL,
  statut ENUM('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REFUSEE') NOT NULL DEFAULT 'EN_ATTENTE',
  note_admin TEXT DEFAULT NULL,
  email_confirme TINYINT(1) NOT NULL DEFAULT 0,
  administrateur_id INT DEFAULT NULL,
  date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_traitement DATETIME DEFAULT NULL,
  FOREIGN KEY (administrateur_id) REFERENCES administrateur(id) ON DELETE SET NULL,
  INDEX idx_partenaire_statut (statut),
  INDEX idx_partenaire_date (date_soumission),
  INDEX idx_partenaire_email (email)
);

CREATE TABLE IF NOT EXISTS partenaire (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT UNIQUE,
  nom_organisation VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(20) DEFAULT NULL,
  site_web VARCHAR(300) DEFAULT NULL,
  type_evenement VARCHAR(50) DEFAULT NULL,
  statut ENUM('ACTIF', 'INACTIF') NOT NULL DEFAULT 'ACTIF',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion DATETIME DEFAULT NULL,
  FOREIGN KEY (demande_id) REFERENCES partenaire_demande(id) ON DELETE SET NULL,
  INDEX idx_partenaire_email (email)
);

-- ============================================================
-- CONTRAINTES SUPPLÉMENTAIRES
-- ============================================================

ALTER TABLE billet
  ADD CONSTRAINT fk_billet_transaction
  FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE SET NULL;
