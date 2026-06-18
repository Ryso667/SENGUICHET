// Fichier : Navbar.jsx
// Rôle : Barre de navigation principale — logo à gauche, nom centré, liens + CTA à droite

import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { IconSearch, IconTicket, IconMenu, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (to) => location.pathname === to;

  const navLinks = [
    { label: "Accueil", to: "/" },
    { label: "Explorer", to: "/evenements" },
    { label: "Contact", to: "/contact" },
    { label: "À propos", to: "/a-propos" },
  ];

  return (
    <nav className="h-20 md:h-24 bg-[#FAFAFA] border-b border-black/5 sticky top-0 z-50">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-1 md:gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-shrink-0"
            aria-label="Accueil SENGUICHET"
          >
            <img
              src="/images/logo.png"
              alt="SENGUICHET"
              className="h-14 md:h-[170px] w-auto animate-logo drop-shadow-xl transition-all duration-300"
            />
          </button>
          <Link to="/" className="flex items-baseline gap-0 ml-8 md:ml-36">
            <span className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ color: "#15803D" }}>
              SEN
            </span>
            <span className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
              GUICHET
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-6 mr-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to) ? "text-[#15803D]" : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => navigate("/evenements")}
            className="md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#111827] transition-colors"
            aria-label="Rechercher"
          >
            <IconSearch size={20} />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B7280] hover:text-[#111827] transition-colors"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
          <button
            onClick={() => navigate("/connexion")}
            className="hidden md:inline-flex text-sm font-semibold px-5 py-2.5 rounded-full border border-black/10 text-[#111827] hover:border-[#15803D] hover:text-[#15803D] transition-all"
          >
            Se connecter
          </button>
          <button
            onClick={() => navigate("/partenariat")}
            className="hidden md:inline-flex text-sm font-semibold px-5 py-2.5 rounded-full bg-[#15803D] text-white hover:bg-[#166534] transition-all shadow-md shadow-[#15803D]/20"
          >
            Créer un événement
          </button>
          <button
            onClick={() => navigate("/partenariat")}
            className="md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#15803D]"
            aria-label="Créer un événement"
          >
            <IconTicket size={20} />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 bg-white border-b border-black/5 shadow-lg md:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-[#15803D]/10 text-[#15803D]"
                      : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-black/5" />
              <Link
                to="/connexion"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#15803D] hover:bg-[#15803D]/5 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                to="/partenariat"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold bg-[#15803D] text-white text-center hover:bg-[#166534] transition-colors"
              >
                Créer un événement
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
