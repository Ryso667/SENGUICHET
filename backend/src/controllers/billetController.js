// Contrôleur des billets : achat et consultation
// POST /api/billets/acheter — crée billet + transaction + initie paiement
// GET /api/billets/mes-billets — liste les billets d'un téléphone

const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const PaymentService = require("../services/PaymentService");
const { envoyerNotification } = require("../services/NotificationService");

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
      "SELECT id, titre, lieu, date_debut, date_fin, organisateur_id FROM evenement WHERE id = ? AND statut = 'actif'",
      [evenementId]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable ou inactif" });
    const event = events[0];
    if (event.date_fin && new Date(event.date_fin) < new Date()) {
      return res.status(400).json({ message: "Cet événement est déjà terminé" });
    }

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

      // Créer autant de billets que la quantité demandée (1 billet = 1 QR)
      const billetsCrees = [];
      for (let i = 0; i < quantite; i++) {
        const uuid = uuidv4();
        const numero = `TKT-${Date.now().toString(36).toUpperCase()}-${i}`;
        const timestamp = new Date().toISOString();

        // Générer la signature HMAC (identique au format utilisé par le scan offline)
        const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${cat.nom}`;
        const payload_signature = crypto.createHash('sha256').update(signaturePayload + HMAC_SECRET).digest('hex');

        const [billetResult] = await conn.query(
          `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, email_acheteur, payload_signature, prix_paye, statut)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
          [uuid, numero, evenementId, categorieTicketId, telephone, ticketEmail || null, payload_signature, cat.prix]
        );

        billetsCrees.push({
          id: billetResult.insertId,
          uuid,
          numero,
          prix: cat.prix,
          evenement: event.titre,
          categorie: cat.nom,
          dateAchat: timestamp,
          qrPayload: JSON.stringify({
            uuid,
            hmac: payload_signature,
            event_id: evenementId,
            category: cat.nom,
            timestamp,
            transaction_ref: numero,
          }),
        });
      }

      // Réserver les places (une seule fois pour toutes les quantités)
      await conn.query(
        "UPDATE categorie_ticket SET places_disponibles = places_disponibles - ? WHERE id = ? AND places_disponibles >= ?",
        [quantite, categorieTicketId, quantite]
      );

      // Créer une transaction unique pour le montant total
      const reference = 'PAI-' + uuidv4().slice(0, 12).toUpperCase();
      const premierBilletId = billetsCrees[0].id;
      await conn.query(
        `INSERT INTO transaction (reference, billet_id, montant, frais, devise, statut, moyen_paiement, telephone_payeur)
         VALUES (?, ?, ?, 0, 'FCFA', 'PENDING', ?, ?)`,
        [reference, premierBilletId, montantTotal, provider, telephone]
      );

      // Rattacher la transaction à TOUS les billets créés
      const [txRows] = await conn.query("SELECT id FROM transaction WHERE reference = ?", [reference]);
      for (const b of billetsCrees) {
        await conn.query("UPDATE billet SET transaction_id = ? WHERE id = ?", [txRows[0].id, b.id]);
      }

      await conn.commit();

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
        if (!paymentResult.redirectUrl) {
          await pool.query(
            "UPDATE transaction SET statut = 'SUCCESS', date_mise_a_jour = NOW() WHERE reference = ?",
            [reference]
          );
          const ids = billetsCrees.map(b => b.id);
          await pool.query(
            `UPDATE billet SET statut = 'ACTIF' WHERE id IN (${ids.map(() => '?').join(',')})`,
            ids
          );
        }
      } catch (paymentError) {
        console.error("Payment initiation error:", paymentError);
        paymentResult = { redirectUrl: null, referenceOperateur: null };
      }

      // Contenu du QR code (premier billet)
      const premierBillet = billetsCrees[0];

      // Envoyer un SMS de confirmation à l'acheteur (fire-and-forget)
      const { envoyerSMSBillet } = require("../services/smsService");
      envoyerSMSBillet(telephone, {
        evenement: events[0].titre,
        categorie: cat.nom,
        prix: montantTotal,
        quantite,
        uuid: quantite === 1 ? premierBillet.uuid : undefined,
      }, pool);

      // Envoyer un email de confirmation si l'email est renseigné
      if (ticketEmail) {
        const { envoyerEmailBillet } = require("../services/emailService");
        envoyerEmailBillet(ticketEmail, {
          evenement: events[0].titre,
          dateDebut: events[0].date_debut,
          lieu: events[0].lieu,
          categorie: cat.nom,
          prix: montantTotal,
          quantite,
          tickets: billetsCrees,
        }).catch(e => console.error("Email error:", e.message));
      }

      // Envoyer une notification push à l'organisateur
      try {
        await envoyerNotification(events[0].organisateur_id, {
          type: 'vente',
          message: `Nouvelle vente : ${cat.nom} pour ${events[0].titre}`,
          evenementId: evenementId,
        });
      } catch (e) {
        console.error("Push notif error:", e.message);
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
        billet: premierBillet,
        billets: billetsCrees,
        quantite,
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
    console.error("Acheter billet error:", { message: err.message, code: err.code, sqlMessage: err.sqlMessage, stack: err.stack?.split('\n').slice(0,3).join(' ') });
    res.status(500).json({ message: `Erreur lors de l'achat${process.env.NODE_ENV !== 'production' ? `: ${err.sqlMessage || err.message}` : ''}` });
  }
};

