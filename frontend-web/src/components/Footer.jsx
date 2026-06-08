/* Footer global affiché sur toutes les pages publiques
   Contient 3 colonnes (identité, navigation, contact/legal)
   + bande légale avec logo SDP et lien vers sendigitalpulse.com */
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
import sdpLogo from "../assets/sdp-logo.jpeg";

const navItems = [
  { label: "Accueil", to: "/", isHash: false },
  { label: "Comment ça marche", to: "/#how", isHash: true },
  { label: "Nos avantages", to: "/#avantages", isHash: true },
  { label: "Devenir partenaire", to: "/#devenir-partenaire", isHash: true },
  { label: "Se connecter", to: "/connexion", isHash: false },
];

const legalItems = [
  { label: "Mentions légales", to: "/mentions-legales" },
  { label: "Politique de confidentialité", to: "/confidentialite" },
  { label: "CGU", to: "/cgu" },
];

const storeBtns = [
  { label: "App Store", path: <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /> },
  { label: "Google Play", path: <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" /> },
];

const Footer = () => {
  return (
    <footer className="bg-[#0D1B2A]" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
          {/* Colonne 1 — Identité */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src={logo} alt="SENGUICHET" className="h-[44px] w-auto" />
              <span className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                <span className="text-white">SEN</span>
                <span className="text-[#00C8FF] italic font-extrabold">GUICHET</span>
              </span>
            </div>
            <p className="text-sm" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: "1.6" }}>
              Billetterie en ligne tout événement
            </p>
            <div className="mt-6">
              <p className="text-xs mb-2.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Disponible sur mobile
              </p>
              <div className="flex gap-3">
                {storeBtns.map((s) => (
                  <a key={s.label} href="#" className="footer-app-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">{s.path}</svg>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Navigation
            </p>
            <div className="space-y-2.5">
              {navItems.map((link) =>
                link.isHash ? (
                  <a key={link.label} href={link.to} className="footer-link block">{link.label}</a>
                ) : (
                  <Link key={link.label} to={link.to} className="footer-link block">{link.label}</Link>
                )
              )}
            </div>
          </div>

          {/* Colonne 3 — Contact & Légal */}
          <div>
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Contact
            </p>
            <div className="space-y-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <p>contact@senguichet.sn</p>
              <p>Téléphone : (à compléter par l'équipe)</p>
              <p>Dakar, Sénégal</p>
            </div>
            <div className="mt-6 space-y-2.5">
              {legalItems.map((item) => (
                <Link key={item.label} to={item.to} className="footer-link block">{item.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bande légale */}
        <div className="pt-6" style={{ borderTop: "1px solid #1E3448" }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[13px]" style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              &copy; 2026 SENGUICHET. Tous droits réservés.
            </p>
            <a
              href="https://sendigitalpulse.com"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] no-underline"
              style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <img src={sdpLogo} alt="SDP" className="h-6 w-auto opacity-80" />
              Un produit SDP — Sen Digital Pulse
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
