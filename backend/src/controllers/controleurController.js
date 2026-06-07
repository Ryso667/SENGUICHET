const pool = require("../config/db");

const genererCode4 = () => {
  let code = "";
  for (let i = 0; i < 4; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
};

const genererCodesUniques = (existant) => {
  const codes = new Set();
  while (codes.size < 5) {
    const c = genererCode4();
    if (!existant.includes(c)) codes.add(c);
  }
  return Array.from(codes);
};

const listerEvenements = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.titre, e.date_debut, e.lieu, e.ville, e.statut,
        (SELECT COUNT(*) FROM code_controleur cc WHERE cc.evenement_id = e.id AND cc.statut = 'ACTIF') AS codes_actifs,
        (SELECT COUNT(*) FROM code_controleur cc WHERE cc.evenement_id = e.id) AS codes_total
      FROM evenement e
      ORDER BY e.date_creation DESC`
    );
    res.json(rows.map(r => ({
      id: r.id,
      nom: r.titre,
      date: new Date(r.date_debut).toLocaleDateString("fr-FR"),
      lieu: r.ville ? `${r.lieu}, ${r.ville}` : r.lieu,
      statut: r.statut,
      codes_actifs: r.codes_actifs,
      codes_total: r.codes_total,
    })));
  } catch (err) {
    console.error("Lister evenements controleurs error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const listerCodes = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id, titre FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    let [codes] = await pool.query(
      "SELECT id, code, index_controleur, statut, date_creation FROM code_controleur WHERE evenement_id = ? ORDER BY index_controleur ASC",
      [evenementId]
    );

    if (!codes.length) {
      const existing = await pool.query("SELECT code FROM code_controleur WHERE evenement_id = ?", [evenementId]);
      const existants = existing[0].map(r => r.code);
      const nouveaux = genererCodesUniques(existants);
      const values = nouveaux.map((c, i) => [c, evenementId, i]);
      await pool.query("INSERT INTO code_controleur (code, evenement_id, index_controleur) VALUES ?", [values]);
      [codes] = await pool.query(
        "SELECT id, code, index_controleur, statut, date_creation FROM code_controleur WHERE evenement_id = ? ORDER BY index_controleur ASC",
        [evenementId]
      );
    }

    res.json({ evenement: evenement[0], codes });
  } catch (err) {
    console.error("Lister codes controleur error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const regenerer = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    await pool.query("UPDATE code_controleur SET statut = 'INACTIF' WHERE evenement_id = ? AND statut = 'ACTIF'", [evenementId]);

    const existing = await pool.query("SELECT code FROM code_controleur WHERE evenement_id = ?", [evenementId]);
    const existants = existing[0].map(r => r.code);
    const nouveaux = genererCodesUniques(existants);
    const values = nouveaux.map((c, i) => [c, evenementId, i]);
    await pool.query("INSERT INTO code_controleur (code, evenement_id, index_controleur) VALUES ?", [values]);

    const [codes] = await pool.query(
      "SELECT id, code, index_controleur, statut, date_creation FROM code_controleur WHERE evenement_id = ? ORDER BY index_controleur ASC",
      [evenementId]
    );

    res.json({ message: "5 nouveaux codes générés avec succès", codes });
  } catch (err) {
    console.error("Regenerer codes error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

const desactiverTous = async (req, res) => {
  try {
    const { evenementId } = req.params;
    const [evenement] = await pool.query("SELECT id FROM evenement WHERE id = ?", [evenementId]);
    if (!evenement.length) return res.status(404).json({ message: "Événement introuvable" });

    await pool.query("UPDATE code_controleur SET statut = 'INACTIF' WHERE evenement_id = ? AND statut = 'ACTIF'", [evenementId]);

    res.json({ message: "Tous les codes ont été désactivés" });
  } catch (err) {
    console.error("Desactiver codes error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { listerEvenements, listerCodes, regenerer, desactiverTous };
