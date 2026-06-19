// Fichier : CategoryBar.jsx
// Rôle : Section "Explorez par catégorie" — grille de cards avec photos de fond
// Comptes dynamiques récupérés depuis l'API

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listerCategories } from "../services/eventService";

// Types d'événements possibles dans l'application (canoniques)
const CATEGORIES = [
  { label: "Concert", image: "https://i.pinimg.com/474x/15/14/ed/1514ede44200f9b6114524757a305097.jpg" },
  { label: "Festival", image: "https://i.pinimg.com/474x/25/97/88/259788cf546f5801c636dad67f4ce9bd.jpg" },
  { label: "Théâtre", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&q=80" },
  { label: "Sport", image: "https://i.pinimg.com/474x/e3/86/97/e38697559a8f726041751e1f0e30ff8f.jpg" },
  { label: "Conférence", image: "https://i.pinimg.com/474x/77/e0/0f/77e00fad67669158ab313bc9335b8806.jpg" },
  { label: "Atelier", image: "https://i.pinimg.com/474x/a5/7e/d6/a57ed65d8d684412890a0201e5e2f12a.jpg" },
  { label: "Exposition", image: "https://i.pinimg.com/474x/94/64/fc/9464fc14400472b455f7bca233002496.jpg" },
  { label: "Club / Soirée", image: "https://i.pinimg.com/474x/ce/8c/9f/ce8c9fd68afa6c637a1e0b89146c7cb5.jpg" },
  { label: "Gala", image: "https://i.pinimg.com/474x/f3/f6/0a/f3f60a1d1a421a8ff103284f5da04e52.jpg" },
  { label: "Autres / Divers", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80" },
];

const CategoryBar = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    listerCategories()
      .then((data) => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach(
          (c) => { map[c.categorie] = c.count; }
        );
        setCounts(map);
      })
      .catch(() => {
        // Silencieux — les comptes restent à 0
      });
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <h2 className="text-[28px] font-bold text-[#111827] mb-6">
        Explorez par catégorie
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat) => {
          const count = counts[cat.label] || 0;
          return (
            <article
              key={cat.label}
              onClick={() => navigate(`/evenements?categorie=${encodeURIComponent(cat.label)}`)}
              className="relative h-[180px] rounded-[20px] overflow-hidden cursor-pointer group"
            >
              <img
                src={cat.image}
                alt={cat.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />

              <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-white text-lg font-bold leading-tight">{cat.label}</h3>
                <p className="text-white/75 text-sm mt-0.5">
                  {count} événement{count !== 1 ? "s" : ""}
                </p>
                <span className="block text-[#4ADE80] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                  Explorer &rarr;
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryBar;
