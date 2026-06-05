/* Page Mentions Légales
   Affiche les informations légales de SENGUICHET / SDP — Sen Digital Pulse */
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const sections = [
  {
    title: "Éditeur de la plateforme",
    content: (
      <>
        SENGUICHET est une plateforme de billetterie en ligne éditée et opérée par :
        <br /><br />
        <strong style={{ color: "#F1F5F9" }}>SDP — Sen Digital Pulse</strong>
        <br />
        Site web :{" "}
        <a href="https://sendigitalpulse.com" target="_blank" rel="noopener noreferrer" style={{ color: "#00C8FF", textDecoration: "none" }}>
          sendigitalpulse.com
        </a>
        <br />
        Dakar, Sénégal
      </>
    ),
  },
  {
    title: "Hébergement",
    content: "La plateforme SENGUICHET est hébergée par des services cloud sécurisés.",
  },
  {
    title: "Propriété intellectuelle",
    content: (
      <>
        L'ensemble des contenus présents sur SENGUICHET (logos, textes, graphismes) sont la propriété exclusive de{" "}
        <strong style={{ color: "#F1F5F9" }}>SDP — Sen Digital Pulse</strong> et sont protégés par les lois en vigueur.
      </>
    ),
  },
  {
    title: "Contact",
    content: (
      <>
        Pour toute question :
        <br />
        <a href="mailto:contact@senguichet.sn" style={{ color: "#00C8FF", textDecoration: "none" }}>
          contact@senguichet.sn
        </a>
      </>
    ),
  },
];

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-20">
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
        <div
          className="rounded-2xl p-8 md:p-10 mb-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h1
            className="text-3xl md:text-4xl font-bold mb-8"
            style={{
              fontFamily: "Outfit, sans-serif",
              background: "linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mentions Légales
          </h1>

          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{
                    color: "#F1F5F9",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {section.title}
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "14px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: "1.7",
                  }}
                >
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default MentionsLegales;
