// Service d'envoi d'emails ÔÇö ticket confirmation apr├¿s paiement
// Utilise nodemailer avec SMTP configurable (Gmail, SendGrid, etc.)
const nodemailer = require("nodemailer");
require("dotenv").config();

const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("ÔÜá´©Å SMTP non configur├®. Les emails ne seront pas envoy├®s.");
    return null;
  }

  // SMTP_SECURE: true si non d├®fini et port 465, sinon false (STARTTLS)
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

// Construit l'URL du logo SENGUICHET pour les emails
const getLogoUrl = () => {
  const baseUrl = process.env.TICKET_URL || "https://senguichet.com/billet";
  const baseApi = baseUrl.replace('/billets', '');
  return `${baseApi}/logo/logo.jpg`;
};

// Envoie un email de confirmation de billet ├á l'acheteur
// ticket: { uuid, numero, evenement, categorie, prix, dateAchat, qrPayload }
// destinataire: email de l'acheteur
const envoyerEmailBillet = async (destinataire, ticket) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SIMUL├ë] ├Ç: ${destinataire} ÔÇö Ticket ${ticket.numero} pour ${ticket.evenement}`);
    return { simul├®: true, destinataire, ticket: ticket.numero };
  }

  const baseUrl = process.env.TICKET_URL || "https://senguichet.com/billet";
  const lienBillet = `${baseUrl}/${ticket.uuid}`;

  const html = `
    <div style="font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0F0A1A 0%, #1A1035 50%, #0F0A1A 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.3);">

        <!-- En-t├¬te -->
        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 32px 32px 24px; text-align: center; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2285%22 cy=%2220%22 r=%2240%22 fill=%22rgba(255,255,255,0.04)%22/><circle cx=%2215%22 cy=%2280%22 r=%2260%22 fill=%22rgba(255,255,255,0.03)%22/></svg>'); opacity: 0.5;"></div>
          <div style="position: relative; z-index: 1;">
            <img src="${getLogoUrl()}" alt="SENGUICHET" style="display: block; margin: 0 auto 12px; width: 140px; height: auto;" />
            <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 0; letter-spacing: 1px;">BILLET CONFIRM├ë</p>
          </div>
        </div>

        <!-- Corps -->
        <div style="padding: 0 32px 32px;">
          <div style="background: linear-gradient(180deg, #1E1450 0%, #16102E 100%); border: 1px solid rgba(124,58,237,0.25); border-radius: 14px; margin-top: -12px; position: relative; z-index: 2; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">

            <!-- Badge succ├¿s -->
            <div style="text-align: center; padding: 24px 24px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 6px 18px;">
                <span style="color: #34D399; font-size: 13px; font-weight: 600;">Ô£à Paiement confirm├®</span>
              </div>
            </div>

            <!-- Titre ├®v├®nement -->
            <div style="text-align: center; padding: 16px 24px 0;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; line-height: 1.3;">${ticket.evenement}</h2>
            </div>

            <!-- D├®tails -->
            <div style="padding: 20px 24px;">
              <div style="background: rgba(124,58,237,0.08); border-radius: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.12);">
                  <span style="color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">Cat├®gorie</span>
                  <span style="color: #ffffff; font-size: 14px; font-weight: 600;">${ticket.categorie}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.12);">
                  <span style="color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">Montant</span>
                  <span style="color: #FCD34D; font-size: 16px; font-weight: 700;">${ticket.prix.toLocaleString()} <span style="font-size: 12px; font-weight: 400;">FCFA</span></span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                  <span style="color: rgba(255,255,255,0.5); font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">R├®f├®rence</span>
                  <span style="color: #A78BFA; font-size: 13px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">${ticket.numero}</span>
                </div>
              </div>
            </div>

            <!-- Bouton CTA -->
            <div style="text-align: center; padding: 0 24px 24px;">
              <a href="${lienBillet}"
                 style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #A855F7); color: white; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(124,58,237,0.35);">
                Voir mon billet ÔåÆ
              </a>
              <p style="color: rgba(255,255,255,0.35); font-size: 11px; margin: 12px 0 0; line-height: 1.5;">
                Pr├®sente le QR code ├á l'entr├®e depuis l'application.
              </p>
            </div>
          </div>
        </div>

        <!-- Pied de page -->
        <div style="text-align: center; padding: 0 32px 24px;">
          <div style="border-top: 1px solid rgba(124,58,237,0.15); padding-top: 16px;">
            <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0 0 4px; letter-spacing: 1px;">SENGUICHET ÔÇö BILLETERIE ├ëV├ëNEMENTIELLE</p>
            <p style="color: rgba(255,255,255,0.2); font-size: 10px; margin: 0;">
              Une question ? <a href="mailto:support@senguichet.com" style="color: #A78BFA; text-decoration: none;">support@senguichet.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SENGUICHET" <${process.env.MAIL_FROM || user}>`,
      to: destinataire,
      subject: `­ƒÄ½ Ton billet ${ticket.numero} ÔÇö ${ticket.evenement}`,
      html,
    });
    console.log(`Email envoy├® ├á ${destinataire}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Erreur envoi email:", err.message);
    return { success: false, erreur: err.message };
  }
};

// Envoie un code OTP ├á l'acheteur pour confirmer son email
// code : cha├«ne de 6 chiffres, valable 5 minutes
const envoyerCodeOTP = async (destinataire, code) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[OTP SIMUL├ë] ${destinataire} ÔåÆ Code: ${code}`);
    return { simul├®: true, destinataire, code };
  }

  const html = `
    <div style="font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0F0A1A 0%, #1A1035 50%, #0F0A1A 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(99,102,241,0.15);">

        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 28px 24px 20px; text-align: center;">
          <img src="${getLogoUrl()}" alt="SENGUICHET" style="display: block; margin: 0 auto 8px; width: 120px; height: auto;" />
          <p style="color: rgba(255,255,255,0.85); font-size: 11px; margin: 0; letter-spacing: 1px;">CONNEXION S├ëCURIS├ëE</p>
        </div>

        <div style="padding: 0 24px 24px;">
          <div style="background: linear-gradient(180deg, #1E1450 0%, #16102E 100%); border: 1px solid rgba(124,58,237,0.25); border-radius: 14px; margin-top: -12px; position: relative; z-index: 1; padding: 24px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="display: inline-block; background: rgba(124,58,237,0.12); border-radius: 50%; width: 48px; height: 48px; line-height: 48px; font-size: 22px; margin-bottom: 12px;">­ƒöÉ</div>
            <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 16px; letter-spacing: 0.5px;">Ton code de confirmation</p>
            <div style="background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; padding: 16px; letter-spacing: 10px; font-size: 36px; font-weight: 700; color: #A78BFA; font-family: 'Courier New', monospace;">
              ${code}
            </div>
            <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin-top: 16px;">Ce code expire dans <strong style="color: #FCD34D;">5 minutes</strong>.</p>
          </div>
        </div>

        <div style="text-align: center; padding: 0 24px 20px;">
          <p style="color: rgba(255,255,255,0.25); font-size: 10px; margin: 0; letter-spacing: 1px;">
            SENGUICHET ÔÇö BILLETERIE ├ëV├ëNEMENTIELLE
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SENGUICHET" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: destinataire,
      subject: "Ton code de connexion SENGUICHET",
      html,
    });
    console.log(`OTP envoy├® ├á ${destinataire}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Erreur envoi OTP:", err.message);
    return { success: false, erreur: err.message };
  }
};

