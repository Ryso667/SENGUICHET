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
// Lance une erreur si l'API Orange échoue — pas de fallback mock
// numero : numéro de téléphone au format sénégalais (77XXXXXX, 76XXXXXX, etc.)
const envoyerSMSBillet = async (numero, ticket) => {
  const numeroFull = numero.startsWith("+") ? numero : `+221${numero}`;
  const ticketBase = (process.env.TICKET_URL || "https://senguichet.com/billet").replace(/\/+$/, "");
  const message = `SENGUICHET: Achat confirmé ! "${ticket.evenement}" (${ticket.categorie}). Montant : ${ticket.prix.toLocaleString()} FCFA. Voir billet : ${ticketBase}/${ticket.uuid}`;

  console.log(`SMSDEBUG: envoi vers=${numeroFull}, sender=${process.env.ORANGE_SENDER_ADDRESS}, sandbox=${process.env.ORANGE_SANDBOX}, message=${message.substring(0,60)}...`);

  const result = await envoyerSMSOrange(numeroFull, message);
  console.log(`SMSDEBUG: response=${JSON.stringify(result)}`);

  if (result && result.outboundSMSMessageRequest) {
    const status = result.outboundSMSMessageRequest.deliveryInfoList?.deliveryInfo?.[0]?.deliveryStatus;
    console.log(`SMSDEBUG: resourceURL=${result.outboundSMSMessageRequest.resourceURL}, status=${status}`);
    if (status === "Impossible") {
      console.error(`SMSDEBUG: DELIVERY IMPOSSIBLE — sender address probablement invalide`);
    }
    return { success: true, result };
  }
  throw new Error(`Orange API a retourné : ${JSON.stringify(result)}`);
};

module.exports = { envoyerSMSBillet };
