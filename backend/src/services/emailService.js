// Service d'envoi d'emails SENGUICHET — themes sombres, table HTML inline
// Utilise nodemailer avec SMTP configurable (Gmail, SendGrid, etc.)
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

const SITE_URL = process.env.SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

const LOGO_URL = `${SITE_URL}/uploads/logo.jpg`;
const LOGO_CID = "logo@senguichet";
const LOGO_ATTACHMENT = { filename: "logo.jpg", path: path.join(__dirname, "..", "..", "uploads", "logo.jpg"), cid: LOGO_CID };

const emailLayout = (content, options = {}) => {
  const { preheader } = options;
  return `
${preheader ? `<!--[if !mso]><!-- --><div style="display:none;font-size:1px;color:#0D1B2A;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div><!--<![endif]-->` : ""}
<table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0D1B2A" style="background-color:#0D1B2A;min-width:100%;">
  <tr>
    <td align="center" bgcolor="#0D1B2A" style="padding:30px 10px;background-color:#0D1B2A;">
      <!--[if mso]>
      <table cellpadding="0" cellspacing="0" border="0" width="600" align="center">
      <tr><td>
      <![endif]-->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
        <tr>
          <td bgcolor="#0D1B2A" style="background-color:#0D1B2A;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:0 0 16px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" bgcolor="#152232" style="background-color:#152232;border-radius:12px;mso-border-radius:12px;">
                    <tr>
                      <td align="center" bgcolor="#152232" style="padding:16px;background-color:#152232;">
                        <img src="cid:${LOGO_CID}" alt="SENGUICHET" width="80" height="80" style="display:block;border:0;outline:none;width:80px;height:auto;" />
                      </td>
                    </tr>
                  </table>
                  <p style="color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:3px;margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;">SENGUICHET</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td bgcolor="#1E3448" style="height:1px;background-color:#1E3448;font-size:0;line-height:0;padding:0;">&nbsp;</td>
              </tr>
            </table>
            ${content}
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td bgcolor="#1E3448" style="height:1px;background-color:#1E3448;font-size:0;line-height:0;padding:0;">&nbsp;</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:8px 0 0 0;">
                  <p style="color:#6B7280;font-size:12px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;">SENGUICHET — Sen Digital Pulse</p>
                  <a href="https://sendigitalpulse.com" style="color:#4B5563;font-size:11px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">sendigitalpulse.com</a><br>
                  <a href="mailto:support@senguichet.sn" style="color:#00C8FF;font-size:11px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">support@senguichet.sn</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--[if mso]>
      </td></tr></table>
      <![endif]-->
    </td>
  </tr>
</table>`;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("SMTP non configuré. Les emails ne seront pas envoyés.");
    return null;
  }

  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

// Envoie un email générique via le transporteur SMTP
const envoyerEmail = async (destinataire, sujet, html) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SIMULÉ] À: ${destinataire} — ${sujet}`);
    return { simulé: true, destinataire };
  }
  const info = await transporter.sendMail({
    from: `"SENGUICHET" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: destinataire,
    subject: sujet,
    html,
    attachments: [LOGO_ATTACHMENT],
  });
  console.log(`Email envoyé à ${destinataire}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

// Génère un bouton CTA compatible Outlook avec VML roundrect
const boutonCTA = (url, texte) => `
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" strokecolor="#00C8FF" fillcolor="#00C8FF">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:Arial;font-size:15px;font-weight:700;">${texte}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="${url}" style="background:linear-gradient(135deg,#00C8FF,#0077FF);border-radius:8px;color:#ffffff;font-family:Arial;font-size:15px;font-weight:700;line-height:48px;text-align:center;text-decoration:none;display:inline-block;padding:0 32px;">${texte}</a>
  <!--<![endif]-->`;

// Envoie un email de confirmation de billet à l'acheteur
// ticket: { uuid, numero, evenement, categorie, prix, dateAchat, qrPayload }
// destinataire: email de l'acheteur
const envoyerEmailBillet = async (destinataire, ticket) => {
  const baseUrl = process.env.TICKET_URL || "https://senguichet.com/billet";
  const lienBillet = `${baseUrl}/${ticket.uuid}`;

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <h2 style="color:#FFFFFF;font-size:22px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;text-align:center;">Votre billet est confirm\u00e9 ! &#127934;</h2>
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Votre achat a \u00e9t\u00e9 effectu\u00e9 avec succ\u00e8s. Pr\u00e9sentez le QR code \u00e0 l\u2019entr\u00e9e de l\u2019\u00e9v\u00e9nement.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">VOTRE BILLET</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">\u00c9v\u00e9nement</td>
                    <td style="padding:4px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${ticket.evenement}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Cat\u00e9gorie</td>
                    <td style="padding:4px 0;color:#FFFFFF;font-size:13px;text-align:right;font-family:Arial,Helvetica,sans-serif;">${ticket.categorie}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Montant</td>
                    <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${ticket.prix.toLocaleString()} FCFA</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">R\u00e9f\u00e9rence</td>
                    <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:'Courier New',monospace;">${ticket.numero}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding:24px 0 0 0;">
                ${boutonCTA(lienBillet, "Voir mon billet \u2192")}
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td bgcolor="#0F1C2E" style="border-left:3px solid #FF4D6D;background-color:#0F1C2E;padding:12px 16px;margin-top:16px;">
                <p style="color:#FF4D6D;font-size:12px;margin:0;font-family:Arial,Helvetica,sans-serif;">Ne partagez pas votre billet. Le QR code est unique et personnel.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return envoyerEmail(destinataire, `Votre billet ${ticket.numero} \u2014 ${ticket.evenement}`, emailLayout(content, { preheader: `Votre billet pour ${ticket.evenement} est confirm\u00e9 !` }));
};

// Envoie un code OTP à l'acheteur pour confirmer son email
// code : chaîne de 6 chiffres, valable 5 minutes
const envoyerCodeOTP = async (destinataire, code) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[OTP SIMULÉ] ${destinataire} → Code: ${code}`);
    return { simulé: true, destinataire, code };
  }

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td align="center" bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Code de v\u00e9rification</h2>
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Voici votre code de confirmation :</p>
          <table cellpadding="0" cellspacing="0" border="0" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border:2px solid rgba(0,200,255,0.3);border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td align="center" bgcolor="#0F1C2E" style="padding:20px 40px;font-size:36px;font-weight:700;letter-spacing:12px;color:#00C8FF;font-family:'Courier New',monospace;background-color:#0F1C2E;">
                ${code}
              </td>
            </tr>
          </table>
          <p style="color:#6B7280;font-size:12px;margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Ce code expire dans 5 minutes.</p>
        </td>
      </tr>
    </table>`;

  return envoyerEmail(destinataire, "Votre code de connexion SENGUICHET", emailLayout(content, { preheader: "Votre code de confirmation" }));
};

// Envoie une confirmation de demande de partenariat au demandeur
const envoyerConfirmationDemandeur = async (demande) => {
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demande.nom}</strong>,</p>
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Nous avons bien re\u00e7u votre demande de partenariat pour <strong style="color:#FFFFFF;">${demande.organisation}</strong>. Notre \u00e9quipe l\u2019analyse et vous recontactera sous <strong style="color:#00C8FF;">48 heures</strong>.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">R\u00c9CAPITULATIF</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisation</td>
                    <td style="padding:4px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.organisation}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">T\u00e9l\u00e9phone</td>
                    <td style="padding:4px 0;color:#FFFFFF;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.telephone || "Non renseign\u00e9"}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="color:#6B7280;font-size:12px;font-style:italic;margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Cet email est un accus\u00e9 de r\u00e9ception automatique. Pour toute question : <a href="mailto:contact@senguichet.sn" style="color:#00C8FF;text-decoration:none;">contact@senguichet.sn</a></p>
        </td>
      </tr>
    </table>`;
  return envoyerEmail(demande.email, "Confirmation de votre demande de partenariat", emailLayout(content));
};

// Notifie l'admin d'une nouvelle demande de partenariat
const envoyerNotificationAdmin = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <h2 style="color:#FFFFFF;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Nouvelle demande de partenariat</h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Nom</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.nom}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisation</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.organisation}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:6px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">T\u00e9l\u00e9phone</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.telephone || "Non renseign\u00e9"}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Message</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.message || "Aucun"}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return envoyerEmail(adminEmail, "Nouvelle demande de partenariat \u2014 SENGUICHET", emailLayout(content));
};

// Notifie le demandeur du statut de sa demande de partenariat
// 3 cas distincts : EN_COURS (orange), ACCEPTEE (vert), REJETEE (rouge)
// Chaque cas retourne son propre template pour éviter les conditions else implicites
const envoyerStatutDemande = async (demandeur, statut, commentaire) => {
  if (statut === "EN_COURS") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Votre demande est en cours de traitement</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demandeur.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#FFFFFF;">${demandeur.organisation}</strong> est actuellement
              <strong style="color:#FFB347;">en cours d\u2019examen</strong> &#9203;
            </p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Notre \u00e9quipe l\u2019analyse en d\u00e9tail. Vous recevrez une r\u00e9ponse d\u00e9finitive dans les prochaines heures.</p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #FFB347;">
                <tr>
                  <td bgcolor="#0F1C2E" style="padding:12px 16px;background-color:#0F1C2E;">
                    <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#FFFFFF;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demandeur.email, "Votre demande est en cours d\u2019examen \u2014 SENGUICHET", emailLayout(content));
  }

  if (statut === "ACCEPTEE") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Mise \u00e0 jour de votre demande</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demandeur.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#FFFFFF;">${demandeur.organisation}</strong> a \u00e9t\u00e9
              <strong style="color:#00E5A0;">approuv\u00e9e</strong> \u2713
            </p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Les modifications ont \u00e9t\u00e9 appliqu\u00e9es. Vous allez recevoir vos identifiants de connexion dans un email s\u00e9par\u00e9.</p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #00C8FF;">
                <tr>
                  <td bgcolor="#0F1C2E" style="padding:12px 16px;background-color:#0F1C2E;">
                    <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#FFFFFF;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demandeur.email, "Votre demande a \u00e9t\u00e9 accept\u00e9e \u2713", emailLayout(content));
  }

  if (statut === "REJETEE") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Mise \u00e0 jour de votre demande</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demandeur.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#FFFFFF;">${demandeur.organisation}</strong> n\u2019a pas \u00e9t\u00e9
              <strong style="color:#FF4D6D;">retenue</strong> \u2717
            </p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #FF4D6D;">
                <tr>
                  <td bgcolor="#0F1C2E" style="padding:12px 16px;background-color:#0F1C2E;">
                    <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Motif du refus</p>
                    <p style="color:#FF4D6D;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demandeur.email, "Votre demande n\u2019a pas \u00e9t\u00e9 retenue", emailLayout(content));
  }
};

// Envoie les identifiants de connexion à un nouveau partenaire
const envoyerIdentifiantsPartenaire = async (identifiants) => {
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <h2 style="color:#FFFFFF;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Vos acc\u00e8s SENGUICHET sont pr\u00eats</h2>
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${identifiants.nom}</strong>,</p>
          <p style="color:#A0B4C8;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Votre contrat a \u00e9t\u00e9 valid\u00e9 avec succ\u00e8s. Voici vos identifiants de connexion \u00e0 votre espace organisateur.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">VOS IDENTIFIANTS</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${identifiants.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Mot de passe</td>
                    <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:'Courier New',monospace;background-color:#080E17;border-radius:4px;mso-border-radius:4px;padding:4px 8px;">${identifiants.motDePasse}</td>
                  </tr>
                </table>
              </td>
            </tr>
        </td>
      </tr>
    </table>`;
  return envoyerEmail(identifiants.email, "Vos acc\u00e8s SENGUICHET sont pr\u00eats", emailLayout(content));
};

