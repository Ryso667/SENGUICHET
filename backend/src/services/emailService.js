// Service d'envoi d'emails SENGUICHET — thème vert clair, table HTML inline
// Utilise nodemailer avec SMTP configurable (Gmail, SendGrid, etc.)
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

const SITE_URL = process.env.SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

// Logo identique à celui de la page d'accueil (Navbar/Footer)
const LOGO_URL = "https://senguichet-frontend-web.vercel.app/images/logo.png";
const LOGO_CID = "logo@senguichet";
const LOGO_ATTACHMENT = { filename: "logo.png", path: path.join(__dirname, "..", "..", "public", "images", "logo.png"), cid: LOGO_CID };

// Layout principal de tous les emails — fond clair, carte blanche, accents verts
const emailLayout = (content, options = {}) => {
  const { preheader } = options;
  return `
${preheader ? `<!--[if !mso]><!-- --><div style="display:none;font-size:1px;color:#FAFAFA;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div><!--<![endif]-->` : ""}
<table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FAFAFA" style="background-color:#FAFAFA;min-width:100%;">
  <tr>
    <td align="center" bgcolor="#FAFAFA" style="padding:30px 10px;background-color:#FAFAFA;">
      <!--[if mso]>
      <table cellpadding="0" cellspacing="0" border="0" width="600" align="center">
      <tr><td>
      <![endif]-->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:16px;mso-border-radius:16px;border:1px solid #E5E7EB;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:28px 28px 16px 28px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;">
                    <tr>
                      <td align="center" style="padding:0;">
                        <img src="cid:${LOGO_CID}" alt="SENGUICHET" width="120" height="auto" style="display:block;border:0;outline:none;width:120px;height:auto;" />
                      </td>
                    </tr>
                  </table>
                  <p style="color:#15803D;font-size:18px;font-weight:800;letter-spacing:2px;margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;">SENGUICHET</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td bgcolor="#E5E7EB" style="height:1px;background-color:#E5E7EB;font-size:0;line-height:0;padding:0;">&nbsp;</td>
              </tr>
            </table>
            ${content}
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td bgcolor="#E5E7EB" style="height:1px;background-color:#E5E7EB;font-size:0;line-height:0;padding:0;">&nbsp;</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:12px 28px 20px 28px;">
                  <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;">SENGUICHET — Sen Digital Pulse</p>
                  <a href="https://sendigitalpulse.com" style="color:#9CA3AF;font-size:11px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">sendigitalpulse.com</a><br>
                  <a href="mailto:support@senguichet.sn" style="color:#15803D;font-size:11px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">support@senguichet.sn</a>
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

// Génère un bouton CTA compatible Outlook avec VML roundrect — thème vert
const boutonCTA = (url, texte) => `
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" strokecolor="#15803D" fillcolor="#15803D">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:Arial;font-size:15px;font-weight:700;">${texte}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-->
  <a href="${url}" style="background:linear-gradient(135deg,#15803D,#22C55E);border-radius:8px;color:#ffffff;font-family:Arial;font-size:15px;font-weight:700;line-height:48px;text-align:center;text-decoration:none;display:inline-block;padding:0 32px;">${texte}</a>
  <!--<![endif]-->`;

// Envoie un email de confirmation de billet à l'acheteur
// ticket: { uuid, numero, evenement, categorie, prix, dateAchat, qrPayload }
// destinataire: email de l'acheteur
const envoyerEmailBillet = async (destinataire, ticket) => {
  const baseUrl = process.env.TICKET_URL || "https://backend-beta-six-39.vercel.app/api/billets";
  const lienBillet = `${baseUrl}/${ticket.uuid}`;
  const dateDebut = ticket.dateDebut ? new Date(ticket.dateDebut).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  }) : "";
  const heureDebut = ticket.dateDebut ? new Date(ticket.dateDebut).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit"
  }) : "";

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td style="padding:32px 28px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding-bottom:12px;">
                <table cellpadding="0" cellspacing="0" border="0" style="width:56px;height:56px;border-radius:14px;background:#BBF7D0;">
                  <tr>
                    <td align="center" valign="middle" style="font-size:28px;font-weight:700;color:#15803D;font-family:Arial,sans-serif;">
                      🎉
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <h2 style="color:#111827;font-size:20px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-align:center;">Achat confirmé !</h2>
          <p style="color:#6B7280;font-size:14px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;text-align:center;">${ticket.evenement || 'Événement'}</p>

          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Événement</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="color:#111827;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${ticket.evenement || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Date</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="color:#111827;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${dateDebut || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Heure</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="color:#111827;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${heureDebut || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Lieu</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="color:#111827;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${ticket.lieu || '—'}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;border-top:1px solid #E5E7EB;padding-top:8px;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Catégorie</span></td>
                    <td style="padding:4px 0;border-top:1px solid #E5E7EB;padding-top:8px;text-align:right;"><span style="color:#111827;font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${(ticket.categorie || 'STANDARD').toUpperCase()}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#6B7280;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Référence</span></td>
                    <td style="padding:4px 0;text-align:right;"><span style="color:#15803D;font-size:12px;font-family:monospace;font-weight:700;">${ticket.numero}</span></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding:24px 0 0;">
                <a href="${lienBillet}" style="background:linear-gradient(135deg,#15803D,#22C55E);border-radius:8px;color:#ffffff;font-family:Arial;font-size:14px;font-weight:700;line-height:44px;text-align:center;text-decoration:none;display:inline-block;padding:0 28px;">Voir mon billet →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return envoyerEmail(destinataire, `Votre billet · ${ticket.evenement || 'SENGUICHET'}`, emailLayout(content));
};

