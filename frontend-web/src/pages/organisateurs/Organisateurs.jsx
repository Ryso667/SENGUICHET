import React from "react";
import { motion } from "framer-motion";


const organisateurs = [
  { id: 1, name: "Événements Sénégal", initials: "ES", description: "Producteur de concerts et festivals depuis 2015", events: 48, city: "Dakar", verified: true },
  { id: 2, name: "Jazz SA", initials: "JS", description: "Festival international de Jazz - 10e édition", events: 12, city: "Saint-Louis", verified: true },
  { id: 3, name: "Théâtre du Soleil", initials: "TS", description: "Compagnie théâtrale basée à Saint-Louis", events: 24, city: "Saint-Louis", verified: false },
  { id: 4, name: "Tekki Labs", initials: "TL", description: "Innovation technologique et conférences", events: 8, city: "Dakar", verified: true },
  { id: 5, name: "Art Sénégal", initials: "AS", description: "Galerie d'art et expositions culturelles", events: 15, city: "Dakar", verified: false },
  { id: 6, name: "Electro SA", initials: "ES", description: "Soirées électro et événements nocturnes", events: 30, city: "Dakar", verified: true },
  { id: 7, name: "CNG", initials: "CN", description: "Commission Nationale de Gestion de la Lutte", events: 6, city: "Dakar", verified: true },
  { id: 8, name: "Fédération Athlétisme", initials: "FA", description: "Organisateur du Marathon de Dakar", events: 4, city: "Dakar", verified: true },
];

function Organisateurs() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="min-h-screen">
      <section className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 max-w-6xl mx-auto">
        <h1 className="font-bold text-3xl md:text-4xl" style={{ color: "var(--color-text-primary)" }}>
          Organisateurs
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Découvrez les organisateurs d'événements partenaires
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-10">
          {organisateurs.map((org) => (
            <div
              key={org.id}
              className="glass-card p-6 sm:p-8 cursor-pointer hover-lift"
              onClick={() => console.log(org.name)}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                {org.initials}
              </div>
              <h3
                className="font-semibold"
                style={{ color: "var(--color-text-primary)", marginTop: 12 }}
              >
                {org.name}
              </h3>
              {org.verified && (
                <span
                  style={{
                    backgroundColor: "var(--color-success-10, rgba(34, 197, 94, 0.1))",
                    color: "var(--color-success)",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    display: "inline-block",
                  }}
                >
                  Vérifié
                </span>
              )}
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                📍 {org.city}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginTop: 8 }}>
                {org.description}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {org.events} événements
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
    </motion.div>
  );
}

export default Organisateurs;
