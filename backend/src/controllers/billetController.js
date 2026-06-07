// Contrôleur des billets : achat et consultation
// POST /api/billets/acheter — crée billet + transaction + initie paiement
// GET /api/billets/mes-billets — liste les billets d'un téléphone

const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const PaymentService = require("../services/PaymentService");

const HMAC_SECRET = process.env.HMAC_SECRET;
if (!HMAC_SECRET) console.warn('⚠️  HMAC_SECRET non défini — les signatures QR échoueront');

const acheter = async (req, res) => {
  try {
    const { evenementId, categorieTicketId, telephone, quantite = 1, provider = 'WAVE', email } = req.body;

    if (!evenementId || !categorieTicketId || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier que l'événement existe et est actif
    const [events] = await pool.query(
      "SELECT id, titre, lieu, date_debut FROM evenement WHERE id = ? AND statut = 'actif'",
      [evenementId]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable ou inactif" });

    // Vérifier la catégorie et les places disponibles
    const [categories] = await pool.query(
      "SELECT id, nom, prix, places_disponibles, couleur_hex FROM categorie_ticket WHERE id = ? AND evenement_id = ?",
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
      } catch {}
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
      // Utilise SHA256(data+secret) car expo-crypto ne supporte pas HMAC natif
      const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${cat.nom}`;
      const payload_signature = crypto.createHash('sha256').update(signaturePayload + HMAC_SECRET).digest('hex');

      const [billetResult] = await conn.query(
        `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, email_acheteur, payload_signature, prix_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
        [uuid, numero, evenementId, categorieTicketId, telephone, ticketEmail || null, payload_signature, montantTotal]
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

        // Si pas de redirectUrl (mode simulation/sync), confirmer immédiatement
        // Évite que le billet reste bloqué en EN_ATTENTE sans réponse asynchrone
        if (!paymentResult.redirectUrl) {
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
        transaction_ref: numero,
      });

      // Envoyer les notifications (email + SMS) avant de répondre
      // Requis pour Vercel serverless — le processus est coupé après la réponse
      if (ticketEmail) {
        try {
          const { envoyerEmailBillet } = require("../services/emailService");
          await envoyerEmailBillet(ticketEmail, {
            uuid,
            numero,
            evenement: events[0].titre,
            categorie: cat.nom,
            prix: montantTotal,
            dateAchat: timestamp,
            lieu: events[0].lieu,
            dateDebut: events[0].date_debut,
            couleurHex: cat.couleur_hex,
            qrPayload,
          });
        } catch (e) {
          console.error("Email error:", e.message);
        }
      }

      try {
        const { envoyerSMSBillet } = require("../services/smsService");
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

      // Lier l'acheteur au téléphone pour que la recherche par email fonctionne
      if (ticketEmail && telephone) {
        try {
          await pool.query(
            "UPDATE acheteur SET telephone = ? WHERE email = ? AND telephone IS NULL",
            [telephone, ticketEmail]
          );
        } catch {}
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
          b.evenement_id, e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
          ct.nom AS categorie_nom, ct.prix AS categorie_prix
        FROM billet b
        JOIN evenement e ON e.id = b.evenement_id
        JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
        WHERE b.telephone_acheteur = ?
        ORDER BY b.date_creation DESC`,
        [telephone]
      );
    } else {
      // Recherche par email de l'acheteur
      // 1) email_acheteur sur le billet (nouveaux achats)
      // 2) telephone via la table acheteur (si renseigné)
      // 3) téléphone direct (legacy)
      [rows] = await pool.query(
        `SELECT b.id, b.uuid, b.numero, b.prix_paye, b.statut, b.payload_signature, b.date_creation, b.telephone_acheteur,
          b.evenement_id, e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
          ct.nom AS categorie_nom, ct.prix AS categorie_prix
        FROM billet b
        JOIN evenement e ON e.id = b.evenement_id
        JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
        WHERE b.email_acheteur = ?
           OR b.telephone_acheteur IN (SELECT telephone FROM acheteur WHERE email = ? AND telephone IS NOT NULL)
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

// Affiche une page HTML publique du billet (design épuré type ticket physique)
// Dimensions 340×640px, 3 zones : QR 180px, infos+prix, mentions légales
// GET /api/billets/:uuid
const afficherBillet = async (req, res) => {
  try {
    const { uuid } = req.params;

    const [rows] = await pool.query(
      `SELECT b.uuid, b.numero, b.prix_paye, b.statut, b.date_creation, b.telephone_acheteur,
        b.payload_signature, b.evenement_id, e.titre, e.lieu, e.date_debut, e.affiche_url, ct.nom AS categorie,
        ct.couleur_hex
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.uuid = ?`,
      [uuid]
    );

    if (!rows.length) {
      return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Billet introuvable — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#f8f9fd"><h1 style="color:#6366F1;">SENGUICHET</h1><p style="color:#94a3b8;">Billet introuvable</p></body></html>`);
    }

    const b = rows[0];
    const dateFormatted = new Date(b.date_debut).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });
    const heureFormatted = new Date(b.date_debut).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });
    const dateAchat = new Date(b.date_creation).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const qrPayload = JSON.stringify({
      uuid: b.uuid,
      hmac: b.payload_signature,
      event_id: b.evenement_id,
      category: b.categorie,
      timestamp: b.date_creation,
      transaction_ref: b.numero,
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Billet ${b.numero} — SENGUICHET</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .tk {
    width: 340px; height: 640px;
    background: #fff; border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    display: flex; flex-direction: column;
    overflow: hidden; position: relative;
    border: 1px solid #E5E7EB;
  }
  /* Z1: QR + ID */
  .z1 {
    height: 260px; background: #fff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative;
    border-bottom: 2px dashed #D1D5DB;
  }
  .z1 img { width: 180px; height: 180px; }
  .z1 .ref { font-family: monospace; font-size: 12px; color: #6B7280; letter-spacing: 1.5px; margin-top: 8px; }
  .z1 .notch { position: absolute; bottom: -12px; width: 24px; height: 24px; border-radius: 50%; background: #f0f2f5; }
  .z1 .nl { left: -12px; }
  .z1 .nr { right: -12px; }
  /* Z2: Infos + prix */
  .z2 {
    height: 280px; padding: 24px;
    display: flex; align-items: center; position: relative;
  }
  .z2 .wm {
    position: absolute; right: 5px; top: 30px;
    font-size: 140px; font-weight: 900; color: rgba(0,0,0,0.02);
    pointer-events: none; user-select: none;
  }
  .z2 .body {
    display: flex; width: 100%; align-items: flex-start; z-index: 1;
  }
  .z2 .left {
    flex: 1; max-width: 70%; padding-right: 16px;
  }
  .z2 .left h2 {
    font-size: 18px; font-weight: 800; color: #030712;
    letter-spacing: -0.3px; line-height: 1.3; margin: 0 0 8px; text-transform: uppercase;
  }
  .z2 .left .dt { font-size: 12px; color: #4B5563; margin: 0 0 4px; }
  .z2 .left .loc { font-size: 12px; color: #6B7280; margin: 0; }
  .z2 .sep {
    width: 1px; height: 120px; background: #E5E7EB;
    align-self: center; flex-shrink: 0;
  }
  .z2 .right {
    width: 80px; padding-left: 16px;
    display: flex; flex-direction: column; align-items: flex-end;
    justify-content: center; height: 120px; align-self: center;
  }
  .z2 .right .lb { font-size: 10px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 4px; }
  .z2 .right .pr { font-size: 14px; font-weight: 700; color: #111827; white-space: nowrap; }
  /* Z3: Mentions */
  .z3 {
    height: 100px; padding: 16px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #F9FAFB; border-top: 1px solid #F3F4F6;
    text-align: center;
  }
  .z3 .br { font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 4px; }
  .z3 .lg { font-size: 9px; color: #9CA3AF; margin: 0 0 2px; line-height: 1.3; }
  .z3 .dt { font-size: 8px; color: #B0B7C3; margin: 0; }
  @media (max-width: 380px) {
    .tk { width: 90vw; height: auto; min-height: 170vw; }
    .z1 { height: auto; min-height: 70vw; padding: 4vw; }
    .z1 img { width: 50vw; height: 50vw; }
    .z2 { height: auto; min-height: 80vw; padding: 4vw; }
    .z2 .left h2 { font-size: 4.5vw; }
    .z3 { height: auto; min-height: 25vw; padding: 3vw; }
    .z1 .notch { display: none; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .tk { box-shadow: none; border-radius: 0; margin: 0 auto; }
    @page { margin: 0; size: 340px 640px; }
  }
</style>
</head>
<body>
<div class="tk">
  <div class="z1">
    <img src="${qrUrl}" alt="QR billet" />
    <div class="ref">#${b.numero}</div>
    <div class="notch nl"></div>
    <div class="notch nr"></div>
  </div>
  <div class="z2">
    <div class="wm">S</div>
    <div class="body">
      <div class="left">
        <h2>${b.titre.toUpperCase()}</h2>
        <p class="dt">${dateFormatted} à ${heureFormatted}</p>
        <p class="loc">${b.lieu ? b.lieu.toUpperCase() : ''}</p>
      </div>
      <div class="sep"></div>
      <div class="right">
        <p class="lb">Prix</p>
        <p class="pr">${b.prix_paye.toLocaleString()} FCFA</p>
      </div>
    </div>
  </div>
  <div class="z3">
    <p class="br">SENGUICHET</p>
    <p class="lg">Billetterie événementielle • Entrée unique et non transférable</p>
    <p class="dt">Acheté le ${dateAchat}</p>
  </div>
</div>
</body>
</html>`);
  } catch (err) {
    console.error("Afficher billet error:", err);
    res.status(500).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Erreur — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#f8f9fd"><h1 style="color:#6366F1;">SENGUICHET</h1><p style="color:#94a3b8;">Erreur serveur</p></body></html>`);
  }
};

module.exports = { acheter, mesBillets, afficherBillet };
