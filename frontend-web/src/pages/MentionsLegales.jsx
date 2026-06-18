// Fichier : MentionsLegales.jsx
// Rôle : Page Mentions Légales — thème clair/vert, SDP branding

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconArrowLeft } from "@tabler/icons-react";

const sections = [
  {
    title: "Éditeur de la plateforme",
    content: (
      <>
        <p>
          SENGUICHET est une plateforme de billetterie en ligne éditée et opérée par :
        </p>
        <p className="font-semibold text-[#111827] mt-2">
          SDP — Sen Digital Pulse
        </p>
        <p>Dakar, Sénégal</p>
        <p className="mt-2">
          Site web :{" "}
          <a href="https://sendigitalpulse.com" target="_blank" rel="noopener noreferrer" className="text-[#15803D] hover:underline">
            sendigitalpulse.com
          </a>
        </p>
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
        <p>
          L'ensemble des contenus présents sur SENGUICHET (logos, textes, graphismes)
          sont la propriété exclusive de{" "}
          <strong className="text-[#111827]">SDP — Sen Digital Pulse</strong> et sont
          protégés par les lois en vigueur.
        </p>
      </>
    ),
  },
  {
    title: "Responsabilité",
    content: (
      <>
        <p>
          SENGUICHET agit comme intermédiaire entre les organisateurs d'événements et
          les acheteurs de billets. La responsabilité de l'organisation et du déroulement
          des événements incombe aux organisateurs.
        </p>
      </>
    ),
  },
  {
    title: "Contact",
    content: (
      <>
        <p>Pour toute question relative aux mentions légales :</p>
        <p className="mt-2">
          <a href="mailto:contact@senguichet.sn" className="text-[#15803D] hover:underline font-medium">
            contact@senguichet.sn
          </a>
        </p>
      </>
    ),
  },
];

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <main className="max-w-[800px] mx-auto px-4 pt-24 md:pt-32 pb-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#15803D] transition-colors mb-8"
          >
            <IconArrowLeft size={16} />
            Retour
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-8 md:p-10"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#E2E8F0]">
              <span className="text-2xl font-bold text-[#15803D]">SEN</span>
              <span className="text-2xl font-bold text-[#111827]">GUICHET</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-8">
              Mentions Légales
            </h1>

            <div className="space-y-6">
              {sections.map((section, i) => (
                <div key={section.title}>
                  <h2 className="text-lg font-semibold text-[#111827] mb-3">
                    {section.title}
                  </h2>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {section.content}
                  </p>
                  {i < sections.length - 1 && (
                    <div className="mt-6 border-b border-[#E2E8F0]" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-[#94a3b8] hover:text-[#15803D] transition-colors"
            >
              &larr; Retour à l'accueil
            </Link>
          </div>
        </main>
      </div>
    </motion.div>
  );
};

export default MentionsLegales;
