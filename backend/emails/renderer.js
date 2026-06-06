/**
 * Utilitaire de rendu des templates email SENGUICHET
 * Charge les fichiers HTML depuis emails/templates/,
 * injecte les variables et retourne le HTML final
 */
const path = require("path");
const fs = require("fs");

const TEMPLATES_DIR = path.join(__dirname, "templates");

// Cache les templates en mémoire pour éviter les lectures disques répétées
const cache = {};

const loadTemplate = (name) => {
  if (cache[name]) return cache[name];
  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  cache[name] = fs.readFileSync(filePath, "utf-8");
  return cache[name];
};

/**
 * Rendu d'un template email
 * @param {string} templateName - Nom du template (sans .html), ou "_inline_" pour utiliser options.content
 * @param {object} data - Variables à injecter { NOM: "..." }
 * @param {object} options - Options de rendu
 * @param {string} options.logoUrl - URL du logo SENGUICHET
 * @param {string} options.preheader - Pré-en-tête caché
 * @param {string} options.siteUrl - URL de base du site
 * @param {string} options.content - Contenu HTML inline (si templateName = "_inline_")
 * @returns {string} HTML complet de l'email
 */
const renderTemplate = (templateName, data = {}, options = {}) => {
  const { logoUrl, preheader, siteUrl, content: inlineContent } = options;

  const base = loadTemplate("base");
  const content = templateName === "_inline_" ? inlineContent : loadTemplate(templateName);

  // Générer le HTML du logo dans une card carrée fond sombre
  const logoHtml = logoUrl
    ? `<div style="display:inline-block;background:#0D1B2A;border-radius:12px;padding:16px;"><img src="${logoUrl}" alt="SENGUICHET" style="width:100px;height:auto;display:block;margin:0 auto;border-radius:8px;" /></div>`
    : `<div style="display:inline-block;width:80px;height:80px;background:linear-gradient(135deg,#00C8FF,#0077FF);border-radius:12px;text-align:center;line-height:80px;"><span style="color:#fff;font-size:32px;font-weight:800;">S</span></div>`;

  // Pré-en-tête
  const preheaderHtml = preheader
    ? `<!--[if !mso]><!-- --><div style="display:none;font-size:1px;color:#0D1B2A;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div><!--<![endif]-->`
    : "";

  // Injecter le contenu
  let html = base.replace("{{CONTENT}}", content);

  // Variables globales
  html = html.replace("{LOGO_HTML}", logoHtml);
  html = html.replace("{PREHEADER}", preheaderHtml);
  html = html.replace("{SITE_URL}", siteUrl || "");

  // Variables spécifiques au template
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{${key}}`, value != null ? String(value) : "");
  }

  // Nettoyer les variables non remplacées (les laisser vides)
  html = html.replace(/\{[A-Z_0-9]+\}/g, "");

  return html;
};

module.exports = { renderTemplate };
