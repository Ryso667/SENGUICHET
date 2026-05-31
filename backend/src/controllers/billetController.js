// Contrôleur des billets : achat et consultation
// POST /api/billets/acheter — crée billet + transaction + initie paiement
// GET /api/billets/mes-billets — liste les billets d'un téléphone

const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const PaymentService = require("../services/PaymentService");

const HMAC_SECRET = process.env.HMAC_SECRET || 'senguichet-cle-secrete-hmac';

const acheter = async (req, res) => {
  try {
    const { evenementId, categorieTicketId, telephone, quantite = 1, provider = 'SIMULATION' } = req.body;

    if (!evenementId || !categorieTicketId || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier que l'événement existe et est actif
    const [events] = await pool.query(
      "SELECT id, titre FROM evenement WHERE id = ? AND statut = 'actif'",
      [evenementId]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable ou inactif" });

    // Vérifier la catégorie et les places disponibles
    const [categories] = await pool.query(
      "SELECT id, nom, prix, places_disponibles FROM categorie_ticket WHERE id = ? AND evenement_id = ?",
      [categorieTicketId, evenementId]
    );
    if (!categories.length) return res.status(404).json({ message: "Catégorie introuvable" });

    const cat = categories[0];
    if (cat.places_disponibles < quantite) {
      return res.status(400).json({ message: "Places insuffisantes" });
    }

    const montantTotal = cat.prix * quantite;

    // Anti-doublon : si le mobile appelle 2× (StrictMode, retry...), on ne crée pas 2 billets
    const [recent] = await pool.query(
      `SELECT b.id, b.uuid, b.numero, b.prix_paye AS prix, e.titre AS evenement, ct.nom AS categorie, b.date_creation AS dateAchat, b.payload_signature
       FROM billet b
       JOIN evenement e ON e.id = b.evenement_id
       JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
       WHERE b.evenement_id = ? AND b.categorie_ticket_id = ? AND b.telephone_acheteur = ? AND b.statut = 'ACTIF' AND b.date_creation > DATE_SUB(NOW(), INTERVAL 5 SECOND)
       LIMIT 1`,
      [evenementId, categorieTicketId, telephone]
    );
    if (recent.length > 0) {
      const existing = recent[0];
      return res.status(200).json({
        billet: {
          id: existing.id,
          uuid: existing.uuid,
          numero: existing.numero,
          prix: existing.prix,
          evenement: existing.evenement,
          categorie: existing.categorie,
          dateAchat: existing.dateAchat,
          qrPayload: existing.payload_signature,
        },
        paiement: { reference: existing.id + '-dup', redirectUrl: null, referenceOperateur: null, provider: 'DUPLICATE' },
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Créer le billet
      const uuid = uuidv4();
      const numero = `TKT-${Date.now().toString(36).toUpperCase()}`;
      const timestamp = new Date().toISOString();

      // Générer la signature HMAC (identique au format utilisé par le scan offline)
      const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${cat.nom}`;
      const payload_signature = crypto.createHmac('sha256', HMAC_SECRET).update(signaturePayload).digest('hex');

      const [billetResult] = await conn.query(
        `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, payload_signature, prix_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIF')`,
        [uuid, numero, evenementId, categorieTicketId, telephone, payload_signature, montantTotal]
      );

      const billetId = billetResult.insertId;

      // Réserver les places immédiatement
      await conn.query(
        "UPDATE categorie_ticket SET places_disponibles = places_disponibles - ? WHERE id = ? AND places_disponibles >= ?",
        [quantite, categorieTicketId, quantite]
      );

      // Créer la transaction
      const reference = 'PAI-' + uuidv4().slice(0, 12).toUpperCase();
      await conn.query(
        `INSERT INTO transaction (reference, billet_id, montant, frais, devise, statut, moyen_paiement, telephone_payeur)
         VALUES (?, ?, ?, 0, 'FCFA', 'SUCCESS', ?, ?)`,
        [reference, billetId, montantTotal, provider, telephone]
      );

      // Mettre à jour la transaction_id dans le billet
      const [txRows] = await conn.query("SELECT id FROM transaction WHERE reference = ?", [reference]);
      await conn.query("UPDATE billet SET transaction_id = ? WHERE id = ?", [txRows[0].id, billetId]);

      await conn.commit();

      // Initier le paiement via le provider (hors transaction)
      const paymentProvider = PaymentService.getProvider(provider);
      let paymentResult;
      try {
        paymentResult = await paymentProvider.initierPaiement({
          montant: montantTotal,
          devise: 'FCFA',
          reference,
          callbackUrl: `/api/paiements/notifier/${reference}`,
        });

        // Mettre à jour la référence opérateur
        if (paymentResult.referenceOperateur) {
          await pool.query(
            "UPDATE transaction SET reference_operateur = ? WHERE reference = ?",
            [paymentResult.referenceOperateur, reference]
          );
        }
      } catch (paymentError) {
        console.error("Payment initiation error:", paymentError);
        paymentResult = { redirectUrl: null, referenceOperateur: null };
      }

      // Contenu du QR code
      const qrPayload = JSON.stringify({
        uuid,
        hmac: payload_signature,
        event_id: evenementId,
        category: cat.nom,
        timestamp,
        transaction_ref: reference,
      });

      res.status(201).json({
        billet: {
          id: billetId,
          uuid,
          numero,
          prix: montantTotal,
          evenement: events[0].titre,
          categorie: cat.nom,
          dateAchat: timestamp,
          qrPayload,
        },
        paiement: {
          reference,
          redirectUrl: paymentResult.redirectUrl,
          referenceOperateur: paymentResult.referenceOperateur,
          provider,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Acheter billet error:", err);
    res.status(500).json({ message: "Erreur lors de l'achat" });
  }
};

const mesBillets = async (req, res) => {
  try {
    const { telephone } = req.query;
    if (!telephone) return res.status(400).json({ message: "Paramètre téléphone requis" });

    const [rows] = await pool.query(
      `SELECT b.id, b.uuid, b.numero, b.prix_paye, b.statut, b.payload_signature, b.date_creation, b.telephone_acheteur,
        e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
        ct.nom AS categorie_nom, ct.prix AS categorie_prix
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.telephone_acheteur = ?
      ORDER BY b.date_creation DESC`,
      [telephone]
    );

    res.json(rows.map(r => ({ ...r, statut: r.statut.toLowerCase() })));
  } catch (err) {
    console.error("Mes billets error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { acheter, mesBillets };
