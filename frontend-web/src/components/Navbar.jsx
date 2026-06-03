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

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0.75rem 1rem",
        background: "#0D1B2A",
        boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer" }}>
          <img
            src={logo}
            alt="SENGUICHET"
            style={{ height: 52, width: "auto", filter: "drop-shadow(0 0 8px rgba(0, 200, 255, 0.4))" }}
          />
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>
            <span style={{ color: "#FFFFFF" }}>SEN</span>
            <span style={{ color: "#00C8FF", fontStyle: "italic", fontWeight: 800 }}>GUICHET</span>
          </span>
        </button>

        <div className="hidden md:flex" style={{ alignItems: "center", gap: "32px" }}>
          {navLinks.map((l) => {
            const active = isActive(l.to);
            return (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.to)}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: active ? "#00C8FF" : "#A0B4C8",
                  textDecoration: "none",
                  position: "relative",
                  padding: "4px 0",
                  transition: "color 0.2s ease",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#00C8FF"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#A0B4C8"; }}
              >
                {l.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: 0,
                      width: "100%",
                      height: "2px",
                      background: "linear-gradient(90deg, #00C8FF 0%, #0077FF 100%)",
                      borderRadius: "1px",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex" style={{ alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => handleNavClick("#devenir-partenaire")}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
              padding: "10px 24px",
              borderRadius: "9999px",
              cursor: "pointer",
              transition: "all 0.25s ease",
              background: "linear-gradient(135deg, #00C8FF 0%, #0077FF 100%)",
              color: "#FFFFFF",
              border: "none",
              boxShadow: "0 4px 16px rgba(0,200,255,0.3)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,200,255,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,200,255,0.3)"; }}
          >
            Devenir partenaire
          </button>
          <button
            onClick={() => navigate("/connexion")}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
              padding: "10px 24px",
              borderRadius: "9999px",
              cursor: "pointer",
              transition: "all 0.25s ease",
              background: "transparent",
              color: "#A0B4C8",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#00C8FF"; e.currentTarget.style.borderColor = "rgba(0,200,255,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#A0B4C8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            Se connecter
          </button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", color: "#00C8FF", fontSize: "1.5rem", cursor: "pointer" }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            marginTop: "0.75rem",
            borderRadius: "12px",
            background: "#0D1B2A",
            border: "1px solid rgba(0, 200, 255, 0.15)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[...navLinks, { label: "Devenir partenaire", to: "#devenir-partenaire" }].map((l) => {
              const active = isActive(l.to);
              return (
                <button
                  key={l.label}
                  onClick={() => handleNavClick(l.to)}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#00C8FF" : "#A0B4C8",
                    textAlign: "left",
                    padding: "16px",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "16px" }}>
            <button onClick={() => { handleNavClick("#devenir-partenaire"); }}
              style={{ width: "100%", padding: "12px 0", borderRadius: "9999px", background: "linear-gradient(135deg, #00C8FF, #0077FF)", color: "#FFFFFF", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
              Devenir partenaire
            </button>
            <button onClick={() => { navigate("/connexion"); setMobileOpen(false); }}
              style={{ width: "100%", padding: "12px 0", borderRadius: "9999px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
              Se connecter
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
