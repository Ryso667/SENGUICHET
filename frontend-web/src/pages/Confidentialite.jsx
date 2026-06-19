/* Page Politique de Confidentialité — thème vert clair
   Conforme RGPD, Loi sénégalaise n°2008-12, Apple App Store & Google Play Store */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "responsable", title: "Responsable du traitement" },
  { id: "donnees-collectees", title: "Données collectées" },
  { id: "finalites", title: "Finalités du traitement" },
  { id: "base-legale", title: "Base légale du traitement" },
  { id: "partage", title: "Partage des données" },
  { id: "conservation", title: "Conservation des données" },
  { id: "securite", title: "Sécurité des données" },
  { id: "vos-droits", title: "Vos droits" },
  { id: "mineurs", title: "Données des mineurs" },
  { id: "cookies", title: "Cookies et technologies de suivi" },
  { id: "transferts", title: "Transferts internationaux" },
  { id: "modifications", title: "Modifications de la politique" },
  { id: "contact", title: "Contact" },
];

const contentMap = {
  introduction: (
    <>
      La présente politique de confidentialité décrit la manière dont SENGUICHET, une plateforme éditée par SDP — Sen Digital Pulse, collecte, utilise, stocke et protège vos données personnelles.
      <br /><br />
      En utilisant notre application mobile ou notre site web, vous acceptez les pratiques décrites dans cette politique.
      <br /><br />
      Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
    </>
  ),
  responsable: (
    <>
      <p style={{ marginBottom: "12px" }}>Le responsable du traitement de vos données personnelles est :</p>
      <p style={{ marginBottom: "8px", color: "#111827" }}><strong>SDP — Sen Digital Pulse</strong></p>
      <p style={{ marginBottom: "4px" }}>Site web : <a href="https://sendigitalpulse.com" target="_blank" rel="noopener noreferrer" className="text-[#15803D] hover:underline">sendigitalpulse.com</a></p>
      <p style={{ marginBottom: "4px" }}>Email : <a href="mailto:contact@senguichet.sn" className="text-[#15803D] hover:underline">contact@senguichet.sn</a></p>
      <p style={{ marginBottom: "16px" }}>Adresse : Dakar, Sénégal</p>
      <p>Pour toute question relative à vos données personnelles, contactez-nous à : <a href="mailto:privacy@senguichet.sn" className="text-[#15803D] hover:underline">privacy@senguichet.sn</a></p>
    </>
  ),
  "donnees-collectees": (
    <>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>3.1 Données que vous nous fournissez directement :</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        <li>Numéro de téléphone (obligatoire pour l'authentification des acheteurs)</li>
        <li>Nom complet (pour les organisateurs)</li>
        <li>Adresse email (pour les organisateurs et administrateurs)</li>
        <li>Informations de paiement (numéro de téléphone mobile money — nous ne stockons pas les données de carte bancaire)</li>
      </ul>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>3.2 Données collectées automatiquement :</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        <li>Données de transaction (montants, dates, références de paiement)</li>
        <li>Données d'utilisation (événements consultés, billets achetés)</li>
        <li>Identifiant unique de l'appareil mobile</li>
        <li>Adresse IP</li>
        <li>Type d'appareil et version du système d'exploitation</li>
      </ul>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>3.3 Données que nous ne collectons PAS :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Nous ne collectons pas votre localisation GPS en temps réel</li>
        <li>Nous ne collectons pas vos contacts</li>
        <li>Nous n'accédons pas à votre galerie photo</li>
        <li>Nous ne collectons pas de données biométriques</li>
        <li>Nous ne collectons pas de données sensibles (origine ethnique, religion, opinions politiques, santé)</li>
      </ul>
    </>
  ),
  finalites: (
    <>
      <p style={{ marginBottom: "12px" }}>Nous utilisons vos données uniquement pour les finalités suivantes :</p>
      <div className="space-y-4">
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Authentification et sécurité</p>
          <p className="pl-5">Vérifier votre identité via code OTP envoyé par SMS à votre numéro de téléphone</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Gestion des billets</p>
          <p className="pl-5">Générer, envoyer et valider vos billets électroniques (QR codes)</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Traitement des paiements</p>
          <p className="pl-5">Initier et confirmer les transactions via Wave, Orange Money, Free Money, Visa et Mastercard</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Communication de service</p>
          <p className="pl-5">Vous envoyer des confirmations d'achat, rappels d'événements et notifications importantes par SMS</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Prévention de la fraude</p>
          <p className="pl-5">Détecter et empêcher les utilisations frauduleuses de la plateforme</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Amélioration du service</p>
          <p className="pl-5">Analyser l'utilisation de la plateforme pour améliorer nos fonctionnalités</p>
        </div>
      </div>
      <p className="mt-4" style={{ color: "#94A3B8", fontStyle: "italic" }}>
        Nous n'utilisons pas vos données à des fins publicitaires et ne les vendons à aucun tiers.
      </p>
    </>
  ),
  "base-legale": (
    <>
      <p style={{ marginBottom: "12px" }}>Conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 sur la protection des données personnelles et au RGPD, nos traitements reposent sur :</p>
      <div className="space-y-3">
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ L'exécution du contrat</p>
          <p className="pl-5">Le traitement est nécessaire pour vous fournir nos services de billetterie</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Le consentement</p>
          <p className="pl-5">Pour les communications marketing (si vous y avez consenti)</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ L'intérêt légitime</p>
          <p className="pl-5">Pour la prévention de la fraude et la sécurité de la plateforme</p>
        </div>
        <div>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ L'obligation légale</p>
          <p className="pl-5">Pour la conservation des données financières requises par la loi</p>
        </div>
      </div>
    </>
  ),
  partage: (
    <>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>6.1 Nous pouvons partager vos données avec :</p>
      <ul className="list-disc pl-5 space-y-2 mb-4">
        <li><strong style={{ color: "#111827" }}>Prestataires de paiement</strong> — Wave, Orange Money, Free Money, les réseaux Visa et Mastercard — uniquement les données nécessaires au traitement de votre transaction</li>
        <li><strong style={{ color: "#111827" }}>Prestataires SMS</strong> — Firebase Authentication ou AfricasTalking — uniquement votre numéro de téléphone pour l'envoi de codes OTP et notifications</li>
        <li><strong style={{ color: "#111827" }}>Hébergement et infrastructure</strong> — Nos prestataires techniques hébergent vos données de manière sécurisée</li>
        <li><strong style={{ color: "#111827" }}>Autorités légales</strong> — Si la loi l'exige ou en cas de procédure judiciaire</li>
      </ul>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>6.2 Nous ne partageons JAMAIS vos données avec :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Des annonceurs ou régies publicitaires</li>
        <li>Des courtiers en données</li>
        <li>Des tiers à des fins commerciales</li>
      </ul>
    </>
  ),
  conservation: (
    <>
      <p style={{ marginBottom: "12px" }}>Nous conservons vos données selon les durées suivantes :</p>
      <div className="space-y-2">
        <div className="flex justify-between items-start p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <span>Données de compte organisateur</span>
          <span className="text-[#15803D] text-sm font-medium whitespace-nowrap ml-4">Partenariat + 5 ans</span>
        </div>
        <div className="flex justify-between items-start p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.04)" }}>
          <span>Données de transaction et billets</span>
          <span className="text-[#15803D] text-sm font-medium whitespace-nowrap ml-4">10 ans</span>
        </div>
        <div className="flex justify-between items-start p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <span>Codes OTP</span>
          <span className="text-[#15803D] text-sm font-medium whitespace-nowrap ml-4">5 minutes</span>
        </div>
        <div className="flex justify-between items-start p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.04)" }}>
          <span>Données de navigation et logs</span>
          <span className="text-[#15803D] text-sm font-medium whitespace-nowrap ml-4">12 mois</span>
        </div>
        <div className="flex justify-between items-start p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <span>Données des acheteurs (numéro de téléphone)</span>
          <span className="text-[#15803D] text-sm font-medium whitespace-nowrap ml-4">3 ans</span>
        </div>
      </div>
      <p className="mt-4">Après ces délais, vos données sont supprimées ou anonymisées de façon irréversible.</p>
    </>
  ),
  securite: (
    <>
      <p style={{ marginBottom: "12px" }}>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Chiffrement HTTPS/TLS sur toutes les communications</li>
        <li>Chiffrement des mots de passe (bcrypt)</li>
        <li>QR codes sécurisés avec clé secrète non exposée côté client</li>
        <li>Authentification à deux facteurs (OTP) pour les acheteurs</li>
        <li>Authentification JWT pour les organisateurs et administrateurs</li>
        <li>Accès aux données limité au personnel habilité uniquement</li>
        <li>Sauvegardes régulières et sécurisées</li>
        <li>Surveillance et logs de sécurité 24/7</li>
      </ul>
      <p className="mt-4">
        En cas de violation de données personnelles présentant un risque pour vos droits, nous vous en informerons dans les meilleurs délais conformément à la réglementation.
      </p>
    </>
  ),
  "vos-droits": (
    <>
      <p style={{ marginBottom: "12px" }}>Conformément à la loi sénégalaise n°2008-12 et au RGPD, vous disposez des droits suivants :</p>
      <div className="space-y-3">
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit d'accès</p>
          <p className="pl-5">Obtenir une copie de vos données personnelles que nous détenons</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.03)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit de rectification</p>
          <p className="pl-5">Corriger des données inexactes ou incomplètes</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit à l'effacement</p>
          <p className="pl-5">Demander la suppression de vos données (sous réserve des obligations légales de conservation)</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.03)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit à la limitation du traitement</p>
          <p className="pl-5">Demander la suspension du traitement de vos données dans certains cas</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit d'opposition</p>
          <p className="pl-5">Vous opposer au traitement de vos données pour des motifs légitimes</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.03)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit à la portabilité</p>
          <p className="pl-5">Recevoir vos données dans un format structuré et lisible par machine</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "rgba(21,128,61,0.06)" }}>
          <p className="text-[#15803D] font-semibold" style={{ fontSize: "15px" }}>→ Droit de retirer votre consentement</p>
          <p className="pl-5">À tout moment, sans affecter la licéité du traitement antérieur</p>
        </div>
      </div>
      <div className="mt-5 p-4 rounded-lg" style={{ background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.15)" }}>
        <p style={{ marginBottom: "8px", color: "#111827" }}><strong>Pour exercer ces droits :</strong></p>
        <p>Email : <a href="mailto:privacy@senguichet.sn" className="text-[#15803D] hover:underline">privacy@senguichet.sn</a></p>
        <p>Nous répondons dans un délai de 30 jours.</p>
        <p className="mt-2">Vous pouvez également introduire une réclamation auprès de la <strong style={{ color: "#111827" }}>Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal : <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-[#15803D] hover:underline">www.cdp.sn</a></p>
      </div>
    </>
  ),
  mineurs: (
    <>
      <p style={{ marginBottom: "8px" }}>SENGUICHET ne collecte pas sciemment de données personnelles concernant des enfants de moins de 18 ans.</p>
      <p style={{ marginBottom: "8px" }}>Si vous êtes parent ou tuteur et pensez que votre enfant nous a fourni des données personnelles, contactez-nous immédiatement à <a href="mailto:privacy@senguichet.sn" className="text-[#15803D] hover:underline">privacy@senguichet.sn</a> et nous supprimerons ces informations dans les plus brefs délais.</p>
      <p>L'utilisation de nos services est réservée aux personnes majeures (18 ans et plus).</p>
    </>
  ),
  cookies: (
    <>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>Notre site web utilise uniquement :</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        <li><strong style={{ color: "#111827" }}>Cookies strictement nécessaires</strong> — Pour maintenir votre session de connexion et assurer la sécurité du site</li>
        <li><strong style={{ color: "#111827" }}>Cookies de performance</strong> — Pour mesurer l'utilisation du site de façon anonyme et améliorer nos services</li>
      </ul>
      <p style={{ marginBottom: "8px" }}>Nous n'utilisons pas de cookies publicitaires ou de tracking tiers.</p>
      <p style={{ marginBottom: "8px" }}>Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités du site pourraient ne plus fonctionner correctement.</p>
      <p>Notre application mobile n'utilise pas de cookies. Elle utilise le stockage local de l'appareil uniquement pour maintenir votre session de connexion.</p>
    </>
  ),
  transferts: (
    <>
      <p style={{ marginBottom: "8px" }}>Certains de nos prestataires techniques peuvent stocker des données en dehors du Sénégal.</p>
      <p style={{ marginBottom: "8px" }}>Dans ce cas, nous nous assurons que :</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        <li>Des garanties appropriées sont en place</li>
        <li>Le niveau de protection est équivalent à celui exigé par la loi sénégalaise</li>
        <li>Des clauses contractuelles types sont signées avec ces prestataires</li>
      </ul>
      <p className="text-[#15803D] font-semibold mb-2" style={{ fontSize: "15px" }}>Les principaux transferts concernent :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Firebase (Google) — authentification OTP</li>
        <li>Cloudinary — stockage des médias</li>
        <li>Hébergeur cloud — infrastructure applicative</li>
      </ul>
    </>
  ),
  modifications: (
    <>
      <p style={{ marginBottom: "8px" }}>Nous pouvons mettre à jour cette politique de confidentialité à tout moment.</p>
      <p style={{ marginBottom: "8px" }}>En cas de modification importante, nous vous en informerons par :</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        <li>Une notification dans l'application mobile</li>
        <li>Un email si vous êtes organisateur</li>
      </ul>
      <p style={{ marginBottom: "8px" }}>La date de dernière mise à jour est indiquée en haut de cette page.</p>
      <p>Nous vous encourageons à consulter régulièrement cette page.</p>
    </>
  ),
  contact: (
    <>
      <p style={{ marginBottom: "12px" }}>Pour toute question relative à cette politique de confidentialité :</p>
      <p style={{ marginBottom: "4px" }}>Email : <a href="mailto:privacy@senguichet.sn" className="text-[#15803D] hover:underline">privacy@senguichet.sn</a></p>
      <p style={{ marginBottom: "16px" }}>Courrier : SDP — Sen Digital Pulse, Dakar, Sénégal</p>
      <div className="p-4 rounded-lg" style={{ background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.15)" }}>
        <p style={{ color: "#111827", marginBottom: "4px" }}><strong>Autorité de contrôle sénégalaise :</strong></p>
        <p>Commission de Protection des Données Personnelles (CDP)</p>
        <p>Site : <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-[#15803D] hover:underline">www.cdp.sn</a></p>
      </div>
    </>
  ),
};

const Confidentialite = () => {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 600);

      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sections[i].id);
          return;
        }
      }
      setActiveSection("");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><div className="min-h-screen bg-[#FAFAFA]">
      
      <main className="max-w-[800px] mx-auto px-4 pt-32 pb-20">
        <div
          className="rounded-2xl p-8 md:p-10 mb-8"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
            style={{ color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour au formulaire
          </button>
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "#111827",
            }}
          >
            Politique de Confidentialité
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: "32px" }}>
            Dernière mise à jour : Juin 2026
          </p>

          <div
            className="rounded-xl p-6 mb-8"
            style={{
              background: "rgba(21,128,61,0.06)",
              border: "1px solid rgba(21,128,61,0.12)",
            }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "#15803D", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Table des matières
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm hover:text-[#15803D] transition-colors"
                  style={{
                    color: activeSection === s.id ? "#15803D" : "#6B7280",
                    textDecoration: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderLeft: activeSection === s.id ? "2px solid #15803D" : "2px solid transparent",
                    paddingLeft: "8px",
                  }}
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-xl p-6 md:p-7"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center"
                    style={{
                      background: "rgba(21,128,61,0.15)",
                      color: "#15803D",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h2
                    className="text-lg font-semibold"
                    style={{
                      color: "#15803D",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {section.title}
                  </h2>
                </div>
                <div
                  style={{
                      color: "#6B7280",
                      fontSize: "14px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: "1.7",
                  }}
                >
                  {contentMap[section.id]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Retour en haut"
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center shadow-lg z-50 transition-all duration-300 hover:scale-110"
          style={{
            background: "linear-gradient(135deg, #15803D, #22C55E)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </div></motion.div>
  );
};

export default Confidentialite;
