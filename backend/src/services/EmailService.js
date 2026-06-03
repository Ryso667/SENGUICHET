/**
 * Service d'envoi d'emails
 * Utilise nodemailer pour SMTP
 * Configuration dans .env : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, ADMIN_EMAIL
 */
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const MAIL_FROM = process.env.MAIL_FROM || "noreply@senguichet.sn";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@senguichet.com";

/**
 * Envoie un email de confirmation au demandeur
 * @param {Object} data - Données du formulaire
 */
const envoyerConfirmationDemandeur = async (data) => {
  try {
    await transporter.sendMail({
      from: `"SENGUICHET" <${MAIL_FROM}>`,
      to: data.email,
      subject: "Confirmation de votre demande de partenariat — SENGUICHET",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #0D1B2A; color: #fff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #00C8FF, #0077FF); text-align: center; line-height: 56px; margin: 0 auto 16px;">
                <span style="color: #fff; font-size: 24px; font-weight: 800; line-height: 56px; vertical-align: middle; display: inline-block;">S</span>
              </div>
              <h1 style="font-size: 24px; font-weight: 700; margin: 0; font-family: Outfit, sans-serif;">Merci pour votre intérêt !</h1>
            </div>

            <div style="background: #152232; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,200,255,0.12);">
              <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
                Bonjour <strong style="color: #fff;">${data.nom}</strong>,
              </p>
              <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
                Nous avons bien reçu votre demande de partenariat pour <strong style="color: #fff;">${data.organisation}</strong>. 
                Notre équipe l'analyse et vous recontactera sous <strong style="color: #00C8FF;">48 heures</strong>.
              </p>

              <div style="background: rgba(0,200,255,0.06); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(0,200,255,0.1);">
                <p style="color: #A0B4C8; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="color: #A0B4C8; padding: 4px 0;">Organisation</td><td style="color: #fff; text-align: right;">${data.organisation}</td></tr>
                  <tr><td style="color: #A0B4C8; padding: 4px 0;">Email</td><td style="color: #fff; text-align: right;">${data.email}</td></tr>
                  <tr><td style="color: #A0B4C8; padding: 4px 0;">Téléphone</td><td style="color: #fff; text-align: right;">${data.telephone}</td></tr>
                  <tr><td style="color: #A0B4C8; padding: 4px 0;">Type d'événement</td><td style="color: #fff; text-align: right; text-transform: capitalize;">${data.type_evenement}</td></tr>
                </table>
              </div>

              <p style="color: #5A7090; line-height: 1.6; font-size: 12px; margin: 20px 0 0; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
                Cet email est un accusé de réception automatique. Pour toute question urgente, contactez-nous à 
                <a href="mailto:contact@senguichet.sn" style="color: #00C8FF; text-decoration: none;">contact@senguichet.sn</a>.
              </p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #5A7090; font-size: 11px;">
                SENGUICHET — Sen Digital Pulse<br>
                <a href="https://sendigitalpulse.com" style="color: #5A7090; text-decoration: underline;">sendigitalpulse.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Email de confirmation envoyé à ${data.email}`);
    return true;
  } catch (err) {
    console.error("❌ Erreur envoi email confirmation:", err.message);
    return false;
  }
};

/**
 * Envoie une notification à l'admin pour une nouvelle demande
 * @param {Object} data - Données de la demande
 */
const envoyerNotificationAdmin = async (data) => {
  try {
    await transporter.sendMail({
      from: `"SENGUICHET" <${MAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: `[Nouvelle demande] ${data.organisation} souhaite devenir partenaire`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #0D1B2A; color: #fff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 20px; font-weight: 700; font-family: Outfit, sans-serif; margin: 0 0 16px;">
              📩 Nouvelle demande de partenariat
            </h1>

            <div style="background: #152232; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,200,255,0.12);">
              <p style="color: #A0B4C8; font-size: 14px; margin: 0 0 16px;">
                <strong style="color: #fff;">${data.organisation}</strong> a soumis une demande de partenariat.
              </p>

              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Nom</td><td style="color: #fff; text-align: right;">${data.nom}</td></tr>
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Organisation</td><td style="color: #fff; text-align: right;">${data.organisation}</td></tr>
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Email</td><td style="color: #fff; text-align: right;"><a href="mailto:${data.email}" style="color: #00C8FF;">${data.email}</a></td></tr>
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Téléphone</td><td style="color: #fff; text-align: right;">${data.telephone}</td></tr>
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Type événement</td><td style="color: #fff; text-align: right; text-transform: capitalize;">${data.type_evenement}</td></tr>
                <tr><td style="color: #A0B4C8; padding: 6px 0;">Fréquence</td><td style="color: #fff; text-align: right;">${data.nb_evenements || "Non spécifié"}</td></tr>
              </table>

              ${data.description ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
                  <p style="color: #A0B4C8; font-size: 12px; margin: 0 0 6px;">Description du projet</p>
                  <p style="color: #fff; font-size: 13px; line-height: 1.5; margin: 0;">${data.description}</p>
                </div>
              ` : ""}
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.ADMIN_URL || "http://localhost:3000/admin/partenaires"}" 
                 style="display: inline-block; padding: 12px 32px; border-radius: 12px; background: linear-gradient(135deg, #00C8FF, #0077FF); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px;">
                Voir dans le dashboard
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Notification envoyée à l'admin pour ${data.organisation}`);
    return true;
  } catch (err) {
    console.error("❌ Erreur envoi notification admin:", err.message);
    return false;
  }
};

/**
 * Envoie un email de mise à jour de statut au demandeur
 * @param {Object} data - Données de la demande
 * @param {string} statut - Nouveau statut (ACCEPTEE/REFUSEE/EN_COURS)
 * @param {string} noteAdmin - Note optionnelle de l'admin
 */
const envoyerStatutDemande = async (data, statut, noteAdmin = "") => {
  let subject, message;
  if (statut === "ACCEPTEE") {
    subject = "Votre demande de partenariat a été acceptée 🎉";
    message = `
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Bonjour <strong style="color: #fff;">${data.nom}</strong>,
      </p>
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Excellente nouvelle ! Votre demande de partenariat pour <strong style="color: #fff;">${data.organisation}</strong> 
        a été <strong style="color: #00E5A0;">acceptée</strong>. 🎉
      </p>
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Notre équipe va vous contacter dans les plus brefs délais pour discuter des modalités de collaboration.
      </p>
    `;
  } else if (statut === "REFUSEE") {
    subject = "Suivi de votre demande de partenariat — SENGUICHET";
    message = `
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Bonjour <strong style="color: #fff;">${data.nom}</strong>,
      </p>
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Nous avons bien examiné votre demande de partenariat pour <strong style="color: #fff;">${data.organisation}</strong>.
      </p>
      <p style="color: #FF4D6D; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Malheureusement, nous ne pouvons pas donner suite à votre demande à ce stade.
      </p>
    `;
  } else {
    subject = "Votre demande de partenariat est en cours d'analyse";
    message = `
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Bonjour <strong style="color: #fff;">${data.nom}</strong>,
      </p>
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Votre demande de partenariat pour <strong style="color: #fff;">${data.organisation}</strong> 
        est actuellement en cours d'analyse par notre équipe.
      </p>
      <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        Nous vous tiendrons informé dès que possible.
      </p>
    `;
  }

  if (noteAdmin) {
    message += `
      <div style="background: rgba(0,200,255,0.06); border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 3px solid #00C8FF;">
        <p style="color: #A0B4C8; font-size: 12px; margin: 0 0 4px;">Message de notre équipe</p>
        <p style="color: #fff; font-size: 13px; line-height: 1.5; margin: 0;">${noteAdmin}</p>
      </div>
    `;
  }

  try {
    await transporter.sendMail({
      from: `"SENGUICHET" <${MAIL_FROM}>`,
      to: data.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #0D1B2A; color: #fff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #00C8FF, #0077FF); text-align: center; line-height: 56px; margin: 0 auto 16px;">
                <span style="color: #fff; font-size: 24px; font-weight: 800; line-height: 56px; vertical-align: middle; display: inline-block;">S</span>
              </div>
              <h1 style="font-size: 22px; font-weight: 700; margin: 0; font-family: Outfit, sans-serif;">Mise à jour de votre demande</h1>
            </div>
            <div style="background: #152232; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,200,255,0.12);">
              ${message}
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Email de statut envoyé à ${data.email} (${statut})`);
    return true;
  } catch (err) {
    console.error("❌ Erreur envoi statut:", err.message);
    return false;
  }
};

/**
 * Envoie les identifiants de connexion à un partenaire
 * @param {Object} data - { nom, organisation, email, motDePasse }
 */
const envoyerIdentifiantsPartenaire = async (data) => {
  try {
    await transporter.sendMail({
      from: `"SENGUICHET" <${MAIL_FROM}>`,
      to: data.email,
      subject: "Vos identifiants de connexion partenaire — SENGUICHET",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #0D1B2A; color: #fff; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #00C8FF, #0077FF); text-align: center; line-height: 56px; margin: 0 auto 16px;">
                <span style="color: #fff; font-size: 24px; font-weight: 800; line-height: 56px; vertical-align: middle; display: inline-block;">S</span>
              </div>
              <h1 style="font-size: 24px; font-weight: 700; margin: 0; font-family: Outfit, sans-serif;">Bienvenue chez SENGUICHET !</h1>
            </div>
            <div style="background: #152232; border-radius: 16px; padding: 32px; border: 1px solid rgba(0,200,255,0.12);">
              <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
                Bonjour <strong style="color: #fff;">${data.nom}</strong>,
              </p>
              <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
                Votre demande de partenariat pour <strong style="color: #fff;">${data.organisation}</strong> a été acceptée.
                Voici vos identifiants pour accéder à votre espace partenaire :
              </p>

              <div style="background: rgba(0,200,255,0.06); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(0,200,255,0.1);">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="color: #A0B4C8; padding: 6px 0;">Email</td><td style="color: #fff; text-align: right; font-weight: 600;">${data.email}</td></tr>
                  <tr><td style="color: #A0B4C8; padding: 6px 0;">Mot de passe</td><td style="color: #fff; text-align: right; font-weight: 600; letter-spacing: 1px;">${data.motDePasse}</td></tr>
                </table>
              </div>

              <p style="color: #A0B4C8; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
                Connectez-vous dès maintenant sur votre espace dédié pour gérer vos événements et suivre vos statistiques.
              </p>

              <p style="color: #5A7090; line-height: 1.6; font-size: 12px; margin: 20px 0 0; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px;">
                Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe après votre première connexion.
                Pour toute question, contactez-nous à
                <a href="mailto:contact@senguichet.sn" style="color: #00C8FF; text-decoration: none;">contact@senguichet.sn</a>.
              </p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #5A7090; font-size: 11px;">
                SENGUICHET — Sen Digital Pulse<br>
                <a href="https://sendigitalpulse.com" style="color: #5A7090; text-decoration: underline;">sendigitalpulse.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Identifiants envoyés à ${data.email}`);
    return true;
  } catch (err) {
    console.error("❌ Erreur envoi identifiants:", err.message);
    return false;
  }
};

/**
 * Envoie une notification pour une demande d'événement
 * @param {Object} data - { nom, email, type_action, titre, statut, commentaire, destinataire }
 */
const envoyerNotificationDemandeEvenement = async (data) => {
  const isAdminNotif = !data.destinataire || data.destinataire === "admin";
  const isOrganisateur = data.destinataire === "organisateur";

  const actionLabels = {
    CREATION: "création d'événement",
    MODIFICATION: "modification d'événement",
    SUPPRESSION: "suppression d'événement",
  };
  const actionLabel = actionLabels[data.type_action] || "action";

  let subject, message;

  if (isAdminNotif) {
    subject = `[Nouvelle demande] ${data.nom} — ${actionLabel}`;
    message = `
      <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 16px;">
        <strong style="color:#fff;">${data.nom}</strong> a soumis une demande de <strong style="color:#00C8FF;">${actionLabel}</strong>.
      </p>
      ${data.titre ? `<p style="color:#A0B4C8;font-size:13px;margin:0 0 16px;">Événement concerné : <strong style="color:#fff;">${data.titre}</strong></p>` : ""}
      <div style="text-align:center;margin-top:20px;">
        <a href="${process.env.ADMIN_URL || "http://localhost:5173"}/admin/demandes"
           style="display:inline-block;padding:12px 32px;border-radius:12px;background:linear-gradient(135deg,#00C8FF,#0077FF);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
          Voir dans le dashboard
        </a>
      </div>
    `;
  } else if (isOrganisateur) {
    if (data.statut === "approuve") {
      subject = `✓ Demande approuvée — ${actionLabel}`;
      message = `
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Bonjour <strong style="color:#fff;">${data.nom}</strong>,
        </p>
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Votre demande de <strong style="color:#fff;">${actionLabel}</strong>
          ${data.titre ? `pour <strong style="color:#fff;">${data.titre}</strong>` : ""}
          a été <strong style="color:#00E5A0;">approuvée</strong> ✓
        </p>
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Les modifications ont été appliquées. Vous pouvez consulter votre espace pour voir les mises à jour.
        </p>
      `;
    } else if (data.statut === "evenement_cree") {
      subject = `Événement créé — ${data.titre}`;
      message = `
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Bonjour <strong style="color:#fff;">${data.nom}</strong>,
        </p>
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Votre événement <strong style="color:#fff;">${data.titre}</strong> a été créé avec succès par l'équipe SENGUICHET.
        </p>
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Vous pouvez dès à présent le gérer depuis votre tableau de bord.
        </p>
        <div style="text-align:center;margin-top:20px;">
          <a href="${process.env.ADMIN_URL || "http://localhost:5173"}/dashboard/evenements"
             style="display:inline-block;padding:12px 32px;border-radius:12px;background:linear-gradient(135deg,#00C8FF,#0077FF);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
            Voir mes événements
          </a>
        </div>
      `;
    } else {
      subject = `✗ Demande refusée — ${actionLabel}`;
      message = `
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Bonjour <strong style="color:#fff;">${data.nom}</strong>,
        </p>
        <p style="color:#A0B4C8;line-height:1.6;font-size:14px;margin:0 0 20px;">
          Votre demande de <strong style="color:#fff;">${actionLabel}</strong>
          ${data.titre ? `pour <strong style="color:#fff;">${data.titre}</strong>` : ""}
          n'a pas été retenue.
        </p>
      `;
    }

    if (data.commentaire) {
      message += `
        <div style="background:rgba(0,200,255,0.06);border-radius:12px;padding:16px;margin:16px 0;border-left:3px solid #00C8FF;">
          <p style="color:#A0B4C8;font-size:12px;margin:0 0 4px;">Message de l'équipe</p>
          <p style="color:#fff;font-size:13px;line-height:1.5;margin:0;">${data.commentaire}</p>
        </div>
      `;
    }
  }

  if (!message) return false;

  try {
    await transporter.sendMail({
      from: `"SENGUICHET" <${MAIL_FROM}>`,
      to: data.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#0D1B2A;color:#fff;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:30px;">
              <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#00C8FF,#0077FF);text-align:center;line-height:56px;margin:0 auto 16px;">
                <span style="color:#fff;font-size:24px;font-weight:800;line-height:56px;vertical-align:middle;display:inline-block;">S</span>
              </div>
              <h1 style="font-size:22px;font-weight:700;margin:0;font-family:Outfit,sans-serif;">
                ${isAdminNotif ? "Nouvelle demande" : "Mise à jour de votre demande"}
              </h1>
            </div>
            <div style="background:#152232;border-radius:16px;padding:32px;border:1px solid rgba(0,200,255,0.12);">
              ${message}
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`Email notification demande envoyé à ${data.email}`);
    return true;
  } catch (err) {
    console.error("Erreur envoi notification demande:", err.message);
    return false;
  }
};

module.exports = { envoyerConfirmationDemandeur, envoyerNotificationAdmin, envoyerStatutDemande, envoyerIdentifiantsPartenaire, envoyerNotificationDemandeEvenement };
