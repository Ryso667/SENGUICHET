import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { Menu, X } from "../components/Icons";

const navLinks = [
  { label: "Accueil", to: "/" },
  { label: "Comment ça marche", to: "#how" },
  { label: "Nos avantages", to: "#avantages" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (to) => {
    setMobileOpen(false);
    if (to.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const el = document.querySelector(to);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        const el = document.querySelector(to);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(to);
    }
  };

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/" && !location.hash;
    if (to.startsWith("#")) return location.hash === to;
    return location.pathname === to;
  };

  const activeUnderline = (
    <span className="absolute bottom-[-2px] left-0 w-full h-[2px] rounded-sm" style={{ background: "linear-gradient(90deg, #00C8FF 0%, #0077FF 100%)" }} />
  );

  return (
    <nav className="sticky top-0 z-50 px-4 py-3" style={{ background: "#0D1B2A", boxShadow: "0 2px 20px rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 bg-transparent border-none cursor-pointer">
          <img src={logo} alt="SENGUICHET" className="h-[52px] w-auto" style={{ filter: "drop-shadow(0 0 8px rgba(0, 200, 255, 0.4))" }} />
          <span className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
            <span className="text-white">SEN</span>
            <span className="text-[#00C8FF] italic font-extrabold">GUICHET</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l.to)}
              className={`nav-link ${isActive(l.to) ? "nav-link-active" : ""}`}
            >
              {l.label}
              {isActive(l.to) && activeUnderline}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => handleNavClick("#devenir-partenaire")} className="nav-cta">
            Devenir partenaire
          </button>
          <button onClick={() => navigate("/connexion")} className="nav-ghost">
            Se connecter
          </button>
        </div>

        <button
          className="md:hidden bg-transparent border-none text-[#00C8FF] text-2xl cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 rounded-xl" style={{ background: "#0D1B2A", border: "1px solid rgba(0, 200, 255, 0.15)" }}>
          <div className="flex flex-col">
            {[...navLinks, { label: "Devenir partenaire", to: "#devenir-partenaire" }].map((l) => {
              const active = isActive(l.to);
              return (
                <button
                  key={l.label}
                  onClick={() => handleNavClick(l.to)}
                  className="nav-mobile-item"
                  style={{ fontWeight: active ? 600 : 400, color: active ? "#00C8FF" : "#A0B4C8" }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 p-4">
            <button onClick={() => handleNavClick("#devenir-partenaire")} className="w-full py-3 rounded-[9999px] text-sm font-semibold cursor-pointer border-none text-white" style={{ background: "linear-gradient(135deg, #00C8FF, #0077FF)" }}>
              Devenir partenaire
            </button>
            <button onClick={() => { navigate("/connexion"); setMobileOpen(false); }} className="w-full py-3 rounded-[9999px] text-sm font-semibold cursor-pointer bg-transparent text-[#A0B4C8]" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              Se connecter
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