// Fonction utilitaire pour envoyer un email via le transporteur
const envoyerEmail = async (destinataire, sujet, html) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SIMUL├ë] ├Ç: ${destinataire} ÔÇö ${sujet}`);
    return { simul├®: true, destinataire };
  }
  const info = await transporter.sendMail({
    from: `"SENGUICHET" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: destinataire,
    subject: sujet,
    html,
  });
  console.log(`Email envoy├® ├á ${destinataire}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

// Envoie un email de confirmation au demandeur apr├¿s soumission d'une demande de partenariat
const envoyerConfirmationDemandeur = async (demande) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366F1; font-size: 26px; margin: 0;">SENGUICHET</h1>
        <p style="color: #94a3b8; font-size: 13px;">Billets & ├ëv├®nements</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <p style="color: #0f172a; font-size: 15px; margin: 0 0 12px;">Bonjour <strong>${demande.nom}</strong>,</p>
        <p style="color: #475569; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">Nous avons bien re├ºu votre demande de partenariat pour <strong>${demande.organisation}</strong>.</p>
        <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">Notre ├®quipe l'examinera sous 48h. Vous recevrez un email d├¿s qu'une d├®cision sera prise.</p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">SENGUICHET ÔÇö Billeterie ├®v├®nementielle</p>
    </div>`;
  return envoyerEmail(demande.email, "Confirmation de votre demande de partenariat", html);
};

