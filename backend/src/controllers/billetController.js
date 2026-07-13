/**
 * Contrôleur des billets : achat, consultation multi-billets, reçu groupé
 * POST /api/billets/acheter       — crée N billets + 1 transaction + initie paiement
 * GET  /api/billets/mes-billets   — liste des billets (téléphone/email)
 * GET  /api/billets/recu/:ref     — page HTML du reçu groupé (tous les QR)
 * GET  /api/billets/recu/:ref/data — JSON du reçu pour mobile
 * GET  /api/billets/:uuid         — page HTML d'un billet
 */

const pool = require("../config/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const PaymentService = require("../services/PaymentService");
const { envoyerNotification } = require("../services/NotificationService");

const HMAC_SECRET = process.env.HMAC_SECRET;
if (!HMAC_SECRET) console.warn('⚠️  HMAC_SECRET non défini — les signatures QR échoueront');

/**
 * Crée un ou plusieurs billets pour une même transaction
 * POST /api/billets/acheter
 * body : { evenementId, categorieTicketId, telephone, quantite (default 1), provider, email }
 * Retourne le premier billet, la liste complète, le lien de reçu et les infos de paiement
 */
const acheter = async (req, res) => {
  try {
    const { evenementId, categorieTicketId, telephone, quantite = 1, provider = 'WAVE', email, pushToken, categories: categoriesReq } = req.body;
    const promoId = req.body.promoId || null;
    const isMulti = Array.isArray(categoriesReq) && categoriesReq.length > 0;

    if (!evenementId || !telephone) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }
    if (!isMulti && !categorieTicketId) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Vérifier que l'événement existe, est actif et n'est pas terminé
    const [events] = await pool.query(
      "SELECT id, titre, lieu, date_debut, date_fin, organisateur_id FROM evenement WHERE id = ? AND statut = 'actif'",
      [evenementId]
    );
    if (!events.length) return res.status(404).json({ message: "Événement introuvable ou inactif" });
    const event = events[0];
    if (event.date_fin && new Date(event.date_fin) < new Date()) {
      return res.status(400).json({ message: "Cet événement est déjà terminé" });
    }

    // Construire la liste des catégories à traiter (une seule ou plusieurs)
    const achatsCategories = isMulti
      ? categoriesReq
      : [{ categorieTicketId, quantite }];

    // Vérifier toutes les catégories et leurs places
    const catsData = [];
    for (const achat of achatsCategories) {
      const [catRows] = await pool.query(
        "SELECT id, nom, prix, places_disponibles FROM categorie_ticket WHERE id = ? AND evenement_id = ?",
        [achat.categorieTicketId, evenementId]
      );
      if (!catRows.length) {
        return res.status(404).json({ message: `Catégorie id ${achat.categorieTicketId} introuvable` });
      }
      const cat = catRows[0];
      if (cat.places_disponibles < achat.quantite) {
        return res.status(400).json({ message: `Places insuffisantes pour ${cat.nom}` });
      }
      catsData.push({ ...cat, quantiteDemandee: achat.quantite });
    }

    let montantTotal = catsData.reduce((sum, c) => sum + c.prix * c.quantiteDemandee, 0);
    const quantiteTotal = catsData.reduce((sum, c) => sum + c.quantiteDemandee, 0);
    let reduction = 0;

    // Appliquer réduction code promo si fourni (sur le montant total)
    if (promoId) {
      const [promos] = await pool.query(
        `SELECT * FROM code_promo WHERE id = ? AND actif = 1
         AND date_expiration > NOW()
         AND (utilisations_max = 0 OR utilisations_actuelles < utilisations_max)`,
        [promoId]
      );
      if (promos.length > 0) {
        const promo = promos[0];
        reduction = promo.type === 'pourcentage'
          ? Math.round(montantTotal * promo.valeur / 100)
          : Math.min(Number(promo.valeur), montantTotal);
        montantTotal -= reduction;
        await pool.query('UPDATE code_promo SET utilisations_actuelles = utilisations_actuelles + 1 WHERE id = ?', [promoId]);
      }
    }

    // Si l'email n'est pas fourni, essayer de le trouver via le téléphone
    let ticketEmail = email;
    if (!ticketEmail && telephone) {
      try {
        const [acheteurs] = await pool.query("SELECT email FROM acheteur WHERE telephone = ? LIMIT 1", [telephone]);
        if (acheteurs.length > 0) ticketEmail = acheteurs[0].email;
      } catch {}
    }

    // Anti-doublon : ne s'applique qu'aux achats mono-catégorie (retry StrictMode)
    if (!isMulti) {
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
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Créer les billets pour chaque catégorie
      const billetsCrees = [];
      const billetsParCategorie = {};
      const nowBase36 = Date.now().toString(36).toUpperCase();
      let ticketIdx = 0;

      for (const achat of catsData) {
        const groupe = [];
        for (let i = 0; i < achat.quantiteDemandee; i++) {
          const uuid = crypto.randomUUID();
          const numero = `TKT-${nowBase36}-${ticketIdx}`;
          const timestamp = new Date().toISOString();

          const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${achat.nom}`;
          const payload_signature = crypto.createHash('sha256').update(signaturePayload + HMAC_SECRET).digest('hex');

          const [billetResult] = await conn.query(
            `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, email_acheteur, payload_signature, prix_paye, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
            [uuid, numero, evenementId, achat.id, telephone, ticketEmail || null, payload_signature, achat.prix]
          );

          const billetData = {
            id: billetResult.insertId,
            uuid,
            numero,
            prix: achat.prix,
            evenement: event.titre,
            categorie: achat.nom,
            dateAchat: timestamp,
            qrPayload: JSON.stringify({
              uuid,
              hmac: payload_signature,
              event_id: evenementId,
              category: achat.nom,
              timestamp,
              transaction_ref: numero,
            }),
          };
          billetsCrees.push(billetData);
          groupe.push(billetData);
          ticketIdx++;
        }

        // Réserver les places pour cette catégorie
        await conn.query(
          "UPDATE categorie_ticket SET places_disponibles = places_disponibles - ? WHERE id = ? AND places_disponibles >= ?",
          [achat.quantiteDemandee, achat.id, achat.quantiteDemandee]
        );

        billetsParCategorie[achat.nom] = {
          nom: achat.nom,
          quantite: achat.quantiteDemandee,
          prixUnitaire: achat.prix,
          tickets: groupe,
        };
      }

      // Créer une transaction unique pour le montant total
      const reference = 'PAI-' + crypto.randomUUID().slice(0, 12).toUpperCase();
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

        if (paymentResult.referenceOperateur) {
          await pool.query(
            "UPDATE transaction SET reference_operateur = ? WHERE reference = ?",
            [paymentResult.referenceOperateur, reference]
          );
        }

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

      const premierBillet = billetsCrees[0];
      const premiereCategorie = catsData[0];

      // Envoyer un SMS (fire-and-forget)
      const { envoyerSMSBillet } = require("../services/smsService");
      envoyerSMSBillet(telephone, {
        uuid: premierBillet.uuid,
        numero: premierBillet.numero,
        evenement: event.titre,
        categorie: premiereCategorie.nom,
        prix: montantTotal,
        quantite: quantiteTotal,
        reference: quantiteTotal > 1 ? reference : undefined,
      }, pool);

      // Préparer les données des catégories pour l'email et la notification
      const categoriesEmail = Object.values(billetsParCategorie).map(g => ({
        nom: g.nom,
        quantite: g.quantite,
        prixUnitaire: g.prixUnitaire,
        tickets: g.tickets,
      }));

      // Envoyer un email unique avec toutes les catégories groupées
      if (ticketEmail) {
        try {
          const { envoyerEmailMultiCat } = require("../services/emailService");
          await envoyerEmailMultiCat(ticketEmail, {
            evenement: event.titre,
            dateDebut: event.date_debut,
            lieu: event.lieu,
            categories: categoriesEmail,
            prixTotal: montantTotal,
            quantiteTotal,
          });
        } catch (e) {
          console.error("Email error:", e.message);
        }
      }

      // Envoyer une notification push de confirmation à l'acheteur si token enregistré
      if (pushToken) {
        try {
          const { envoyerPushAcheteur } = require("../services/NotificationService");
          await envoyerPushAcheteur(
            pushToken,
            "🎫 Billet confirmé",
            `Votre billet pour ${event.titre} est confirmé !`,
            { screen: "RecuAchat", billetId: premierBillet.id }
          );
        } catch (pushErr) {
          console.warn("Push acheteur non envoyé:", pushErr.message);
        }
      }

      // Notification push à l'organisateur
      try {
        await envoyerNotification(event.organisateur_id, {
          type: 'vente',
          message: `Nouvelle vente : ${categoriesEmail.map(c => `${c.nom}×${c.quantite}`).join(', ')} pour ${event.titre}`,
          evenementId: evenementId,
        });
      } catch (e) {
        console.error("Push notif error:", e.message);
      }

      // Lier l'acheteur au téléphone pour que la recherche par email fonctionne
      // Met à jour aussi les téléphones synthétiques (créés par OTP) avec le vrai numéro
      if (ticketEmail && telephone) {
        try {
          await pool.query(
            "UPDATE acheteur SET telephone = ? WHERE email = ? AND (telephone IS NULL OR telephone REGEXP '[^0-9]')",
            [telephone, ticketEmail]
          );
        } catch {}
      }

      const ticketBase = process.env.TICKET_URL || "https://backend-beta-six-39.vercel.app/api/billets";
      const lienBillet = quantiteTotal === 1
        ? `${ticketBase}/${premierBillet.uuid}`
        : `${ticketBase}/recu/${reference}`;

      res.status(201).json({
        billet: premierBillet,
        billets: billetsCrees,
        quantite: quantiteTotal,
        categories: Object.values(billetsParCategorie).map(g => ({
          nom: g.nom,
          quantite: g.quantite,
          prixUnitaire: g.prixUnitaire,
        })),
        lien: lienBillet,
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

    // Auth optionnelle : si un token JWT est présent, on récupère l'acheteur_id
    let acheteurId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'ACHETEUR') acheteurId = decoded.id;
      } catch {}
    }

    if (!telephone && !email && !acheteurId) {
      return res.status(400).json({ message: "Authentification ou téléphone/email requis" });
    }

    // Construit dynamiquement les conditions selon les paramètres fournis
    const conditions = [];
    const params = [];
    if (acheteurId) {
      conditions.push('b.acheteur_id = ?');
      params.push(acheteurId);
    }
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
    const maintenant = new Date().toISOString();
    const donneesSig = `${b.uuid}|${b.numero}|${maintenant}|${b.evenement_id}|${b.categorie}`;
    const hmac = crypto.createHash('sha256').update(donneesSig + HMAC_SECRET).digest('hex');
    const qrPayload = JSON.stringify({
      uuid: b.uuid,
      hmac,
      event_id: b.evenement_id,
      category: b.categorie,
      timestamp: maintenant,
      transaction_ref: b.numero,
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

    const qrHtml = `<img src="${qrUrl}" alt="QR" style="width:200px;height:200px;display:block" />`;
    const statut = (b.statut || '').toLowerCase()
    const isUsed = statut === 'utilise'
    const isExpired = statut === 'expire'
    const showWatermark = isUsed || isExpired
    const watermarkLabel = isExpired ? 'EXPIRÉ' : 'UTILISÉ'
    const watermarkColor = isExpired ? '#FF4D6D' : '#66BB6A'
    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Billet ${b.numero} - SENGUICHET</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F1A0F;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;font-family:'Outfit','Segoe UI',system-ui,sans-serif;gap:20px}
.t{width:min(420px,92vw);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(16,185,129,.2);position:relative}
.dl{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;padding:14px 32px;border-radius:14px;border:none;font-size:15px;font-weight:600;color:#fff;background:#10B981;cursor:pointer;transition:opacity .2s;letter-spacing:.5px}
.dl:hover{opacity:.85}
.dl svg{width:20px;height:20px}
/* HEADER */
.hd{background:#10B981;padding:32px 28px;position:relative;overflow:hidden}
.o1{position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:70px;background:rgba(16,185,129,.3)}
.o2{position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;border-radius:50px;background:rgba(245,158,11,.12)}
.o3{position:absolute;top:60px;left:-20px;width:60px;height:60px;border-radius:30px;background:rgba(255,255,255,.03)}
.hr{display:flex;align-items:center;gap:10px}
.lb{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;overflow:hidden}
.lb img{width:28px;height:28px;border-radius:6px}
.ht{font-size:10px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,.7)}
.gl{height:1px;background:#F59E0B;opacity:.5;margin:20px 0 18px}
.en{font-size:22px;font-weight:700;color:#fff;text-align:center;letter-spacing:.5px;line-height:28px}
.ec{align-self:center;background:rgba(245,158,11,.15);border-radius:999px;padding:4px 14px;margin-top:10px;font-size:9px;font-weight:700;letter-spacing:2px;color:#F59E0B;display:inline-block}
/* PERFORATION */
.pf{height:24px;position:relative;background:linear-gradient(to bottom,#10B981,#F9F6EE);display:flex;align-items:center;justify-content:center}
.pl{position:absolute;left:22px;right:22px;border-top:2px dashed rgba(16,185,129,.2)}
.pc{position:absolute;width:24px;height:24px;border-radius:12px;background:#0F1A0F;z-index:2;top:50%;margin-top:-12px}
.pc.l{left:-12px}.pc.r{right:-12px}
/* CORPS */
.bd{background:#F9F6EE;padding:28px 28px 16px}
.ir{display:flex;justify-content:space-between;margin-bottom:4px}
.ir-r{text-align:right}
.il{font-size:10px;font-weight:700;letter-spacing:2px;color:#6EE7B7;margin-bottom:4px}
.iv{font-size:15px;font-weight:600;color:#111827}
.lb2{margin-top:14px}
.ll{font-size:13px;font-weight:600;color:#6EE7B7;letter-spacing:.5px}
.bs{height:1px;background:rgba(17,24,39,.08);margin:18px 0}
.rf{font-size:9px;color:#6EE7B7;letter-spacing:2px;text-align:center;margin-bottom:6px}
.qz{background:#fff;border-radius:12px;padding:16px;margin:10px 0 6px;border:1px solid rgba(16,185,129,.08);display:flex;justify-content:center;position:relative;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.qz img{width:180px;height:180px;display:block}
.qo{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,.9);border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;font-weight:700;z-index:3}
/* PERFO BASSE */
.pb{height:24px;position:relative;background:linear-gradient(to bottom,#F9F6EE,#F0EAD6);display:flex;align-items:center;justify-content:center}
/* FOOTER */
.ft{background:#F0EAD6;border-radius:0 0 20px 20px;padding:24px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;position:relative}
.cp{background:#10B981;border-radius:999px;padding:6px 24px}
.ct{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#F59E0B}
.pr{font-size:28px;font-weight:700;color:#111827;letter-spacing:-.5px;text-align:center}
.ll2{font-size:9px;color:#6EE7B7;font-style:italic;text-align:center}
.wm{font-size:8px;color:rgba(17,24,39,.25);letter-spacing:3px;align-self:flex-end;margin-top:4px}
/* WATERMARK DIAGONAL (EXPIRÉ / UTILISÉ) */
.wt{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}
.wt span{font-size:60px;font-weight:800;letter-spacing:8px;opacity:.12;transform:rotate(-30deg)}
/* LOADING */
.loading{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,26,15,0.85);z-index:999;justify-content:center;align-items:center;flex-direction:column;gap:16px}
.loading.show{display:flex}
.loading .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:#D4AF37;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading p{color:#D4AF37;font-size:14px;font-weight:600;letter-spacing:1px}
@media print{body{background:#fff;padding:0;gap:0;min-height:auto;justify-content:flex-start}.t{box-shadow:none;page-break-inside:avoid}.dl{display:none!important}}
</style>
</head>
<body>
<div class="t" style="${showWatermark ? 'overflow:hidden' : ''}">
  <!-- HEADER -->
  <div class="hd">
    <div class="o1"></div><div class="o2"></div><div class="o3"></div>
    <div class="hr">
      <div class="lb"><img src="/public/logo.png" alt="S" /></div>
      <div class="ht">SENGUICHET</div>
    </div>
    <div class="gl"></div>
    <div class="en">${(b.titre || '').toUpperCase()}</div>
    <div class="ec">${(b.categorie || 'STANDARD').toUpperCase()}</div>
  </div>

  <!-- PERFORATION HAUTE -->
  <div class="pf">
    <div class="pl"></div>
    <div class="pc l"></div><div class="pc r"></div>
  </div>

  <!-- CORPS -->
  <div class="bd">
    <div class="ir">
      <div><div class="il">DATE</div><div class="iv">${dateFormatted}</div></div>
      <div class="ir-r"><div class="il">HEURE</div><div class="iv">${heureFormatted}</div></div>
    </div>
    <div class="lb2"><div class="il">LIEU</div><div class="ll">${(b.lieu || '').toUpperCase()}</div></div>
    <div class="bs"></div>
    <div class="rf">REF · ${b.numero}</div>
    <div class="qz">
      ${qrHtml}
      ${showWatermark ? '<div class="qo">✕</div>' : ''}
    </div>
  </div>

  <!-- PERFORATION BASSE -->
  <div class="pb">
    <div class="pl"></div>
    <div class="pc l"></div><div class="pc r"></div>
  </div>

  <!-- FOOTER -->
  <div class="ft">
    <div class="cp"><div class="ct">${(b.categorie || 'STANDARD').toUpperCase()}</div></div>
    <div class="pr">${Number(b.prix_paye).toLocaleString()} FCFA</div>
    <div class="ll2">Entrée unique · Non transférable</div>
    <div class="wm">SENGUICHET</div>
    ${showWatermark ? `<div class="wt"><span style="color:${watermarkColor}">${watermarkLabel}</span></div>` : ''}
  </div>
</div>
<div id="loading" class="loading"><div class="spinner"></div><p>Génération du PDF...</p></div>
<button class="dl" onclick="telechargerPDF()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Télécharger le billet (PDF)</button>
<script>
function telechargerPDF() {
  var el = document.querySelector('.t');
  var loading = document.getElementById('loading');
  loading.classList.add('show');
  var opt = {
    margin: 0,
    filename: 'Billet-${b.numero}.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0F1A0F' },
    jsPDF: { unit: 'mm', format: [210, 130], orientation: 'landscape' }
  };
  html2pdf().set(opt).from(el).toPdf().get('pdf').then(function(pdf) {
    var blob = pdf.output('blob');
    var file = new File([blob], 'Billet-${b.numero}.pdf', { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Mon billet SENGUICHET' }).then(function() {
        loading.classList.remove('show');
      }).catch(function(err) {
        if (err.name !== 'AbortError') fallbackDownload(pdf);
        loading.classList.remove('show');
      });
    } else {
      fallbackDownload(pdf);
      loading.classList.remove('show');
    }
  }).catch(function() {
    loading.classList.remove('show');
    alert('Erreur lors de la génération du PDF. R\u00e9essayez.');
  });
}
function fallbackDownload(pdf) {
  var blob = pdf.output('blob');
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'Billet-${b.numero}.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
}
</script>
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

// Page HTML du reçu groupé avec tous les QR codes (pour impression / téléchargement)
// GET /api/billets/recu/:reference
const afficherRecu = async (req, res) => {
  try {
    const ref = req.params.reference;
    const [txs] = await pool.query(
      "SELECT id, reference, montant, devise, moyen_paiement, telephone_payeur, statut, date_transaction FROM `transaction` WHERE reference = ?",
      [ref]
    );
    if (!txs.length) return res.status(404).send("Reçu introuvable");

    const tx = txs[0];
    const [billets] = await pool.query(
      `SELECT b.uuid, b.numero, b.prix_paye, b.payload_signature, b.date_creation,
        e.titre, e.date_debut AS date_debut, e.lieu, e.affiche_url, ct.nom AS categorie
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.transaction_id = ?`,
      [tx.id]
    );
    if (!billets.length) return res.status(404).send("Aucun billet trouvé");

    const evenement = billets[0];
    const dateEvenement = new Date(evenement.date_debut).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });

    const billetsHtml = billets.map((b, i) => {
      const maintenant = new Date().toISOString();
      const sigDonnees = `${b.uuid}|${b.numero}|${maintenant}||${b.categorie}`;
      const hmac = crypto.createHash('sha256').update(sigDonnees + HMAC_SECRET).digest('hex');
      const qrPayload = JSON.stringify({
        uuid: b.uuid, hmac,
        event_id: null, category: b.categorie,
        timestamp: maintenant, transaction_ref: b.numero,
      });
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrPayload)}`;
      return `
      <div class="recu-billet">
        <div class="recu-billet-left">
          <div class="recu-billet-num">Billet ${i + 1}</div>
          <div class="recu-billet-ref">${b.numero}</div>
          <div class="recu-billet-cat">${b.categorie}</div>
        </div>
        <div class="recu-billet-right">
          <img src="${qrUrl}" alt="QR" style="width:120px;height:120px;display:block" />
        </div>
      </div>`;
    }).join('');

    const totalMontant = billets.reduce((s, b) => s + Number(b.prix_paye), 0);

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reçu ${ref} — SENGUICHET</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F1A0F;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:'Outfit','Segoe UI',system-ui,-apple-system,sans-serif}
.recu{max-width:700px;width:100%;background:#F9F6EE;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35)}
.recu-head{background:#1B4332;padding:28px;text-align:center;position:relative;overflow:hidden}
.recu-head .orb{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(64,145,108,0.2)}
.recu-head h1{color:#D4AF37;font-size:20px;font-weight:800;letter-spacing:2px;position:relative;z-index:1}
.recu-head p{color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;position:relative;z-index:1}
.recu-head .ref{color:rgba(255,255,255,0.4);font-size:11px;font-family:monospace;margin-top:8px;position:relative;z-index:1}
.recu-body{padding:24px 20px}
.recu-event{text-align:center;margin-bottom:20px}
.recu-event h2{color:#1B4332;font-size:18px;font-weight:700}
.recu-event .meta{color:#40916C;font-size:13px;margin-top:4px}
.recu-section-title{color:#1B4332;font-size:13px;font-weight:700;margin-bottom:12px;letter-spacing:2px;text-transform:uppercase}
.recu-billet{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;border:1px solid rgba(27,67,50,0.06)}
.recu-billet-num{color:#40916C;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.recu-billet-ref{color:#1B4332;font-size:14px;font-weight:700;margin-top:2px}
.recu-billet-cat{color:#1B4332;font-size:12px;margin-top:2px;opacity:0.7}
.recu-billet-right img{border-radius:8px}
.recu-total{display:flex;justify-content:space-between;align-items:center;padding:16px 0 0;margin-top:12px;border-top:2px solid rgba(27,67,50,0.08)}
.recu-total .lbl{color:#40916C;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase}
.recu-total .val{color:#1B4332;font-size:24px;font-weight:800}
.recu-foot{background:#F0EAD6;padding:16px;text-align:center}
.recu-foot p{color:#40916C;font-size:11px}
@media print{body{background:#fff;padding:0;justify-content:flex-start}.recu{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="recu">
  <div class="recu-head">
    <div class="orb"></div>
    <h1>SENGUICHET</h1>
    <p>Reçu d'achat</p>
    <div class="ref">${ref}</div>
  </div>
  <div class="recu-body">
    <div class="recu-event">
      <h2>${evenement.titre}</h2>
      <div class="meta">${dateEvenement} · ${evenement.lieu}</div>
    </div>
    <div class="recu-section-title">Billets achetés</div>
    ${billetsHtml}
    <div class="recu-total">
      <span class="lbl">Total payé</span>
      <span class="val">${totalMontant.toLocaleString()} FCFA</span>
    </div>
  </div>
  <div class="recu-foot">
    <p>SENGUICHET — Sen Digital Pulse</p>
  </div>
</div>
</body>
</html>`);
  } catch (err) {
    console.error("Afficher recu error:", err);
    res.status(500).send("Erreur serveur");
  }
};

// Route JSON pour récupérer les données d'un reçu (mobile)
// GET /api/billets/recu/:reference/data
const recuData = async (req, res) => {
  try {
    const ref = req.params.reference;
    const [txs] = await pool.query(
      "SELECT id, reference, montant, devise, moyen_paiement, telephone_payeur, statut, date_transaction FROM `transaction` WHERE reference = ?",
      [ref]
    );
    if (!txs.length) return res.status(404).json({ message: "Reçu introuvable" });
    const tx = txs[0];
    const [billets] = await pool.query(
      `SELECT b.uuid, b.numero, b.prix_paye, b.statut, b.date_creation,
        e.titre AS evenement_titre, e.date_debut, e.lieu, ct.nom AS categorie_nom
      FROM billet b
      JOIN evenement e ON e.id = b.evenement_id
      JOIN categorie_ticket ct ON ct.id = b.categorie_ticket_id
      WHERE b.transaction_id = ?`,
      [tx.id]
    );
    const payload = billets.map(b => ({
      uuid: b.uuid, numero: b.numero, prix: b.prix_paye,
      evenement: b.evenement_titre, categorie: b.categorie_nom,
      date: b.date_creation,
    }));
    res.json({ transaction: tx, billets: payload });
  } catch (err) {
    console.error("Recu data error:", err);
    res.status(500).json({ message: "Erreur" });
  }
};

module.exports = { acheter, mesBillets, afficherBillet, recuData, afficherRecu, evenementBillets };
