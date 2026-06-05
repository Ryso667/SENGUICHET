// Service d'envoi d'emails — confirmation billet, OTP, partenariat
// Utilise nodemailer avec SMTP configurable (Gmail, SendGrid, etc.)
const nodemailer = require("nodemailer");
require("dotenv").config();

const SITE_URL = process.env.SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:8080";

const LOGO_URL = `${SITE_URL}/uploads/logo.jpg`;

// Wrapper de mise en page commun à tous les emails
// Ajoute le logo, l'en-tête et le pied de page
const emailLayout = (content, options = {}) => {
  const { preheader } = options;
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fc;padding:30px;border-radius:16px;">
      ${preheader ? `<!--[if !mso]><!-- --><div style="display:none;font-size:1px;color:#f8f9fc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div><!--<![endif]-->` : ""}
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${LOGO_URL}" alt="SENGUICHET" style="width:150px;height:auto;display:block;margin:0 auto 12px;border-radius:8px;" />
        <h1 style="color:#0D1B2A;font-size:24px;margin:0;">SENGUICHET</h1>
        <p style="color:#00C8FF;font-size:14px;margin:4px 0 0 0;font-weight:600;">Billets & Événements</p>
      </div>
      ${content}
      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">
          SENGUICHET — Billeterie événementielle<br>
          Une question ? Contacte-nous sur <a href="mailto:support@senguichet.com" style="color:#00C8FF;text-decoration:none;">support@senguichet.com</a>
        </p>
      </div>
    </div>`;
};

// Transporteur SMTP singleton (réutilisé entre les appels d'une même instance serverless)
// Évite de créer une nouvelle connexion SMTP à chaque requête (Gmail rate-limite)
let _transporter = null;
const getTransporter = () => {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.warn("[EMAIL] SMTP non configuré (SMTP_USER/PASS manquants)");
    return null;
  }
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;
  _transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
  });
  return _transporter;
};

// Réinitialise le transporteur (utile si les credentials changent)
const resetTransporter = () => { _transporter = null; };

// Fonction utilitaire pour envoyer un email via le transporteur
const envoyerEmail = async (destinataire, sujet, html) => {
  const transporter = getTransporter();
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
  console.log(`[EMAIL] Envoyé à ${destinataire}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

// Envoie un email de confirmation de billet à l'acheteur
// ticket: { uuid, numero, evenement, categorie, prix, dateAchat, lieu, dateDebut }
// Template ticket 4 sections (adapté email)
const envoyerEmailBillet = async (destinataire, ticket) => {
  const baseUrl = process.env.TICKET_URL || `${SITE_URL}/api/billets`;
  const lienBillet = `${baseUrl}/${ticket.uuid}`;
  const catColor = ticket.couleurHex || '#6366F1';

  const content = `
    <div style="background:white;border-radius:12px;padding:0;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">

      <!-- Section A : En-tête dégradé -->
      <div style="background:linear-gradient(135deg,#6366F1,${catColor},#EC4899);padding:20px 24px;text-align:center;">
        <div style="background:white;border-radius:8px;width:80px;height:80px;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;">
          <div style="width:70px;height:70px;background:#f1f5f9;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;text-align:center;line-height:1.3;">
            QR${ticket.numero ? `<br/>#${ticket.numero}` : ''}
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;letter-spacing:2px;">RÉFÉRENCE ${ticket.numero || ''}</div>
      </div>

      <!-- Section B : Infos -->
      <div style="padding:16px 24px;text-align:center;border-bottom:2px dashed #e2e8f0;">
        <h2 style="color:#0D1B2A;font-size:16px;margin:0 0 6px;letter-spacing:0.5px;">${ticket.evenement.toUpperCase()}</h2>
        <p style="color:#475569;font-size:12px;margin:0 0 2px;">${ticket.dateDebut ? new Date(ticket.dateDebut).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</p>
        ${ticket.lieu ? `<p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">${ticket.lieu}</p>` : ''}
        <div style="display:inline-block;background:rgba(99,102,241,0.08);color:${catColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin:4px 2px;">${ticket.categorie}</div>
        <div style="display:inline-block;background:rgba(99,102,241,0.08);color:${catColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;margin:4px 2px;">${ticket.prix.toLocaleString()} FCFA</div>
      </div>

      <!-- Section C : Bouton CTA -->
      <div style="padding:20px 24px;text-align:center;background:#f8fafc;border-bottom:2px dashed #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 12px;">Présente ce QR code à l'entrée</p>
        <a href="${lienBillet}"
           style="display:inline-block;background:#00C8FF;color:#0D1B2A;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
          Voir mon billet →
        </a>
      </div>

      <!-- Section D : Talon -->
      <div style="padding:12px 24px;text-align:center;background:#f1f5f9;">
        <p style="color:#0D1B2A;font-size:10px;font-weight:700;letter-spacing:2px;margin:0 0 2px;">SENGUICHET</p>
        <p style="color:#94a3b8;font-size:9px;margin:0;">Billeterie événementielle • Entrée unique</p>
      </div>
    </div>`;

  return envoyerEmail(destinataire, `Ton billet ${ticket.numero} — ${ticket.evenement}`, emailLayout(content, { preheader: `Ton billet pour ${ticket.evenement} est confirmé !` }));
};

// Envoie un code OTP à l'acheteur pour confirmer son email
// code : chaîne de 6 chiffres, valable 5 minutes
const envoyerCodeOTP = async (destinataire, code) => {
  const content = `
    <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <p style="color:#0D1B2A;font-size:15px;margin:0 0 16px 0;">Voici ton code de confirmation :</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px;letter-spacing:8px;font-size:32px;font-weight:700;color:#00C8FF;font-family:monospace;">
        ${code}
      </div>
      <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Ce code expire dans 5 minutes.</p>
    </div>`;
  return envoyerEmail(destinataire, "Ton code de connexion SENGUICHET", emailLayout(content, { preheader: "Ton code de confirmation" }));
};

// Envoie une confirmation de demande de partenariat au demandeur
const envoyerConfirmationDemandeur = async (demande) => {
  const content = `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <p style="color:#0D1B2A;font-size:15px;margin:0 0 8px 0;">Bonjour <strong>${demande.nom}</strong>,</p>
      <p style="color:#475569;font-size:14px;margin:0 0 8px 0;">Nous avons bien reçu votre demande de partenariat pour <strong>${demande.organisation}</strong>.</p>
      <p style="color:#475569;font-size:14px;margin:0;">Notre équipe l'examinera sous 48h. Vous recevrez un email dès qu'une décision sera prise.</p>
    </div>`;
  return envoyerEmail(demande.email, "Confirmation de votre demande de partenariat", emailLayout(content));
};

// Notifie l'admin d'une nouvelle demande de partenariat
const envoyerNotificationAdmin = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const content = `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="color:#0D1B2A;font-size:18px;margin:0 0 16px 0;">Nouvelle demande de partenariat</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Nom</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.nom}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Organisation</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.organisation}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Téléphone</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.telephone || "Non renseigné"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Message</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.message || "Aucun"}</td></tr>
      </table>
    </div>`;
  return envoyerEmail(adminEmail, "Nouvelle demande de partenariat — SENGUICHET", emailLayout(content));
};

// Notifie le demandeur du statut de sa demande de partenariat
const envoyerStatutDemande = async (demandeur, statut, commentaire) => {
  const sujet = statut === "VALIDE"
    ? "Votre demande de partenariat a été acceptée"
    : "Votre demande de partenariat a été refusée";

  const content = `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <p style="color:#0D1B2A;font-size:15px;margin:0 0 8px 0;">Bonjour <strong>${demandeur.nom}</strong>,</p>
      ${statut === "VALIDE"
        ? `<p style="color:#475569;font-size:14px;margin:0 0 8px 0;">Votre demande de partenariat pour <strong>${demandeur.organisation}</strong> a été approuvée !</p>
           <p style="color:#475569;font-size:14px;margin:0;">Vous allez recevoir vos identifiants de connexion dans un email séparé.</p>`
        : `<p style="color:#475569;font-size:14px;margin:0 0 8px 0;">Votre demande de partenariat pour <strong>${demandeur.organisation}</strong> n'a pas été retenue.</p>
           ${commentaire ? `<p style="color:#94a3b8;font-size:13px;margin:0;">Motif : ${commentaire}</p>` : ""}`
      }
    </div>`;
  return envoyerEmail(demandeur.email, sujet, emailLayout(content));
};

// Envoie les identifiants de connexion à un nouveau partenaire
const envoyerIdentifiantsPartenaire = async (identifiants) => {
  const content = `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <p style="color:#0D1B2A;font-size:15px;margin:0 0 8px 0;">Bonjour <strong>${identifiants.nom}</strong>,</p>
      <p style="color:#475569;font-size:14px;margin:0 0 8px 0;">Votre compte partenaire pour <strong>${identifiants.organisation}</strong> a été créé.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td>
          <td style="padding:8px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${identifiants.email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Mot de passe</td>
          <td style="padding:8px 0;color:#00C8FF;font-size:14px;font-weight:600;text-align:right;">${identifiants.motDePasse}</td>
        </tr>
      </table>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:16px;">Connectez-vous sur l'application SENGUICHET.</p>
    </div>`;
  return envoyerEmail(identifiants.email, "Vos identifiants partenaire — SENGUICHET", emailLayout(content));
};

// Notifie l'admin d'une demande d'événement (création, modification, suppression)
const envoyerNotificationDemandeEvenement = async (demande) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  const action = demande.type_action === "CREATION" ? "Création"
    : demande.type_action === "MODIFICATION" ? "Modification"
    : "Suppression";

  const content = `
    <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="color:#0D1B2A;font-size:18px;margin:0 0 16px 0;">Demande d'événement : ${action}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Organisateur</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.nom} (${demande.email})</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Événement</td><td style="padding:6px 0;color:#0D1B2A;font-size:14px;font-weight:600;text-align:right;">${demande.titre || "N/A"}</td></tr>
        ${demande.id ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">ID demande</td><td style="padding:6px 0;color:#00C8FF;font-size:14px;font-weight:600;text-align:right;">${demande.id}</td></tr>` : ""}
      </table>
    </div>`;
  return envoyerEmail(adminEmail, `Demande ${action.toLowerCase()} événement — SENGUICHET`, emailLayout(content));
};

module.exports = { envoyerEmailBillet, envoyerCodeOTP, envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire, envoyerNotificationDemandeEvenement };
