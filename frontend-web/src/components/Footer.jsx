// Fichier : Footer.jsx
// Rôle : Footer — fond clair, 4 colonnes, identité SENGUICHET, SDP branding

import React from "react";
import { Link } from "react-router-dom";
import { IconBrandInstagram, IconBrandX, IconBrandFacebook } from "@tabler/icons-react";

const columns = [
  {
    title: "Navigation",
    links: [
      { label: "Tous les événements", to: "/evenements" },
      { label: "Connexion", to: "/connexion" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGU", to: "/mentions-legales" },
      { label: "Confidentialité", to: "/confidentialite" },
      { label: "Mentions légales", to: "/mentions-legales" },
    ],
  },
];

const socials = [
  { icon: IconBrandInstagram, href: "#", label: "Instagram" },
  { icon: IconBrandX, href: "#", label: "X (Twitter)" },
  { icon: IconBrandFacebook, href: "#", label: "Facebook" },
];

const Footer = () => {
  return (
    <footer className="bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Colonne 1 — Identité SENGUICHET */}
          <div className="md:col-span-1">
            <img
              src="/images/logo.png"
              alt="SENGUICHET"
              className="h-20 md:h-24 w-auto mb-4"
            />
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4 max-w-full md:max-w-xs">
              Billetterie en ligne pour tous vos événements — concerts, festivals, spectacles, conférences.
            </p>
            <div className="flex gap-2 mb-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#15803D] hover:text-[#15803D] transition-all"
              >
                Google Play
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2.5 rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#15803D] hover:text-[#15803D] transition-all"
              >
                App Store
              </a>
            </div>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] hover:bg-[#15803D] hover:text-white transition-all"
                  aria-label={s.label}
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest mb-4">
              Navigation
            </h4>
            <div className="space-y-2.5">
              {["Tous les événements", "Concerts", "Festivals", "Contact"].map((label) => {
                const to = label === "Tous les événements" ? "/evenements" :
                           label === "Contact" ? "/contact" :
                           `/evenements?categorie=${label}`;
                return (
                  <Link
                    key={label}
                    to={to}
                    className="block text-sm text-[#6B7280] hover:text-[#15803D] transition-colors"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Colonne 3 — Légal */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest mb-4">
              Légal
            </h4>
            <div className="space-y-2.5">
              {["CGU", "Mentions légales", "Confidentialité"].map((label) => (
                <Link
                  key={label}
                  to="/mentions-legales"
                  className="block text-sm text-[#6B7280] hover:text-[#15803D] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Colonne 4 — À propos + SDP */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest mb-4">
              À propos
            </h4>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              SENGUICHET simplifie la billetterie au Sénégal. Un produit conçu avec passion.
            </p>
            <Link
              to="/a-propos"
              className="text-sm font-semibold text-[#15803D] hover:text-[#166534] transition-colors"
            >
              En savoir plus &rarr;
            </Link>
            <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
              <a
                href="https://sendigitalpulse.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity group"
              >
                <img
                  src="/images/logoSDP.png"
                  alt="Sénégal Digital Pulse"
                  className="h-32 w-auto"
                />
                <div>
                  <p className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest">
                    Un produit
                  </p>
                  <p className="text-[10px] text-[#94a3b8] group-hover:text-[#15803D] transition-colors">
                    Sénégal Digital Pulse
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <p className="text-xs text-[#94a3b8] text-center">
            &copy; 2026 SENGUICHET &middot; Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
