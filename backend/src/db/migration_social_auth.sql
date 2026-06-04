-- Migration: Social Auth pour acheteurs
-- Rendre telephone optionnel, ajouter champs auth sociale
ALTER TABLE acheteur
  MODIFY COLUMN telephone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN auth_provider VARCHAR(20) DEFAULT NULL AFTER telephone,
  ADD COLUMN provider_id VARCHAR(100) DEFAULT NULL AFTER auth_provider,
  ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL AFTER email,
  ADD INDEX idx_acheteur_provider (auth_provider, provider_id),
  ADD INDEX idx_acheteur_email (email);

-- Rendre telephone_acheteur optionnel dans billet (car on aura l'email via acheteur)
ALTER TABLE billet
  MODIFY COLUMN telephone_acheteur VARCHAR(20) DEFAULT NULL;
