import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Comment ça marche", href: "#how" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 px-4 sm:px-8 py-3"
      style={{ background: "rgba(10,11,26,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <button onClick={() => navigate("/")} className="text-xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
          SenGuichet
        </button>

        <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/connexion")} className="btn-ghost btn-sm" style={{ padding: "8px 20px" }}>Se connecter</button>
          <button onClick={() => navigate("/inscription")} className="btn-primary btn-sm" style={{ padding: "8px 20px" }}>S'inscrire</button>
        </div>

        <button className="md:hidden text-white text-xl" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 p-4 rounded-xl" style={{ background: "rgba(10,11,26,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex flex-col gap-3 mb-4">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }} onClick={() => setMobileOpen(false)}>{l.label}</a>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/connexion")} className="btn-ghost btn-sm btn-full">Se connecter</button>
            <button onClick={() => navigate("/inscription")} className="btn-primary btn-sm btn-full">S'inscrire</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
