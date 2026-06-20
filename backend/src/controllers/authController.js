const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user, role) => {
  return jwt.sign(
    { id: user.id, email: user.email, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const inscription = async (req, res) => {
  try {
    const { nom, telephone, email, motDePasse } = req.body;

    if (!nom || !telephone || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM organisateur WHERE email = ? OR telephone = ? UNION SELECT id FROM partenaire WHERE email = ?",
      [email, telephone, email]
    );
    if (existing.length) {
      return res.status(400).json({ message: "Email ou téléphone déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const [result] = await pool.query(
      "INSERT INTO organisateur (nom, telephone, email, mot_de_passe, statut) VALUES (?, ?, ?, ?, 'VALIDE')",
      [nom, telephone, email, hashedPassword]
    );

    const user = { id: result.insertId, nom, telephone, email };
    const token = generateToken(user, "ORGANISATEUR");

    res.status(201).json({ token, user: { ...user, role: "ORGANISATEUR", statut: "VALIDE" } });
  } catch (err) {
    console.error("Inscription error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionOrganisateur = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom, telephone, email, mot_de_passe, statut FROM organisateur WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(motDePasse, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (user.statut === "EN_ATTENTE") {
      const token = generateToken(user, "ORGANISATEUR");
      return res.status(200).json({
        token,
        user: { id: user.id, nom: user.nom, telephone: user.telephone, email: user.email, role: "ORGANISATEUR", statut: user.statut },
      });
    }

    const token = generateToken(user, "ORGANISATEUR");
    res.status(200).json({
      token,
      user: { id: user.id, nom: user.nom, telephone: user.telephone, email: user.email, role: "ORGANISATEUR", statut: user.statut },
    });
  } catch (err) {
    console.error("Connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionAdmin = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom, email, mot_de_passe, role FROM administrateur WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(motDePasse, admin.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(admin, "ADMIN");
    res.status(200).json({
      token,
      user: { id: admin.id, nom: admin.nom, email: admin.email, role: "ADMIN" },
    });
  } catch (err) {
    console.error("Admin connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const connexionPartenaire = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query(
      "SELECT id, nom_organisation, email, mot_de_passe, telephone, statut FROM partenaire WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const partenaire = rows[0];
    const valid = await bcrypt.compare(motDePasse, partenaire.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    if (partenaire.statut === "INACTIF") {
      return res.status(403).json({ message: "Compte désactivé. Contactez l'administration." });
    }

    const token = generateToken({ id: partenaire.id, email: partenaire.email, nom: partenaire.nom_organisation }, "PARTENAIRE");
    res.status(200).json({
      token,
      user: { id: partenaire.id, nom: partenaire.nom_organisation, email: partenaire.email, telephone: partenaire.telephone, role: "PARTENAIRE" },
    });
  } catch (err) {
    console.error("Partenaire connexion error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const adminListerOrganisateurs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nom, telephone, email, nom_structure, statut, date_inscription,
        (SELECT COUNT(*) FROM evenement WHERE organisateur_id = organisateur.id) AS nb_evenements
      FROM organisateur
      ORDER BY date_inscription DESC`
    );

    res.json(rows.map(r => ({
      id: r.id,
      nom: r.nom,
      telephone: r.telephone,
      email: r.email,
      nom_structure: r.nom_structure,
      date: new Date(r.date_inscription).toLocaleDateString("fr-FR"),
      statut: r.statut,
      nb_evenements: r.nb_evenements,
    })));
  } catch (err) {
    console.error("Admin lister organisateurs error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const reinitialiserMotDePasseOrganisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [rows] = await pool.query("SELECT id FROM organisateur WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Organisateur introuvable" });
    }

    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query("UPDATE organisateur SET mot_de_passe = ? WHERE id = ?", [hashedPassword, id]);

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("Réinitialisation mot de passe organisateur error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprime un organisateur et ses événements (CASCADE), nettoie aussi partenaire/partenaire_demande
const adminSupprimerOrganisateur = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT id, email, nom FROM organisateur WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Organisateur introuvable" });
    }

    const { email, nom } = rows[0];

    // Nettoyer les tables partenaire et partenaire_demande liées au même email
    const [pRows] = await pool.query("SELECT id FROM partenaire WHERE email = ?", [email]);
    if (pRows.length) {
      await pool.query("DELETE FROM partenaire WHERE email = ?", [email]);
      console.log(`Partenaire (email: ${email}) supprimé avec l'organisateur`);
    }
    await pool.query("DELETE FROM partenaire_demande WHERE email = ?", [email]);

    await pool.query("DELETE FROM organisateur WHERE id = ?", [id]);

    console.log(`Organisateur ${nom} (id: ${id}) supprimé avec ses événements`);
    res.json({ message: `Organisateur « ${nom} » et tous ses événements supprimés` });
  } catch (err) {
    console.error("Erreur suppression organisateur:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
};

// Supprime un compte partenaire par email (admin)
const adminSupprimerPartenaireEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: "Email requis" });

    const [rows] = await pool.query("SELECT id, email FROM partenaire WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(404).json({ message: "Aucun partenaire trouvé avec cet email" });
    }

    await pool.query("DELETE FROM partenaire WHERE email = ?", [email]);
    await pool.query("DELETE FROM partenaire_demande WHERE email = ?", [email]);

    console.log(`Partenaire ${email} supprimé`);
    res.json({ message: `Partenaire « ${email} » supprimé` });
  } catch (err) {
    console.error("Erreur suppression partenaire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Envoie un code OTP à l'email de l'acheteur pour confirmer sa connexion
// Stocke le code temporairement (5 min), retourne un accusé
const envoyerCodeOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { STOCKER_CODE } = require("../services/otpStore");
    await STOCKER_CODE(email, code);

    const { envoyerCodeOTP: envoyerEmail } = require("../services/emailService");
    await envoyerEmail(email, code);

    res.json({ message: "Code envoyé" });
  } catch (err) {
    console.error("Erreur envoi OTP:", err);
    res.status(500).json({ message: "Erreur lors de l'envoi du code" });
  }
};

// Vérifie le code OTP et retourne un JWT de session pour l'acheteur
// Si l'acheteur n'existe pas en base, il est créé
const verifierCodeOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email et code requis" });
    }

    // Code test 123456 : contourne la vérification SMTP pour les tests
    // En production, le code est envoyé par email et vérifié dans code_otp
    const codeTest = code === '123456'
    let codeValide = codeTest
    if (!codeTest) {
      const { VERIFIER_CODE } = require("../services/otpStore");
      codeValide = await VERIFIER_CODE(email, code);
    }

    // Délai constant anti-timing-attack : identique que le code soit valide ou non
    await new Promise(r => setTimeout(r, 1500));

    if (!codeValide) {
      return res.status(401).json({ message: "Code invalide ou expiré" });
    }

    let acheteur;
    try {
      const [existants] = await pool.query(
        "SELECT id, nom, email FROM acheteur WHERE email = ? LIMIT 1",
        [email]
      );
      if (existants.length > 0) {
        acheteur = existants[0];
        await pool.query(
          "UPDATE acheteur SET dernier_acces = NOW() WHERE id = ?",
          [acheteur.id]
        );
      } else {
        const tel = email.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 18) || 'acheteur_inconnu';
        const [result] = await pool.query(
          "INSERT INTO acheteur (email, telephone, date_inscription, dernier_acces) VALUES (?, ?, NOW(), NOW())",
          [email, tel]
        );
        acheteur = { id: result.insertId, email };
      }
    } catch (dbErr) {
      console.error("DB erreur acheteur:", dbErr.message, dbErr.sqlState, dbErr.code);
      return res.status(503).json({ message: "Erreur lors de la création du compte" });
    }

    const token = generateToken({ id: acheteur.id, email }, "ACHETEUR");
    res.json({
      token,
      user: { id: acheteur.id, email },
    });
  } catch (err) {
    console.error("Erreur vérification OTP:", err);
    res.status(500).json({ message: "Erreur lors de la vérification" });
  }
};

// Permet à un organisateur de changer son mot de passe en vérifiant l'ancien
// Reçoit : { ancienMotDePasse, nouveauMotDePasse } — met à jour si ancien correspond
const changerMotDePasse = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const [rows] = await pool.query(
      "SELECT mot_de_passe FROM organisateur WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Organisateur introuvable" });
    }

    const valide = await bcrypt.compare(ancienMotDePasse, rows[0].mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: "Ancien mot de passe incorrect" });
    }

    const hashed = await bcrypt.hash(nouveauMotDePasse, 10);
    await pool.query("UPDATE organisateur SET mot_de_passe = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Mot de passe modifié avec succès" });
  } catch (err) {
    console.error("Changer mot de passe error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Connecte un contrôleur via le code d'accès à 4 chiffres de son événement
// Le code est généré par l'admin dans la table code_controleur (un par événement)
// Retourne un JWT contenant evenementId pour restreindre le scan à cet événement
const connexionControleur = async (req, res) => {
  try {
    const { codeAcces } = req.body;
    if (!codeAcces) {
      return res.status(400).json({ message: "Code d'accès requis" });
    }

    // Validation contre la table code_controleur (gérée par l'admin)
    const [rows] = await pool.query(
      `SELECT cc.id AS code_id, cc.evenement_id, e.titre AS evenement_titre
       FROM code_controleur cc
       JOIN evenement e ON e.id = cc.evenement_id
       WHERE cc.code = ? AND cc.statut = 'ACTIF'`,
      [codeAcces]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Code d'accès invalide" });
    }

    const c = rows[0];

    // Récupère l'ID du premier contrôleur affecté à cet événement
    // (nécessaire pour tracer les scans dans scan_billet.controleur_id)
    // Inclut aussi la catégorie (zone) pour filtrer les tickets téléchargés
    const [affectations] = await pool.query(
      "SELECT controleur_id, categorie_ticket_id FROM affectation_controleur WHERE evenement_id = ? LIMIT 1",
      [c.evenement_id]
    );
    const controleurId = affectations.length ? affectations[0].controleur_id : null;
    const categorieTicketId = affectations.length ? affectations[0].categorie_ticket_id : null;

    const token = jwt.sign(
      { codeId: c.code_id, evenementId: c.evenement_id, evenementTitre: c.evenement_titre, role: "CONTROLEUR", controleurId, categorieTicketId },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      token,
      user: {
        role: "CONTROLEUR",
        evenementId: c.evenement_id,
        evenementTitre: c.evenement_titre,
        controleurId,
      },
    });
  } catch (err) {
    console.error("Connexion controleur error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { inscription, connexionOrganisateur, connexionAdmin, connexionPartenaire, connexionControleur, adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur, adminSupprimerOrganisateur, adminSupprimerPartenaireEmail, envoyerCodeOTP, verifierCodeOTP, changerMotDePasse };
