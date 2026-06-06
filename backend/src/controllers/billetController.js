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
      const signaturePayload = `${uuid}|${numero}|${timestamp}|${evenementId}|${cat.nom}`;
      const payload_signature = crypto.createHmac('sha256', HMAC_SECRET).update(signaturePayload).digest('hex');

      const [billetResult] = await conn.query(
        `INSERT INTO billet (uuid, numero, evenement_id, categorie_ticket_id, telephone_acheteur, payload_signature, prix_paye, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE')`,
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
        transaction_ref: reference,
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

// Affiche une page HTML publique avec le billet imprimable (design 4 sections)
// Sections : A-souche dégradé + QR vertical, B-infos événement, C-corps QR+filigrane, D-talon gris
// GET /api/billets/:uuid
const afficherBillet = async (req, res) => {
  try {
    const { uuid } = req.params;

    const [rows] = await pool.query(
      `SELECT b.uuid, b.numero, b.prix_paye, b.statut, b.date_creation, b.telephone_acheteur,
        b.payload_signature, e.titre, e.lieu, e.date_debut, e.affiche_url, ct.nom AS categorie,
        ct.couleur_hex
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
    const statut = b.statut;
    const statutLabel = statut === "ACTIF" ? "Valide" : statut === "UTILISE" ? "Utilisé" : "En attente";
    const statutColor = statut === "ACTIF" ? "#00E5A0" : statut === "UTILISE" ? "#94A3B8" : "#F97316";

    // QR via API publique (utilisable en impression)
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uuid)}`;

    // Palette de la catégorie ou défaut
    const catColor = b.couleur_hex || "#6366F1";

    const [
      debutDate, debutHeure
    ] = b.date_debut ? b.date_debut.toISOString().replace('T', ' ').split(' ') : ['', ''];
    const dateFormatted = new Date(b.date_debut).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });
    const heureFormatted = new Date(b.date_debut).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Billet ${b.numero} — SENGUICHET</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cat-color: ${catColor};
    --statut-color: ${statutColor};
    --w: 55mm;
    --h: 160mm;
  }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  /* Conteneur ticket */
  .ticket {
    width: var(--w);
    height: var(--h);
    background: #fff;
    border-radius: 4mm;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* ===================== SECTION A : Souche dégradé ===================== */
  .section-a {
    height: 38mm;
    background: linear-gradient(135deg, #6366F1, var(--cat-color), #EC4899);
    padding: 3mm 4mm;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .section-a::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3mm,
      rgba(255,255,255,0.03) 3mm,
      rgba(255,255,255,0.03) 6mm
    );
    pointer-events: none;
  }
  .section-a-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2mm;
    z-index: 1;
  }
  .section-a-left .qr-stub {
    width: 22mm;
    height: 22mm;
    background: #fff;
    border-radius: 1.5mm;
    padding: 1.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .section-a-left .qr-stub img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  .section-a-left .ref-stub {
    color: rgba(255,255,255,0.85);
    font-size: 2.5mm;
    font-weight: 700;
    letter-spacing: 0.5mm;
    text-align: center;
  }

  /* Marque verticale */
  .section-a-right {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    color: rgba(255,255,255,0.15);
    font-size: 5mm;
    font-weight: 900;
    letter-spacing: 2mm;
    text-transform: uppercase;
    z-index: 1;
    margin-left: auto;
    user-select: none;
    line-height: 1;
  }

  /* Perforation entre A et B */
  .perf {
    height: 3mm;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-shrink: 0;
    position: relative;
  }
  .perf-dot {
    width: 1.2mm;
    height: 1.2mm;
    border-radius: 50%;
    background: #f0f2f5;
    flex-shrink: 0;
  }
  .perf-line {
    flex: 1;
    height: 0;
    border-top: 0.3mm dashed #cbd5e1;
    margin: 0 0.5mm;
  }

  /* ===================== SECTION B : Infos événement ===================== */
  .section-b {
    height: 30mm;
    padding: 2.5mm 4mm;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.8mm;
    flex-shrink: 0;
    position: relative;
  }
  .section-b .event-title {
    font-size: 3.8mm;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    letter-spacing: 0.2mm;
    max-width: 100%;
  }
  .section-b .event-date {
    font-size: 2.6mm;
    color: #475569;
    font-weight: 600;
  }
  .section-b .event-lieu {
    font-size: 2.4mm;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.3mm;
    text-transform: uppercase;
  }
  .section-b .event-meta {
    display: flex;
    gap: 4mm;
    font-size: 2.4mm;
    font-weight: 700;
    color: var(--cat-color);
    margin-top: 1mm;
  }
  .section-b .event-meta span {
    background: rgba(99,102,241,0.08);
    padding: 0.5mm 2mm;
    border-radius: 1mm;
  }

  /* ===================== SECTION C : Corps QR + filigrane ===================== */
  .section-c {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2mm 4mm;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    min-height: 0;
  }
  .section-c-watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }
  .section-c-watermark span {
    font-size: 14mm;
    font-weight: 900;
    color: rgba(99,102,241,0.04);
    letter-spacing: 3mm;
    text-transform: uppercase;
    transform: rotate(-20deg);
    white-space: nowrap;
  }
  .section-c .qr-main {
    width: 48%;
    aspect-ratio: 1;
    background: #fff;
    border-radius: 2mm;
    padding: 1.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    box-shadow: 0 1mm 4mm rgba(0,0,0,0.06);
  }
  .section-c .qr-main img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  .section-c .statut-badge {
    z-index: 1;
    margin-top: 2mm;
    padding: 0.5mm 3mm;
    border-radius: 2mm;
    font-size: 2.4mm;
    font-weight: 700;
    color: #fff;
    background: var(--statut-color);
  }
  .section-c .acheteur-info {
    z-index: 1;
    font-size: 2mm;
    color: #94a3b8;
    margin-top: 1mm;
  }

  /* ===================== SECTION D : Talon gris ===================== */
  .section-d {
    height: 30mm;
    background: #f8fafc;
    padding: 2.5mm 4mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1mm;
    flex-shrink: 0;
    border-top: 0.3mm solid #e2e8f0;
  }
  .section-d .d-logo {
    font-size: 3mm;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 1mm;
  }
  .section-d .d-line {
    font-size: 2mm;
    color: #94a3b8;
    line-height: 1.5;
    text-align: center;
  }
  .section-d .d-barcode {
    width: 80%;
    height: 3mm;
    background: repeating-linear-gradient(
      90deg,
      #0f172a,
      #0f172a 0.3mm,
      transparent 0.3mm,
      transparent 0.8mm
    );
    margin-top: 1mm;
    opacity: 0.3;
  }

  /* État scanné */
  .scanned-stamp {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 8mm;
    font-weight: 900;
    color: ${statut === "UTILISE" ? "#ef4444" : "transparent"};
    border: ${statut === "UTILISE" ? "0.5mm solid #ef4444" : "none"};
    padding: 1mm 3mm;
    border-radius: 1mm;
    z-index: 10;
    pointer-events: none;
    opacity: ${statut === "UTILISE" ? 0.7 : 0};
    letter-spacing: 0.5mm;
  }

  /* ===================== RESPONSIVE ===================== */
  @media screen and (max-width: 400px) {
    :root {
      --w: 90vw;
      --h: auto;
    }
    .ticket {
      height: auto;
      min-height: 140vw;
      border-radius: 3mm;
    }
    .section-a { height: 30vw; padding: 2vw 3vw; }
    .section-a-left .qr-stub { width: 18vw; height: 18vw; }
    .section-a-right { font-size: 4vw; }
    .section-b { height: auto; padding: 3vw; min-height: 24vw; }
    .section-b .event-title { font-size: 4.5vw; }
    .perf { height: 2.5vw; }
    .section-c { min-height: 45vw; padding: 3vw; }
    .section-c .qr-main { width: 40%; }
    .section-d { height: auto; padding: 3vw; min-height: 22vw; }
    .section-d .d-barcode { height: 2vw; }
    .scanned-stamp { font-size: 6vw; }
  }

  @media screen and (min-width: 401px) and (max-width: 700px) {
    .ticket { transform: scale(0.85); transform-origin: center center; }
  }

  /* ===================== PRINT ===================== */
  @media print {
    body {
      padding: 0;
      background: #fff;
      display: block;
    }
    .ticket {
      box-shadow: none;
      border-radius: 0;
      width: 55mm;
      height: 160mm;
      page-break-after: always;
      margin: 0 auto;
    }
    .section-a { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-d { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-c .statut-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .scanned-stamp { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  @page {
    size: 55mm 160mm;
    margin: 0;
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- Tampon scanné si utilisé -->
  <div class="scanned-stamp">UTILISÉ</div>

  <!-- ===== SECTION A : Souche dégradé ===== -->
  <div class="section-a">
    <div class="section-a-left">
      <div class="qr-stub">
        <img src="${qrApi}" alt="QR billet" />
      </div>
      <div class="ref-stub">#${b.numero}</div>
    </div>
    <div class="section-a-right">SENGUICHET</div>
  </div>

  <!-- Perforation -->
  <div class="perf">
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
  </div>

  <!-- ===== SECTION B : Infos événement ===== -->
  <div class="section-b">
    <div class="event-title">${b.titre.toUpperCase()}</div>
    <div class="event-date">${dateFormatted} à ${heureFormatted}</div>
    <div class="event-lieu">${b.lieu ? b.lieu.toUpperCase() : ''}</div>
    <div class="event-meta">
      <span>${b.categorie}</span>
      <span>${b.prix_paye.toLocaleString()} FCFA</span>
    </div>
  </div>

  <!-- Perforation -->
  <div class="perf">
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
    <div class="perf-line"></div>
    <div class="perf-dot"></div>
  </div>

  <!-- ===== SECTION C : Corps QR + filigrane ===== -->
  <div class="section-c">
    <div class="section-c-watermark">
      <span>SENGUICHET</span>
    </div>
    <div class="qr-main">
      <img src="${qrApi}" alt="QR billet" />
    </div>
    <div class="statut-badge">${statutLabel}</div>
    <div class="acheteur-info">${b.telephone_acheteur || ''}</div>
  </div>

  <!-- ===== SECTION D : Talon gris ===== -->
  <div class="section-d">
    <div class="d-logo">SENGUICHET</div>
    <div class="d-line">Billeterie événementielle</div>
    <div class="d-line">Entrée unique et non transférable</div>
    <div class="d-line">Acheté le ${dateAchat}</div>
    <div class="d-barcode"></div>
  </div>

</div>
</body>
</html>`);
  } catch (err) {
    console.error("Afficher billet error:", err);
    res.status(500).send("<html><body><p>Erreur serveur</p></body></html>");
  }
};

module.exports = { acheter, mesBillets, afficherBillet };