// R├®cup├¿re la liste des admins depuis ADMIN_EMAIL (s├®par├®s par des virgules)
const getAdminEmails = () => {
  const raw = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
  return raw.split(',').map(e => e.trim()).filter(Boolean);
};

// Notifie l'admin d'une nouvelle demande de partenariat
const envoyerNotificationAdmin = async (demande) => {
  const adminEmails = getAdminEmails();
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366F1; font-size: 26px; margin: 0;">SENGUICHET</h1>
        <p style="color: #94a3b8; font-size: 13px;">Billets & ├ëv├®nements</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; font-size: 17px; margin: 0 0 16px; font-weight: 600;">Nouvelle demande de partenariat</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Nom</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${demande.nom}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Organisation</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${demande.organisation}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td>
            <td style="padding: 8px 0; color: #6366F1; font-size: 13px; text-align: right;">${demande.email}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">T├®l├®phone</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; text-align: right;">${demande.telephone || "Non renseign├®"}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Message</td>
            <td style="padding: 8px 0; color: #475569; font-size: 13px; text-align: right; max-width: 60%;">${demande.message || "Aucun"}</td>
          </tr>
        </table>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">SENGUICHET ÔÇö Billeterie ├®v├®nementielle</p>
    </div>`;
  return envoyerEmail(adminEmails, "Nouvelle demande de partenariat ÔÇö SENGUICHET", html);
};

// Notifie le demandeur du statut de sa demande de partenariat
// N'envoie un email que si le statut est d├®finitif (ACCEPTEE ou REFUSEE)
const envoyerStatutDemande = async (demandeur, statut, commentaire) => {
  if (statut !== "ACCEPTEE" && statut !== "REFUSEE") {
    return { ignor├®: true, statut };
  }
  const acceptee = statut === "ACCEPTEE";
  const sujet = acceptee
    ? "Votre demande de partenariat a ├®t├® accept├®e"
    : "Votre demande de partenariat a ├®t├® refus├®e";
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6366F1; font-size: 26px; margin: 0;">SENGUICHET</h1>
        <p style="color: #94a3b8; font-size: 13px;">Billets & ├ëv├®nements</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">${acceptee ? "­ƒÄë" : "­ƒÿö"}</div>
        <p style="color: #0f172a; font-size: 15px; margin: 0 0 12px;">Bonjour <strong>${demandeur.nom}</strong>,</p>
        ${acceptee
          ? `<p style="color: #475569; font-size: 14px; margin: 0 0 8px; line-height: 1.6;">Votre demande de partenariat pour <strong style="color: #059669;">${demandeur.organisation}</strong> a ├®t├® <strong style="color: #059669;">approuv├®e</strong> !</p>
             <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">Vous allez recevoir vos identifiants de connexion dans un email s├®par├®.</p>`
          : `<p style="color: #475569; font-size: 14px; margin: 0 0 8px; line-height: 1.6;">Votre demande de partenariat pour <strong style="color: #DC2626;">${demandeur.organisation}</strong> n'a pas ├®t├® retenue.</p>
             ${commentaire ? `<div style="background: #FEF2F2; border-radius: 8px; padding: 12px; margin-top: 12px;"><p style="color: #991B1B; font-size: 13px; margin: 0; font-style: italic;">${commentaire}</p></div>` : ""}`
        }
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">SENGUICHET ÔÇö Billeterie ├®v├®nementielle</p>
    </div>`;
  return envoyerEmail(demandeur.email, sujet, html);
};

// Envoie les identifiants de connexion ├á un nouveau partenaire
const envoyerIdentifiantsPartenaire = async (identifiants) => {
  const html = `
    <div style="font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0F0A1A, #1A1035); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(99,102,241,0.15);">
        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 28px 24px 20px; text-align: center;">
          <img src="${getLogoUrl()}" alt="SENGUICHET" style="display: block; margin: 0 auto 8px; width: 120px; height: auto;" />
          <p style="color: rgba(255,255,255,0.85); font-size: 11px; margin: 0; letter-spacing: 1px;">IDENTIFIANTS PARTENAIRE</p>
        </div>
        <div style="padding: 20px 24px;">
          <div style="background: linear-gradient(180deg, #1E1450, #16102E); border: 1px solid rgba(124,58,237,0.25); border-radius: 14px; margin-top: -12px; padding: 24px;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px;">Bonjour <strong style="color: #fff;">${identifiants.nom}</strong>,</p>
            <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0 0 16px; line-height: 1.6;">Votre compte partenaire pour <strong style="color: #A78BFA;">${identifiants.organisation}</strong> a ├®t├® cr├®├®.</p>
            <div style="background: rgba(124,58,237,0.08); border-radius: 10px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(124,58,237,0.1);">
                <span style="color: rgba(255,255,255,0.4); font-size: 12px;">Email</span>
                <span style="color: #A78BFA; font-size: 13px;">${identifiants.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                <span style="color: rgba(255,255,255,0.4); font-size: 12px;">Mot de passe</span>
                <span style="color: #FCD34D; font-size: 13px; letter-spacing: 1px; font-family: 'Courier New', monospace;">${identifiants.motDePasse}</span>
              </div>
            </div>
            <p style="color: rgba(255,255,255,0.35); font-size: 11px; margin: 12px 0 0;">Connectez-vous sur l'application SENGUICHET.</p>
          </div>
        </div>
        <div style="text-align: center; padding: 0 24px 20px;">
          <p style="color: rgba(255,255,255,0.25); font-size: 10px; margin: 0; letter-spacing: 1px;">SENGUICHET ÔÇö BILLETERIE ├ëV├ëNEMENTIELLE</p>
        </div>
      </div>
    </div>`;
  return envoyerEmail(identifiants.email, "Vos identifiants partenaire ÔÇö SENGUICHET", html);
};

// Notifie l'admin d'une demande d'├®v├®nement (cr├®ation, modification, suppression)
const envoyerNotificationDemandeEvenement = async (demande) => {
  const adminEmails = getAdminEmails();
  const action = demande.type_action === "CREATION" ? "Cr├®ation"
    : demande.type_action === "MODIFICATION" ? "Modification"
    : "Suppression";
  const html = `
    <div style="font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0F0A1A, #1A1035); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(99,102,241,0.15);">
        <div style="background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 28px 24px 20px; text-align: center;">
          <img src="${getLogoUrl()}" alt="SENGUICHET" style="display: block; margin: 0 auto 8px; width: 120px; height: auto;" />
          <p style="color: rgba(255,255,255,0.85); font-size: 11px; margin: 0; letter-spacing: 1px;">DEMANDE ${action.toUpperCase()}</p>
        </div>
        <div style="padding: 20px 24px;">
          <div style="background: linear-gradient(180deg, #1E1450, #16102E); border: 1px solid rgba(124,58,237,0.25); border-radius: 14px; margin-top: -12px; padding: 24px;">
            <h2 style="color: #A78BFA; font-size: 15px; margin: 0 0 16px; font-weight: 600;">Demande d'├®v├®nement : ${action}</h2>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.12);">
              <span style="color: rgba(255,255,255,0.4); font-size: 12px;">Organisateur</span>
              <span style="color: #fff; font-size: 13px; font-weight: 600;">${demande.nom}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.12);">
              <span style="color: rgba(255,255,255,0.4); font-size: 12px;">Email</span>
              <span style="color: #A78BFA; font-size: 13px;">${demande.email}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(124,58,237,0.12);">
              <span style="color: rgba(255,255,255,0.4); font-size: 12px;">├ëv├®nement</span>
              <span style="color: #fff; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%;">${demande.titre || "N/A"}</span>
            </div>
            ${demande.id ? `<div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: rgba(255,255,255,0.4); font-size: 12px;">ID Demande</span>
              <span style="color: #FCD34D; font-size: 12px; font-family: 'Courier New', monospace;">#${demande.id}</span>
            </div>` : ""}
          </div>
        </div>
        <div style="text-align: center; padding: 0 24px 20px;">
          <p style="color: rgba(255,255,255,0.25); font-size: 10px; margin: 0; letter-spacing: 1px;">SENGUICHET ÔÇö BILLETERIE ├ëV├ëNEMENTIELLE</p>
        </div>
      </div>
    </div>`;
  // Envoie ├á tous les admins (ADMIN_EMAIL peut contenir plusieurs adresses s├®par├®es par des virgules)
  return envoyerEmail(adminEmails, `Demande ${action.toLowerCase()} ├®v├®nement ÔÇö SENGUICHET`, html);
};

module.exports = { envoyerEmailBillet, envoyerCodeOTP, envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire, envoyerNotificationDemandeEvenement };
