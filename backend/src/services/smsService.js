// Service d'envoi SMS — Orange API (sandbox + production + mock)
// Les credentials Orange se configurent dans le .env
// Mode mock par défaut tant que les clés Orange ne sont pas fournies

const https = require("https");

// Récupère un token OAuth2 depuis l'API Orange
// Retourne le token d'accès ou null
const obtenirTokenOrange = () => {
  return new Promise((resolve, reject) => {
    const clientId = process.env.ORANGE_CLIENT_ID;
    const clientSecret = process.env.ORANGE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return resolve(null);
    }

    const data = `grant_type=client_credentials`;
    const req = https.request(
      {
        hostname: "api.orange.com",
        path: "/oauth/v3/token",
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(json.access_token || null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.write(data);
    req.end();
  });
};

// Envoie un SMS via l'API Orange
// numero: numéro destinataire au format international (+221XXXXXXXXX)
const envoyerSMSOrange = async (numero, message) => {
  const token = await obtenirTokenOrange();
  if (!token) {
    console.error("SMSDEBUG: token null — credentials absentes ou invalides");
    return null;
  }

  // senderAddress = numéro pays Sénégal (tel:+2210000) ou celui fourni si provisionné
  // Ne PAS utiliser senderName comme senderAddress — ce sont deux champs distincts
  const senderAddress = process.env.ORANGE_SENDER_ADDRESS || "tel:+2210000";
  const encodedAddress = encodeURIComponent(senderAddress);
  const apiPrefix = process.env.ORANGE_SANDBOX === "true" ? "/sandbox" : "";

  console.log(`SMSDEBUG: token obtenu, sender=${senderAddress}, prefix=${apiPrefix || "production"}`);

  const senderName = process.env.ORANGE_SENDER_NAME || undefined;
  const payloadObj = {
    outboundSMSMessageRequest: {
      address: `tel:${numero}`,
      senderAddress,
      outboundSMSTextMessage: { message },
    },
  };
  if (senderName) payloadObj.outboundSMSMessageRequest.senderName = senderName;

  console.log(`SMSDEBUG: payload=${JSON.stringify(payloadObj, null, 2)}`);

  return new Promise((resolve) => {
    const payload = JSON.stringify(payloadObj);

    const req = https.request(
      {
        hostname: "api.orange.com",
        path: `${apiPrefix}/smsmessaging/v1/outbound/${encodedAddress}/requests`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        console.log(`SMSDEBUG: statusCode=${res.statusCode}`);
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          console.log(`SMSDEBUG: rawBody=${body}`);
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch {
            console.error(`SMSDEBUG: JSON parse error on body=${body}`);
            resolve(null);
          }
        });
      }
    );
    req.on("error", (e) => {
      console.error(`SMSDEBUG: request error=${e.message}`);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
};

// Envoie un SMS de confirmation de billet à l'acheteur via l'API Orange
// Log l'envoi en base pour suivi et réessai
// numero : numéro de téléphone au format sénégalais (77XXXXXX, 76XXXXXX, etc.)
// ticket: { evenement, categorie, prix, quantite, uuid? }
// Si uuid est fourni (1 billet), envoie le lien direct. Sinon, lien vers mes-billets.
const envoyerSMSBillet = async (numero, ticket, pool) => {
  const numeroFull = numero.startsWith("+") ? numero : `+221${numero}`;
  const ticketBase = "https://backend-beta-six-39.vercel.app/api/billets";

  const lienDirect = ticket.uuid ? `${ticketBase}/${ticket.uuid}` : null;
  const mesBilletsUrl = "https://senguichet-frontend-web.vercel.app/acheteur/mes-billets";
  const lien = lienDirect || mesBilletsUrl;

  const message = ticket.quantite > 1
    ? [
        `SENGUICHET`,
        `Achat confirmé`,
        ``,
        `Événement: ${ticket.evenement}`,
        `Catégorie: ${ticket.categorie}`,
        `${ticket.quantite} billets · ${(ticket.prix || 0).toLocaleString()} FCFA`,
        ``,
        `Voir vos billets:`,
        mesBilletsUrl,
      ].join('\n')
    : [
        `SENGUICHET`,
        `Achat confirmé`,
        ``,
        `Événement: ${ticket.evenement}`,
        `Catégorie: ${ticket.categorie}`,
        `Montant: ${(ticket.prix || 0).toLocaleString()} FCFA`,
        ``,
        `Voir votre billet:`,
        lien,
      ].join('\n');

  // Journaliser la tentative en base
  let logId = null;
  if (pool) {
    try {
      const [log] = await pool.query(
        `INSERT INTO sms_log (telephone, message, uuid_billet, statut, date_creation)
         VALUES (?, ?, ?, 'ENVOI_EN_COURS', NOW())`,
        [numeroFull, message.substring(0, 500), ticket.quantite > 1 ? 'multi' : 'single']
      );
      logId = log.insertId;
    } catch (dbErr) {
      console.error("SMS_LOG insertion error:", dbErr.message);
    }
  }

  console.log(`SMSDEBUG: envoi vers=${numeroFull}, sender=${process.env.ORANGE_SENDER_ADDRESS}, sandbox=${process.env.ORANGE_SANDBOX}, message=${message.substring(0,60)}...`);

  try {
    const result = await envoyerSMSOrange(numeroFull, message);

    if (result && result.outboundSMSMessageRequest) {
      const deliveryStatus = result.outboundSMSMessageRequest.deliveryInfoList?.deliveryInfo?.[0]?.deliveryStatus;
      console.log(`SMSDEBUG: resourceURL=${result.outboundSMSMessageRequest.resourceURL}, status=${deliveryStatus}`);

      // Mettre à jour le log en succès
      if (pool && logId) {
        await pool.query(
          `UPDATE sms_log SET statut = 'ENVOYE', date_envoi = NOW(), reponse_api = ? WHERE id = ?`,
          [JSON.stringify(result), logId]
        ).catch(() => {});
      }

      if (deliveryStatus === "Impossible") {
        console.error(`SMSDEBUG: DELIVERY IMPOSSIBLE — sender address probablement invalide`);
      }
      return { success: true, result };
    }

    throw new Error(JSON.stringify(result));
  } catch (err) {
    // Marquer l'échec en base
    if (pool && logId) {
      await pool.query(
        `UPDATE sms_log SET statut = 'ECHEC', date_envoi = NOW(), reponse_api = ? WHERE id = ?`,
        [err.message, logId]
      ).catch(() => {});
    }
    console.error("SMS error:", err.message);
    return { success: false, error: err.message };
  }
};

// Récupère les contrats SMS Orange (infos sur senderAddress, solde, etc.)
const consulterContrats = async () => {
  const token = await obtenirTokenOrange();
  if (!token) return { error: "token null" };

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.orange.com",
        path: "/sms/admin/v1/contracts",
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve({ error: "parse error", raw: body }); }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.end();
  });
};

// Récupère les statistiques d'utilisation SMS
const consulterStats = async () => {
  const token = await obtenirTokenOrange();
  if (!token) return { error: "token null" };

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.orange.com",
        path: "/sms/admin/v1/statistics",
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve({ error: "parse error", raw: body }); }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.end();
  });
};

module.exports = { envoyerSMSBillet, consulterContrats, consulterStats };
