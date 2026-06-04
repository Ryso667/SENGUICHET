// Service d'envoi d'emails — ticket confirmation après paiement
// Utilise nodemailer avec SMTP configurable (Gmail, SendGrid, etc.)
const nodemailer = require("nodemailer");
require("dotenv").config();

const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("⚠️ SMTP non configuré. Les emails ne seront pas envoyés.");
    return null;
  }

  // SMTP_SECURE: true si non défini et port 465, sinon false (STARTTLS)
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

// Envoie un email de confirmation de billet à l'acheteur
// ticket: { uuid, numero, evenement, categorie, prix, dateAchat, qrPayload }
// destinataire: email de l'acheteur
const envoyerEmailBillet = async (destinataire, ticket) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SIMULÉ] À: ${destinataire} — Ticket ${ticket.numero} pour ${ticket.evenement}`);
    return { simulé: true, destinataire, ticket: ticket.numero };
  }

  const baseUrl = process.env.TICKET_URL || "https://senguichet.com/billet";
  const lienBillet = `${baseUrl}/${ticket.uuid}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366F1; font-size: 28px; margin: 0;">SENGUICHET</h1>
        <p style="color: #94a3b8; font-size: 14px;">Billets & Événements</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 16px 0;">🎫 Ton billet est confirmé !</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Événement</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${ticket.evenement}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Catégorie</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${ticket.categorie}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Montant</td>
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${ticket.prix.toLocaleString()} FCFA</td>
          </tr>
          <tr><td colspan="2" style="border-bottom: 1px solid #f1f5f9;"></td></tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 13px;">Référence</td>
            <td style="padding: 10px 0; color: #6366F1; font-size: 14px; font-weight: 700; text-align: right;">${ticket.numero}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${lienBillet}"
             style="display: inline-block; background: linear-gradient(135deg, #6366F1, #EC4899); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Voir mon billet →
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
          Présente ce QR code à l'entrée depuis l'application SENGUICHET.
        </p>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <p style="color: #94a3b8; font-size: 11px;">
          SENGUICHET — Billeterie événementielle<br>
          Une question ? Contacte-nous sur support@senguichet.com
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SENGUICHET" <${process.env.MAIL_FROM || user}>`,
      to: destinataire,
      subject: `🎫 Ton billet ${ticket.numero} — ${ticket.evenement}`,
      html,
    });
    console.log(`Email envoyé à ${destinataire}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Erreur envoi email:", err.message);
    return { success: false, erreur: err.message };
  }
};

// Envoie un code OTP à l'acheteur pour confirmer son email
// code : chaîne de 6 chiffres, valable 5 minutes
const envoyerCodeOTP = async (destinataire, code) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[OTP SIMULÉ] ${destinataire} → Code: ${code}`);
    return { simulé: true, destinataire, code };
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8f9fc; padding: 30px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366F1; font-size: 24px; margin: 0;">SENGUICHET</h1>
        <p style="color: #94a3b8; font-size: 14px;">Confirmation de connexion</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <p style="color: #0f172a; font-size: 15px; margin: 0 0 16px 0;">Voici ton code de confirmation :</p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #6366F1; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Ce code expire dans 5 minutes.</p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
        SENGUICHET — Billeterie événementielle
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SENGUICHET" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: destinataire,
      subject: "Ton code de connexion SENGUICHET",
      html,
    });
    console.log(`OTP envoyé à ${destinataire}: ${info.messageId}`);
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
    console.log(`[EMAIL SIMULÉ] À: ${destinataire} — ${sujet}`);
    return { simulé: true, destinataire };
  }
  const info = await transporter.sendMail({
    from: `"SENGUICHET" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: destinataire,
    subject: sujet,
    html,
  });
  console.log(`Email envoyé à ${destinataire}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

// Envoie un email de confirmation au demandeur après soumission d'une demande de partenariat
const envoyerConfirmationDemandeur = async (demande) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#f8f9fc;border-radius:16px;">
      <h1 style="color:#6366F1;">SENGUICHET</h1>
      <p>Bonjour <strong>${demande.nom}</strong>,</p>
      <p>Nous avons bien reçu votre demande de partenariat pour <strong>${demande.organisation}</strong>.</p>
      <p>Notre équipe l'examinera sous 48h. Vous recevrez un email dès qu'une décision sera prise.</p>
      <p style="color:#94a3b8;font-size:12px;">SENGUICHET — Billeterie événementielle</p>
    </div>`;
  return envoyerEmail(demande.email, "Confirmation de votre demande de partenariat", html);
};

// Notifie l'admin d'une nouvelle demande de partenariat
const envoyerNotificationAdmin = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#f8f9fc;border-radius:16px;">
      <h2>Nouvelle demande de partenariat</h2>
      <p><strong>Nom :</strong> ${demande.nom}</p>
      <p><strong>Organisation :</strong> ${demande.organisation}</p>
      <p><strong>Email :</strong> ${demande.email}</p>
      <p><strong>Téléphone :</strong> ${demande.telephone || "Non renseigné"}</p>
      <p><strong>Message :</strong> ${demande.message || "Aucun"}</p>
    </div>`;
  return envoyerEmail(adminEmail, "Nouvelle demande de partenariat — SENGUICHET", html);
};

// Notifie le demandeur du statut de sa demande de partenariat
const envoyerStatutDemande = async (demandeur, statut, commentaire) => {
  const sujet = statut === "VALIDE"
    ? "Votre demande de partenariat a été acceptée"
    : "Votre demande de partenariat a été refusée";
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#f8f9fc;border-radius:16px;">
      <h1 style="color:#6366F1;">SENGUICHET</h1>
      <p>Bonjour <strong>${demandeur.nom}</strong>,</p>
      ${statut === "VALIDE"
        ? `<p>Votre demande de partenariat pour <strong>${demandeur.organisation}</strong> a été approuvée !</p>
           <p>Vous allez recevoir vos identifiants de connexion dans un email séparé.</p>`
        : `<p>Votre demande de partenariat pour <strong>${demandeur.organisation}</strong> n'a pas été retenue.</p>
           ${commentaire ? `<p>Motif : ${commentaire}</p>` : ""}`
      }
      <p style="color:#94a3b8;font-size:12px;">SENGUICHET — Billeterie événementielle</p>
    </div>`;
  return envoyerEmail(demandeur.email, sujet, html);
};

// Envoie les identifiants de connexion à un nouveau partenaire
const envoyerIdentifiantsPartenaire = async (identifiants) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#f8f9fc;border-radius:16px;">
      <h1 style="color:#6366F1;">SENGUICHET</h1>
      <p>Bonjour <strong>${identifiants.nom}</strong>,</p>
      <p>Votre compte partenaire pour <strong>${identifiants.organisation}</strong> a été créé.</p>
      <p><strong>Email :</strong> ${identifiants.email}</p>
      <p><strong>Mot de passe :</strong> ${identifiants.motDePasse}</p>
      <p style="color:#94a3b8;font-size:12px;">Connectez-vous sur l'application SENGUICHET.</p>
    </div>`;
  return envoyerEmail(identifiants.email, "Vos identifiants partenaire — SENGUICHET", html);
};

// Notifie l'admin d'une demande d'événement (création, modification, suppression)
const envoyerNotificationDemandeEvenement = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const action = demande.type_action === "CREATION" ? "Création"
    : demande.type_action === "MODIFICATION" ? "Modification"
    : "Suppression";
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#f8f9fc;border-radius:16px;">
      <h2>Demande d'événement : ${action}</h2>
      <p><strong>Organisateur :</strong> ${demande.nom} (${demande.email})</p>
      <p><strong>Événement :</strong> ${demande.titre || "N/A"}</p>
      ${demande.id ? `<p><strong>ID demande :</strong> ${demande.id}</p>` : ""}
    </div>`;
  return envoyerEmail(adminEmail, `Demande ${action.toLowerCase()} événement — SENGUICHET`, html);
};

module.exports = { envoyerEmailBillet, envoyerCodeOTP, envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire, envoyerNotificationDemandeEvenement };
