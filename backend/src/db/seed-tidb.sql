-- Données de test TiDB
-- Administrateur par défaut (mot de passe: admin123)
INSERT IGNORE INTO administrateur (nom, email, telephone, mot_de_passe, role)
VALUES (
  'Admin SENGUICHET',
  'admin@senguichet.com',
  '+221781234567',
  '$2a$10$nG6ZQMTJ2RI.dFp0KR78G.QGe/6SeflxVMCLYBoccBizJ9wfkV/wq',
  'super_admin'
);

-- Organisateur de test (mot de passe: organisateur123)
INSERT IGNORE INTO organisateur (nom, telephone, email, mot_de_passe, nom_structure, statut)
VALUES (
  'Moussa Diop',
  '+221771234567',
  'moussa@email.com',
  '$2a$10$oAsanMbK6IECP2G7qceh0uMZbzx0Zr5Lm8v6U0cCVWTztvLdVtZyC',
  'Diop Events',
  'VALIDE'
);
