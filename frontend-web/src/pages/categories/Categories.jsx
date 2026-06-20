import React from "react";
import { motion } from "framer-motion";


const categories = [
  { id: 1, name: "Concerts", description: "Vivez l'émotion de la musique live", count: 24, icon: "🎵", color: "var(--color-accent)" },
  { id: 2, name: "Festivals", description: "Des expériences uniques à partager", count: 12, icon: "🎪", color: "#C9922A" },
  { id: 3, name: "Théâtre & Culture", description: "Spectacles et représentations", count: 18, icon: "🎭", color: "var(--color-accent)" },
  { id: 4, name: "Sport", description: "Compétitions et tournois", count: 9, icon: "⚽", color: "#C9922A" },
  { id: 5, name: "Conférences", description: "Apprenez des meilleurs experts", count: 15, icon: "🎤", color: "var(--color-accent)" },
  { id: 6, name: "Soirées", description: "Dansez jusqu'au bout de la nuit", count: 20, icon: "🌙", color: "#C9922A" },
];

const Categories = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="min-h-screen">
      <section className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 max-w-6xl mx-auto">
        <h1 className="font-bold text-3xl md:text-4xl" style={{ color: "var(--color-text-primary)" }}>
          Catégories
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Explorez les événements par catégorie
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {categories.map((category) => (
            <div
              key={category.id}
              className="glass-card p-6 sm:p-8 cursor-pointer hover-lift"
              onClick={() => console.log(`Navigating to ${category.name}`)}
            >
              <span
                style={{ fontSize: "48px", display: "block" }}
              >
                {category.icon}
              </span>
              <h3 className="font-semibold text-lg" style={{ color: "var(--color-text-primary)" }}>
                {category.name}
              </h3>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {category.description}
              </p>
              <p style={{ color: "var(--color-text-muted)" }}>
                {category.count} événements
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
    </motion.div>
  );
};

export default Categories;
