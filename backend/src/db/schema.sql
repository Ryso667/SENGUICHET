-- ============================================================
-- SENGUICHET - Base de Données
-- Version: 1.0
-- Description: Schéma complet de la plateforme de billetterie
-- Moteur: MySQL / MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS senguichet
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE senguichet;

-- ============================================================
-- 1. TABLES UTILISATEURS
-- ============================================================

-- 1.1 Acheteur
CREATE TABLE acheteur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(100) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dernier_acces DATETIME DEFAULT NULL,
  INDEX idx_acheteur_telephone (telephone)
) ENGINE=InnoDB;

-- 1.2 Organisateur
CREATE TABLE organisateur (
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
) ENGINE=InnoDB;

-- 1.3 Controleur
CREATE TABLE controleur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(100) DEFAULT NULL,
  acces_actif TINYINT(1) NOT NULL DEFAULT 1,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.4 Administrateur
CREATE TABLE administrateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telephone VARCHAR(20) DEFAULT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- 2. TABLES EVENEMENTS
-- ============================================================

-- 2.1 DemandeEvenement (workflow de validation)
CREATE TABLE demande_evenement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  lieu VARCHAR(200) NOT NULL,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME DEFAULT NULL,
  capacite INT NOT NULL DEFAULT 0,
  affiche_url VARCHAR(500) DEFAULT NULL,
  statut ENUM('soumis', 'en_analyse', 'approuve', 'refuse') NOT NULL DEFAULT 'soumis',
  commentaire_admin TEXT DEFAULT NULL,
  administrateur_id INT DEFAULT NULL,
  date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_traitement DATETIME DEFAULT NULL,
  FOREIGN KEY (organisateur_id) REFERENCES organisateur(id) ON DELETE CASCADE,
  FOREIGN KEY (administrateur_id) REFERENCES administrateur(id) ON DELETE SET NULL,
  INDEX idx_demande_statut (statut),
  INDEX idx_demande_organisateur (organisateur_id)
) ENGINE=InnoDB;

-- 2.2 Evenement
CREATE TABLE evenement (
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
) ENGINE=InnoDB;

-- 2.3 CategorieTicket
CREATE TABLE categorie_ticket (
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
) ENGINE=InnoDB;

-- 2.4 AffectationControleur
CREATE TABLE affectation_controleur (
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
) ENGINE=InnoDB;

-- ============================================================
-- 3. TABLES BILLETTERIE
-- ============================================================

-- 3.1 Billet
CREATE TABLE billet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  evenement_id INT NOT NULL,
  categorie_ticket_id INT NOT NULL,
  acheteur_id INT DEFAULT NULL,
  telephone_acheteur VARCHAR(20) NOT NULL,
  transaction_id INT DEFAULT NULL,
  payload_signature VARCHAR(64) NOT NULL,
  prix_paye INT NOT NULL,
  est_utilise TINYINT(1) NOT NULL DEFAULT 0,
  date_expiration DATETIME DEFAULT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
  FOREIGN KEY (categorie_ticket_id) REFERENCES categorie_ticket(id) ON DELETE CASCADE,
  FOREIGN KEY (acheteur_id) REFERENCES acheteur(id) ON DELETE SET NULL,
  INDEX idx_billet_uuid (uuid),
  INDEX idx_billet_evenement (evenement_id),
  INDEX idx_billet_telephone (telephone_acheteur),
  INDEX idx_billet_utilise (est_utilise)
) ENGINE=InnoDB;

-- 3.2 ScanBillet (table centrale du contrôle d'accès)
CREATE TABLE scan_billet (
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
) ENGINE=InnoDB;

-- 3.3 HistoriqueStatutBillet
CREATE TABLE historique_statut_billet (
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
) ENGINE=InnoDB;

-- ============================================================
-- 4. TABLES PAIEMENTS
-- ============================================================

-- 4.1 Transaction
CREATE TABLE transaction (
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
  date_mise_a_jour DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (billet_id) REFERENCES billet(id) ON DELETE SET NULL,
  INDEX idx_transaction_reference (reference),
  INDEX idx_transaction_statut (statut),
  INDEX idx_transaction_date (date_transaction)
) ENGINE=InnoDB;

-- 4.2 Commission
CREATE TABLE commission (
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
) ENGINE=InnoDB;

-- 4.3 Remboursement
CREATE TABLE remboursement (
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
) ENGINE=InnoDB;

-- ============================================================
-- 5. TABLES OFFLINE & SYNCHRONISATION
-- ============================================================

-- 5.1 SynchronisationOffline
CREATE TABLE synchronisation_offline (
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
) ENGINE=InnoDB;

-- ============================================================
-- 6. TABLES ANNEXES
-- ============================================================

-- 6.1 CodeOTP
CREATE TABLE code_otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telephone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('AUTH', 'VERIFICATION', 'PAIEMENT') NOT NULL DEFAULT 'AUTH',
  est_utilise TINYINT(1) NOT NULL DEFAULT 0,
  date_expiration DATETIME NOT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_telephone (telephone),
  INDEX idx_otp_code (code),
  INDEX idx_otp_expiration (date_expiration)
) ENGINE=InnoDB;

-- 6.2 Notification
CREATE TABLE notification (
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
) ENGINE=InnoDB;

-- ============================================================
-- CONTRAINTES SUPPLÉMENTAIRES
-- ============================================================

-- Lier la transaction_id dans billet après création de la transaction
ALTER TABLE billet
  ADD CONSTRAINT fk_billet_transaction
  FOREIGN KEY (transaction_id) REFERENCES transaction(id) ON DELETE SET NULL;

-- ============================================================
-- TRIGGER : Mise à jour des places disponibles
-- ============================================================

CREATE TRIGGER after_billet_insert
AFTER INSERT ON billet
FOR EACH ROW
UPDATE categorie_ticket
SET places_disponibles = places_disponibles - 1
WHERE id = NEW.categorie_ticket_id AND places_disponibles > 0;

CREATE TRIGGER after_scan_billet_insert
AFTER INSERT ON scan_billet
FOR EACH ROW
UPDATE billet
SET est_utilise = 1
WHERE id = NEW.billet_id AND NEW.statut = 'VALIDE';

-- ============================================================
-- JEU DE DONNÉES DE TEST
-- ============================================================

-- Administrateur par défaut (mot de passe: admin123)
INSERT INTO administrateur (nom, email, telephone, mot_de_passe, role)
VALUES (
  'Admin SENGUICHET',
  'admin@senguichet.com',
  '+221781234567',
  '$2a$10$nG6ZQMTJ2RI.dFp0KR78G.QGe/6SeflxVMCLYBoccBizJ9wfkV/wq',
  'super_admin'
);

-- Organisateur de test (mot de passe: organisateur123)
INSERT INTO organisateur (nom, telephone, email, mot_de_passe, nom_structure, statut)
VALUES (
  'Moussa Diop',
  '+221771234567',
  'moussa@email.com',
  '$2a$10$oAsanMbK6IECP2G7qceh0uMZbzx0Zr5Lm8v6U0cCVWTztvLdVtZyC',
  'Diop Events',
  'VALIDE'
);
