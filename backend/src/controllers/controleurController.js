const pool = require("../config/db");

const genererCode4 = () => {
  let code = "";
  for (let i = 0; i < 4; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
};

const listerEvenements = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.titre, e.date_debut, e.lieu, e.ville, e.statut,
        cc.code, cc.statut AS code_statut
      FROM evenement e
      LEFT JOIN code_controleur cc ON cc.evenement_id = e.id AND cc.statut = 'ACTIF'
      ORDER BY e.date_creation DESC`
    );
    res.json(rows.map(r => ({
      id: r.id,
      nom: r.titre,
      date: new Date(r.date_debut).toLocaleDateString("fr-FR"),
      lieu: r.ville ? `${r.lieu}, ${r.ville}` : r.lieu,
      statut: r.statut,
      code: r.code || null,
      code_actif: r.code_statut === 'ACTIF',
    })));
  } catch (err) {
    console.error("Lister evenements controleurs error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const listerCode = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id, titre FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    let [codes] = await pool.query(
      "SELECT id, code, statut, date_creation FROM code_controleur WHERE evenement_id = ? LIMIT 1",
      [evenementId]
    );

    if (!codes.length) {
      let code;
      let insere = false;
      while (!insere) {
        code = genererCode4();
        try {
          await pool.query("INSERT INTO code_controleur (code, evenement_id) VALUES (?, ?)", [code, evenementId]);
          insere = true;
        } catch (e) {
          if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
      }
      [codes] = await pool.query(
        "SELECT id, code, statut, date_creation FROM code_controleur WHERE evenement_id = ? LIMIT 1",
        [evenementId]
      );
    }

    res.json({ evenement: evenement[0], code: codes[0] });
  } catch (err) {
    console.error("Lister code controleur error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const regenerer = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    let nouveauCode;
    let insere = false;
    while (!insere) {
      nouveauCode = genererCode4();
      try {
        await pool.query(
          "INSERT INTO code_controleur (code, evenement_id, statut) VALUES (?, ?, 'ACTIF')",
          [nouveauCode, evenementId]
        );
        insere = true;
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }
    }

    await pool.query(
      "UPDATE code_controleur SET statut = 'INACTIF' WHERE evenement_id = ? AND id != (SELECT id FROM (SELECT id FROM code_controleur WHERE evenement_id = ? ORDER BY id DESC LIMIT 1) AS tmp) AND statut = 'ACTIF'",
      [evenementId, evenementId]
    );

    const [codes] = await pool.query(
      "SELECT id, code, statut, date_creation FROM code_controleur WHERE evenement_id = ? AND statut = 'ACTIF' LIMIT 1",
      [evenementId]
    );

    res.json({ message: "Nouveau code généré avec succès", code: codes[0] });
  } catch (err) {
    console.error("Regenerer code error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const desactiver = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    await pool.query("UPDATE code_controleur SET statut = 'INACTIF' WHERE evenement_id = ? AND statut = 'ACTIF'", [evenementId]);

    res.json({ message: "Code désactivé avec succès" });
  } catch (err) {
    console.error("Desactiver code error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { listerEvenements, listerCode, regenerer, desactiver };