const mesBillets = async (req, res) => {
  try {
    const { telephone, email } = req.query;
    if (!telephone && !email) return res.status(400).json({ message: "Téléphone ou email requis" });

    // Construit dynamiquement les conditions selon les paramètres fournis
    // Permet d'unionner les résultats par téléphone ET email simultanément
    const conditions = [];
    const params = [];
    if (telephone) {
      conditions.push('b.telephone_acheteur = ?');
      params.push(telephone);
    }
    if (email) {
      conditions.push('b.email_acheteur = ?');
      conditions.push('b.telephone_acheteur IN (SELECT telephone FROM acheteur WHERE email = ? AND telephone IS NOT NULL)');
      params.push(email, email);
    }

    const [rows] = await pool.query(
      `SELECT DISTINCT b.id, b.uuid, b.numero, b.prix_paye, b.statut, b.payload_signature, b.date_creation, b.telephone_acheteur,
        b.evenement_id, e.titre AS evenement_titre, e.lieu AS evenement_lieu, e.date_debut,
        ct.nom AS categorie_nom, ct.prix AS categorie_prix
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE (${conditions.join(' OR ')})
      ORDER BY b.date_creation DESC`,
      params
    );

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
      return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Billet introuvable — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#F9F6EE"><h1 style="color:#10B981;">SENGUICHET</h1><p style="color:#6EE7B7;">Billet introuvable</p></body></html>`);
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

    const qrHtml = `<img src="${qrUrl}" alt="QR" style="width:180px;height:180px;display:block" />`;
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Billet ${b.numero} - SENGUICHET</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F1A0F;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
.t{width:340px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(16,185,129,.2);position:relative}
@media print{body{background:#fff;padding:0;justify-content:center}.t{box-shadow:none;page-break-after:avoid;margin:auto}.dl{display:none!important}}
.dl{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;padding:12px 28px;border-radius:14px;border:none;font-size:14px;font-weight:600;color:#fff;background:#10B981;cursor:pointer;transition:opacity .2s;letter-spacing:.5px}
.dl:hover{opacity:.85}
.dl svg{width:18px;height:18px}
/* HEADER vert */
.hd{background:#10B981;padding:24px;position:relative;overflow:hidden}
.o1{position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:60px;background:rgba(110,231,183,.25)}
.o2{position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:40px;background:rgba(245,158,11,.12)}
.hr{display:flex;align-items:center;gap:10px}
.lb{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
.lb img{width:28px;height:28px;border-radius:6px}
.ht{font-size:10px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,.7)}
.gl{height:1px;background:#F59E0B;opacity:.6;margin:16px 0}
.en{font-size:22px;font-weight:700;color:#fff;text-align:center;letter-spacing:.5px;line-height:28px}
.ec{font-size:10px;color:rgba(255,255,255,.6);text-align:center;letter-spacing:2px;margin-top:6px}
/* PERFORATION */
.pf{height:22px;position:relative;background:linear-gradient(to bottom,#10B981,#F9F6EE);display:flex;align-items:center;justify-content:center}
.pl{position:absolute;left:22px;right:22px;border-top:2px dashed rgba(16,185,129,.2)}
.pc{position:absolute;width:22px;height:22px;border-radius:11px;background:#0F1A0F;z-index:2}
.pc.l{left:-11px}
.pc.r{right:-11px}
/* BODY creme */
.bd{background:#F9F6EE;padding:20px 24px 8px}
.br{display:flex;justify-content:space-between}
.bl{font-size:8px;font-weight:700;letter-spacing:2px;color:#6EE7B7;margin-bottom:2px}
.bv{font-size:12px;font-weight:600;color:#111827}
.ll{font-size:12px;font-weight:600;color:#10B981;letter-spacing:.5px;margin-top:2px}
.bs{height:1px;background:rgba(16,185,129,.12);margin:14px 0}
.rf{font-size:9px;color:#6EE7B7;letter-spacing:2px;text-align:center;margin-bottom:4px}
.qz{background:#fff;border-radius:12px;padding:12px;margin:14px 0;border:1px solid rgba(16,185,129,.08);display:flex;justify-content:center}
/* PERFO BASSE */
.pb{height:22px;position:relative;background:linear-gradient(to bottom,#F9F6EE,#F0EAD6);display:flex;align-items:center;justify-content:center}
/* FOOTER beige */
.ft{background:#F0EAD6;border-radius:0 0 20px 20px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}
.cp{background:#10B981;border-radius:999px;padding:5px 20px}
.ct{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#F59E0B}
.pr{font-size:28px;font-weight:700;color:#111827;letter-spacing:-.5px;text-align:center}
.ll2{font-size:9px;color:#6EE7B7;font-style:italic;text-align:center}
.wm{font-size:8px;color:rgba(16,185,129,.3);letter-spacing:2px;align-self:flex-end;margin-right:4px}
@media print{body{background:#fff;padding:0}.t{box-shadow:none}}
</style>
</head>
<body>
<div class="t">
  <div class="hd">
    <div class="o1"></div><div class="o2"></div>
    <div class="hr">
      <div class="lb"><img src="/public/logo_mobile.jpeg" alt="S" /></div>
      <div class="ht">SENGUICHET</div>
    </div>
    <div class="gl"></div>
    <div class="en">${(b.titre || '').toUpperCase()}</div>
    <div class="ec">${(b.categorie || 'STANDARD').toUpperCase()}</div>
  </div>
  <div class="pf"><div class="pl"></div><div class="pc l"></div><div class="pc r"></div></div>
  <div class="bd">
    <div class="br">
      <div><div class="bl">DATE</div><div class="bv">${dateFormatted}</div></div>
      <div style="text-align:right"><div class="bl">HEURE</div><div class="bv">${heureFormatted}</div></div>
    </div>
    <div style="margin-top:10px"><div class="bl">LIEU</div><div class="ll">${(b.lieu || '').toUpperCase()}</div></div>
    <div class="bs"></div>
    <div class="rf">REF · ${b.numero}</div>
    <div class="qz">${qrHtml}</div>
  </div>
  <div class="pb"><div class="pl"></div><div class="pc l"></div><div class="pc r"></div></div>
  <div class="ft">
    <div class="cp"><div class="ct">${(b.categorie || 'STANDARD').toUpperCase()}</div></div>
    <div class="pr">${Number(b.prix_paye).toLocaleString()} FCFA</div>
    <div class="ll2">Entrée unique et non transférable</div>
    <div class="wm">SENGUICHET</div>
  </div>
  </div>
  <button class="dl" onclick="window.print()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Télécharger le billet (PDF)</button>
</body>
</html>`);
  } catch (err) {
    console.error("Afficher billet error:", err);
    res.status(500).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Erreur — SENGUICHET</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#F9F6EE"><h1 style="color:#10B981;">SENGUICHET</h1><p style="color:#6EE7B7;">Erreur serveur</p></body></html>`);
  }
};

// Liste tous les billets vendus pour un événement (organisateur)
// GET /api/billets/evenement/:id
const evenementBillets = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT b.id, b.uuid, b.numero, b.nom_acheteur, b.email_acheteur, b.telephone_acheteur,
        b.prix_paye, b.statut, b.date_creation,
        ct.nom AS categorie_nom
      FROM billet b
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.evenement_id = ?
      ORDER BY b.date_creation DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Evenement billets error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { acheter, mesBillets, afficherBillet, evenementBillets };