// Envoie un code OTP à l'acheteur pour confirmer son email
// code : chaîne de 6 chiffres, valable 5 minutes
// Ne propage pas les erreurs SMTP pour ne pas révéler si l'email est valide ou non
const envoyerCodeOTP = async (destinataire, code) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[OTP SIMULÉ] ${destinataire} → Code: ${code}`);
    return { simulé: true, destinataire, code };
  }

  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td align="center" style="padding:32px 28px;">
          <h2 style="color:#111827;font-size:20px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Code de v\u00e9rification</h2>
          <p style="color:#6B7280;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Voici votre code de confirmation :</p>
          <table cellpadding="0" cellspacing="0" border="0" bgcolor="#F0FDF4" style="background-color:#F0FDF4;border:2px solid #BBF7D0;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td align="center" bgcolor="#F0FDF4" style="padding:20px 40px;font-size:36px;font-weight:700;letter-spacing:12px;color:#15803D;font-family:'Courier New',monospace;background-color:#F0FDF4;">
                ${code}
              </td>
            </tr>
          </table>
          <p style="color:#9CA3AF;font-size:12px;margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Ce code expire dans 5 minutes.</p>
        </td>
      </tr>
    </table>`;

  try {
    return await envoyerEmail(destinataire, "Votre code de connexion SENGUICHET", emailLayout(content, { preheader: "Votre code de confirmation" }));
  } catch (err) {
    console.error("Erreur envoi OTP email (silencieuse):", err.message);
    return { erreur: true, message: "Email non délivré" };
  }
};

