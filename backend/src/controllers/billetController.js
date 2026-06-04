// Contrôleur des billets : achat et consultation
// POST /api/billets/acheter — crée billet + transaction + initie paiement
// GET /api/billets/mes-billets — liste les billets d'un téléphone

const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const PaymentService = require("../services/PaymentService");
const { envoyerEmailBillet } = require("../services/EmailService");
const { envoyerSMSBillet } = require("../services/smsService");

// HMAC_SECRET est validé au démarrage dans server.js — pas besoin de le revalider ici
const HMAC_SECRET = process.env.HMAC_SECRET;
const acheter = async (req, res) => {
  try {
    const { evenementId, categorieTicketId, telephone, quantite = 1, provider = 'WAVE', email } = req.body;

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

    // Si l'email n'est pas fourni, essayer de le trouver via le téléphone
    let ticketEmail = email;
    if (!ticketEmail && telephone) {
      try {
        const [acheteurs] = await pool.query("SELECT email FROM acheteur WHERE telephone = ? LIMIT 1", [telephone]);
        if (acheteurs.length > 0) ticketEmail = acheteurs[0].email;
      } catch (err) { console.warn("Erreur récupération email:", err.message); }
    }

    // Anti-doublon : si le mobile appelle 2× (StrictMode, retry...), on ne crée pas 2 billets
    const [recent] = await pool.query(
      `SELECT b.id, b.uuid, b.numero, b.prix_paye AS prix, e.titre AS evenement, ct.nom AS categorie, b.date_creation AS dateAchat, b.payload_signature
       FROM billet b
       JOIN evenement e ON e.id = b.evenement_id
       JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
       WHERE b.evenement_id = ? AND b.categorie_ticket_id = ? AND b.telephone_acheteur = ? AND b.statut IN ('ACTIF', 'EN_ATTENTE') AND b.date_creation > DATE_SUB(NOW(), INTERVAL 5 SECOND)
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
         VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
        [uuid, numero, evenementId, categorieTicketId, telephone, payload_signature, montantTotal]
      );

      const billetId = billetResult.insertId;

      // La décrémentation des places est gérée par le trigger SQL after_billet_insert
      // pour éviter une double décrémentation (trigger + code manuel)

      // Créer la transaction
      const reference = 'PAI-' + uuidv4().slice(0, 12).toUpperCase();
      await conn.query(
        `INSERT INTO transaction (reference, billet_id, montant, frais, devise, statut, moyen_paiement, telephone_payeur)
         VALUES (?, ?, ?, 0, 'FCFA', 'PENDING', ?, ?)`,
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
          devise: 'XOF',
          reference,
          callbackUrl: `/api/paiements/notifier/${reference}`,
          metadata: { reference },
        });

        // Mettre à jour la référence opérateur
        if (paymentResult.referenceOperateur) {
          await pool.query(
            "UPDATE transaction SET reference_operateur = ? WHERE reference = ?",
            [paymentResult.referenceOperateur, reference]
          );
        }

        // Seul le mode SIMULATION confirme immédiatement (pas de webhook disponible)
        // Pour les vrais providers (WAVE, Orange Money...), le webhook confirme le paiement
        if (provider === 'SIMULATION') {
          await pool.query(
            "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
            [reference]
          );
          await pool.query(
            "UPDATE billet SET statut = 'ACTIF' WHERE id = ?",
            [billetId]
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

      // Envoyer les notifications (email + SMS) avant de répondre
      // Requis pour Vercel serverless — le processus est coupé après la réponse
      if (ticketEmail) {
        try {
          await envoyerEmailBillet(ticketEmail, {
            uuid,
            numero,
            evenement: events[0].titre,
            categorie: cat.nom,
            prix: montantTotal,
            dateAchat: timestamp,
            qrPayload,
          });
        } catch (e) {
          console.error("Email error:", e.message);
        }
      }

      try {
        await envoyerSMSBillet(telephone, {
          uuid,
          numero,
          evenement: events[0].titre,
          categorie: cat.nom,
          prix: montantTotal,
        });
      } catch (e) {
        console.error("SMS error:", e.message);
      }

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
    const { telephone, email } = req.query;
    if (!telephone && !email) return res.status(400).json({ message: "Téléphone ou email requis" });

    let rows;
    if (telephone) {
      [rows] = await pool.query(
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
    } else {
      // Recherche par email de l'acheteur social
      [rows] = await pool.query(
        `SELECT b.id, b.uuid, b.numero, b.prix_paye, b.statut, b.payload_signature, b.date_creation, b.telephone_acheteur,
          e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
          ct.nom AS categorie_nom, ct.prix AS categorie_prix
        FROM billet b
        JOIN evenement e ON e.id = b.evenement_id
        JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
        LEFT JOIN acheteur a ON a.telephone = b.telephone_acheteur
        WHERE a.email = ? OR b.telephone_acheteur IN (
          SELECT telephone FROM acheteur WHERE email = ?
        )
        ORDER BY b.date_creation DESC`,
        [email, email]
      );
    }

    res.json(rows.map(r => ({ ...r, statut: r.statut.toLowerCase() })));
  } catch (err) {
    console.error("Mes billets error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

// Affiche une page HTML publique avec les infos du billet
// GET /api/billets/:uuid
const afficherBillet = async (req, res) => {
  try {
    const { uuid } = req.params;

    const [rows] = await pool.query(
      `SELECT b.uuid, b.numero, b.prix_paye, b.statut, b.date_creation, b.telephone_acheteur,
        b.payload_signature, e.titre, e.lieu, e.date_debut, e.affiche_url, ct.nom AS categorie
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.uuid = ?`,
      [uuid]
    );

    if (!rows.length) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#f8f9fd">
          <h1 style="color:#6366F1;">SENGUICHET</h1>
          <p style="color:#94a3b8;">Billet introuvable</p>
        </body></html>
      `);
    }

    const b = rows[0];
    const dateEvent = new Date(b.date_debut).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const dateAchat = new Date(b.date_creation).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const statut = b.statut === "ACTIF" ? "✅ Valide" : "⏳ En attente";

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billet ${b.numero} — SENGUICHET</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8f9fd; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .card { background: white; border-radius: 20px; max-width: 420px; width: 100%; box-shadow: 0 4px 24px rgba(99,102,241,0.12); overflow: hidden; }
          .header { background: linear-gradient(135deg, #6366F1, #EC4899); padding: 32px 24px; text-align: center; }
          .header h1 { color: white; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px; }
          .header .numero { color: white; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
          .body { padding: 24px; }
          .statut { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
          .field { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .field:last-child { border: none; }
          .field .label { color: #64748b; font-size: 13px; }
          .field .value { color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; max-width: 60%; }
          .footer { text-align: center; padding: 20px 24px; background: #f8f9fd; color: #94a3b8; font-size: 12px; }
          .qr { text-align: center; margin: 20px 0; }
          .qr img { width: 160px; height: 160px; border-radius: 12px; }
          @media print { .card { box-shadow: none; border: 1px solid #e2e8f0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>SENGUICHET</h1>
            <div class="numero">${b.numero}</div>
          </div>
          <div class="body">
            <div class="statut">${statut}</div>
            <div class="field"><span class="label">Événement</span><span class="value">${b.titre}</span></div>
            <div class="field"><span class="label">Date</span><span class="value">${dateEvent}</span></div>
            <div class="field"><span class="label">Lieu</span><span class="value">${b.lieu}</span></div>
            <div class="field"><span class="label">Catégorie</span><span class="value">${b.categorie}</span></div>
            <div class="field"><span class="label">Prix</span><span class="value">${b.prix_paye.toLocaleString()} FCFA</span></div>
            <div class="field"><span class="label">Acheté le</span><span class="value">${dateAchat}</span></div>
          </div>
          <div class="footer">
            SENGUICHET — Billeterie événementielle<br>
            Présente ce billet à l'entrée depuis l'application.
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Afficher billet error:", err);
    res.status(500).send("<html><body><p>Erreur serveur</p></body></html>");
  }
};

module.exports = { acheter, mesBillets, afficherBillet };