// Notifie l'admin ou l'organisateur selon le contexte d'une demande d'événement
// - Sans destinataire → admin : notification de nouvelle demande
// - destinataire "organisateur" + statut "approuve" : demande approuvée
// - destinataire "organisateur" + statut "refuse" : demande refusée
// - destinataire "organisateur" + statut "evenement_cree" : événement créé
const envoyerNotificationDemandeEvenement = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const action = demande.type_action === "CREATION" ? "Création"
    : demande.type_action === "MODIFICATION" ? "Modification"
    : "Suppression";

  const estPourOrganisateur = demande.destinataire === "organisateur";

  // Cas 1 : Notification à l'organisateur — sa demande a été approuvée
  if (estPourOrganisateur && demande.statut === "approuve") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Demande approuv\u00e9e \u2713</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demande.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de <strong style="color:#FFFFFF;">${action.toLowerCase()}</strong> pour l\u2019\u00e9v\u00e9nement
              <strong style="color:#FFFFFF;">${demande.titre || "N/A"}</strong> a \u00e9t\u00e9
              <strong style="color:#00E5A0;">approuv\u00e9e</strong> \u2713
            </p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">L\u2019\u00e9quipe SENGUICHET va proc\u00e9der \u00e0 la cr\u00e9ation de votre \u00e9v\u00e9nement. Vous recevrez une confirmation sous peu.</p>
            ${demande.commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #00C8FF;">
                <tr>
                  <td bgcolor="#0F1C2E" style="padding:12px 16px;background-color:#0F1C2E;">
                    <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#FFFFFF;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${demande.commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demande.email, "Votre demande a \u00e9t\u00e9 approuv\u00e9e \u2014 SENGUICHET", emailLayout(content));
  }

  // Cas 2 : Notification à l'organisateur — sa demande a été refusée
  if (estPourOrganisateur && demande.statut === "refuse") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Demande non retenue \u2717</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demande.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de <strong style="color:#FFFFFF;">${action.toLowerCase()}</strong> pour l\u2019\u00e9v\u00e9nement
              <strong style="color:#FFFFFF;">${demande.titre || "N/A"}</strong> n\u2019a pas \u00e9t\u00e9
              <strong style="color:#FF4D6D;">retenue</strong> \u2717
            </p>
            ${demande.commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #FF4D6D;">
                <tr>
                  <td bgcolor="#0F1C2E" style="padding:12px 16px;background-color:#0F1C2E;">
                    <p style="color:#6B7280;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Motif</p>
                    <p style="color:#FF4D6D;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${demande.commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
            <p style="color:#6B7280;font-size:12px;margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Pour toute question, contactez-nous \u00e0 <a href="mailto:contact@senguichet.sn" style="color:#00C8FF;text-decoration:none;">contact@senguichet.sn</a></p>
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demande.email, "Votre demande n\u2019a pas \u00e9t\u00e9 retenue \u2014 SENGUICHET", emailLayout(content));
  }

  // Cas 3 : Notification à l'organisateur — son événement a été créé
  if (estPourOrganisateur && demande.statut === "evenement_cree") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
            <p style="color:#FFFFFF;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Votre \u00e9v\u00e9nement est en ligne ! &#127881;</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#FFFFFF;">${demande.nom}</strong>,</p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre \u00e9v\u00e9nement <strong style="color:#FFFFFF;">${demande.titre || "N/A"}</strong> a \u00e9t\u00e9
              <strong style="color:#00C8FF;">cr\u00e9\u00e9 avec succ\u00e8s</strong> sur SENGUICHET.
            </p>
            <p style="color:#A0B4C8;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Vous pouvez d\u00e8s \u00e0 pr\u00e9sent g\u00e9rer vos billets, suivre les ventes et consulter les statistiques depuis votre tableau de bord.</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
              <tr>
                <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">\u00c9v\u00e9nement</td>
                      <td style="padding:4px 0;color:#00C8FF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.titre || "N/A"}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:24px 0 0 0;">
                  ${boutonCTA("https://senguichet-frontend-web.vercel.app/dashboard/evenements", "Voir mes \u00e9v\u00e9nements \u2192")}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demande.email, "Votre \u00e9v\u00e9nement est cr\u00e9\u00e9 \u2014 SENGUICHET", emailLayout(content));
  }

  // Cas 4 (défaut) : Notification à l'admin d'une nouvelle demande (comportement actuel)
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#152232" style="background-color:#152232;border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td bgcolor="#152232" style="padding:32px;background-color:#152232;">
          <h2 style="color:#FFFFFF;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Demande d\u2019\u00e9v\u00e9nement : ${action}</h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0F1C2E" style="background-color:#0F1C2E;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#0F1C2E" style="padding:20px;background-color:#0F1C2E;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisateur</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.nom} (${demande.email})</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">\u00c9v\u00e9nement</td>
                    <td style="padding:6px 0;color:#FFFFFF;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.titre || "N/A"}</td>
                  </tr>
                  ${demande.id ? `<tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">ID demande</td>
                    <td style="padding:6px 0;color:#00C8FF;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.id}</td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  return envoyerEmail(adminEmail, `Demande ${action.toLowerCase()} \u00e9v\u00e9nement \u2014 SENGUICHET`, emailLayout(content));
};

module.exports = { envoyerEmailBillet, envoyerCodeOTP, envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire, envoyerNotificationDemandeEvenement };