// Envoie une confirmation de demande de partenariat au demandeur
const envoyerConfirmationDemandeur = async (demande) => {
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td style="padding:32px 28px;">
          <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demande.nom}</strong>,</p>
          <p style="color:#6B7280;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Nous avons bien re\u00e7u votre demande de partenariat pour <strong style="color:#111827;">${demande.organisation}</strong>. Notre \u00e9quipe l\u2019analyse et vous recontactera sous <strong style="color:#15803D;">48 heures</strong>.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">R\u00c9CAPITULATIF</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisation</td>
                    <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.organisation}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:4px 0;color:#15803D;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">T\u00e9l\u00e9phone</td>
                    <td style="padding:4px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.telephone || "Non renseign\u00e9"}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="color:#9CA3AF;font-size:12px;font-style:italic;margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Cet email est un accus\u00e9 de r\u00e9ception automatique. Pour toute question : <a href="mailto:contact@senguichet.sn" style="color:#15803D;text-decoration:none;">contact@senguichet.sn</a></p>
        </td>
      </tr>
    </table>`;
  return envoyerEmail(demande.email, "Confirmation de votre demande de partenariat", emailLayout(content));
};

// Notifie l'admin d'une nouvelle demande de partenariat
const envoyerNotificationAdmin = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const content = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td style="padding:32px 28px;">
          <h2 style="color:#111827;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Nouvelle demande de partenariat</h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Nom</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.nom}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisation</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.organisation}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:6px 0;color:#15803D;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">T\u00e9l\u00e9phone</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.telephone || "Non renseign\u00e9"}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Message</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.message || "Aucun"}</td>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Votre demande est en cours de traitement</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demandeur.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#111827;">${demandeur.organisation}</strong> est actuellement
              <strong style="color:#F59E0B;">en cours d\u2019examen</strong> &#9203;
            </p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Notre \u00e9quipe l\u2019analyse en d\u00e9tail. Vous recevrez une r\u00e9ponse d\u00e9finitive dans les prochaines heures.</p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #F59E0B;">
                <tr>
                  <td bgcolor="#F9FAFB" style="padding:12px 16px;background-color:#F9FAFB;">
                    <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#111827;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Mise \u00e0 jour de votre demande</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demandeur.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#111827;">${demandeur.organisation}</strong> a \u00e9t\u00e9
              <strong style="color:#15803D;">approuv\u00e9e</strong> \u2713
            </p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Les modifications ont \u00e9t\u00e9 appliqu\u00e9es. Vous allez recevoir vos identifiants de connexion dans un email s\u00e9par\u00e9.</p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #15803D;">
                <tr>
                  <td bgcolor="#F9FAFB" style="padding:12px 16px;background-color:#F9FAFB;">
                    <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#111827;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Mise \u00e0 jour de votre demande</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demandeur.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de partenariat pour <strong style="color:#111827;">${demandeur.organisation}</strong> n\u2019a pas \u00e9t\u00e9
              <strong style="color:#DC2626;">retenue</strong> \u2717
            </p>
            ${commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #DC2626;">
                <tr>
                  <td bgcolor="#F9FAFB" style="padding:12px 16px;background-color:#F9FAFB;">
                    <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Motif du refus</p>
                    <p style="color:#DC2626;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${commentaire}</p>
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
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td style="padding:32px 28px;">
          <h2 style="color:#111827;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Vos acc\u00e8s SENGUICHET sont pr\u00eats</h2>
          <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${identifiants.nom}</strong>,</p>
          <p style="color:#6B7280;font-size:14px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Votre contrat a \u00e9t\u00e9 valid\u00e9 avec succ\u00e8s. Voici vos identifiants de connexion \u00e0 votre espace organisateur.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">VOS IDENTIFIANTS</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Email</td>
                    <td style="padding:4px 0;color:#15803D;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${identifiants.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Mot de passe</td>
                    <td style="padding:4px 0;color:#15803D;font-size:13px;font-weight:600;text-align:right;font-family:'Courier New',monospace;background-color:#F0FDF4;border-radius:4px;mso-border-radius:4px;padding:4px 8px;">${identifiants.motDePasse}</td>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Demande approuv\u00e9e \u2713</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demande.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de <strong style="color:#111827;">${action.toLowerCase()}</strong> pour l\u2019\u00e9v\u00e9nement
              <strong style="color:#111827;">${demande.titre || "N/A"}</strong> a \u00e9t\u00e9
              <strong style="color:#15803D;">approuv\u00e9e</strong> \u2713
            </p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">L\u2019\u00e9quipe SENGUICHET va proc\u00e9der \u00e0 la cr\u00e9ation de votre \u00e9v\u00e9nement. Vous recevrez une confirmation sous peu.</p>
            ${demande.commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #15803D;">
                <tr>
                  <td bgcolor="#F9FAFB" style="padding:12px 16px;background-color:#F9FAFB;">
                    <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Message de l\u2019\u00e9quipe</p>
                    <p style="color:#111827;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${demande.commentaire}</p>
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Demande non retenue \u2717</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demande.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre demande de <strong style="color:#111827;">${action.toLowerCase()}</strong> pour l\u2019\u00e9v\u00e9nement
              <strong style="color:#111827;">${demande.titre || "N/A"}</strong> n\u2019a pas \u00e9t\u00e9
              <strong style="color:#DC2626;">retenue</strong> \u2717
            </p>
            ${demande.commentaire ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:3px solid #DC2626;">
                <tr>
                  <td bgcolor="#F9FAFB" style="padding:12px 16px;background-color:#F9FAFB;">
                    <p style="color:#9CA3AF;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;">Motif</p>
                    <p style="color:#DC2626;font-size:13px;margin:0;font-family:Arial,Helvetica,sans-serif;">${demande.commentaire}</p>
                  </td>
                </tr>
              </table>` : ""
            }
            <p style="color:#9CA3AF;font-size:12px;margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;">Pour toute question, contactez-nous \u00e0 <a href="mailto:contact@senguichet.sn" style="color:#15803D;text-decoration:none;">contact@senguichet.sn</a></p>
          </td>
        </tr>
      </table>`;
    return envoyerEmail(demande.email, "Votre demande n\u2019a pas \u00e9t\u00e9 retenue \u2014 SENGUICHET", emailLayout(content));
  }

  // Cas 3 : Notification à l'organisateur — son événement a été créé
  if (estPourOrganisateur && demande.statut === "evenement_cree") {
    const content = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
        <tr>
          <td style="padding:32px 28px;">
            <p style="color:#111827;font-size:16px;margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-weight:700;">Votre \u00e9v\u00e9nement est en ligne !</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;">Bonjour <strong style="color:#111827;">${demande.nom}</strong>,</p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">
              Votre \u00e9v\u00e9nement <strong style="color:#111827;">${demande.titre || "N/A"}</strong> a \u00e9t\u00e9
              <strong style="color:#15803D;">cr\u00e9\u00e9 avec succ\u00e8s</strong> sur SENGUICHET.
            </p>
            <p style="color:#6B7280;font-size:14px;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;">Vous pouvez d\u00e8s \u00e0 pr\u00e9sent g\u00e9rer vos billets, suivre les ventes et consulter les statistiques depuis votre tableau de bord.</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
              <tr>
                <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding:4px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">\u00c9v\u00e9nement</td>
                      <td style="padding:4px 0;color:#15803D;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.titre || "N/A"}</td>
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
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:16px;mso-border-radius:16px;">
      <tr>
        <td style="padding:32px 28px;">
          <h2 style="color:#111827;font-size:18px;margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">Demande d\u2019\u00e9v\u00e9nement : ${action}</h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F9FAFB" style="background-color:#F9FAFB;border-radius:12px;mso-border-radius:12px;">
            <tr>
              <td bgcolor="#F9FAFB" style="padding:20px;background-color:#F9FAFB;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Organisateur</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.nom} (${demande.email})</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">\u00c9v\u00e9nement</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.titre || "N/A"}</td>
                  </tr>
                  ${demande.id ? `<tr>
                    <td style="padding:6px 0;color:#6B7280;font-size:13px;font-family:Arial,Helvetica,sans-serif;">ID demande</td>
                    <td style="padding:6px 0;color:#15803D;font-size:13px;font-weight:600;text-align:right;font-family:Arial,Helvetica,sans-serif;">${demande.id}</td>
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
