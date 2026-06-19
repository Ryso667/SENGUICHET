// Fichier : FeaturedBanner.jsx
// Rôle : Bannière "À ne pas manquer" en haut de la page d'accueil — grand visuel avec CTA

import React from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";

const FeaturedBanner = ({ titre, affiche_url, date_debut, lieu, ville, id }) => {
  const navigate = useNavigate();

  if (!titre) return null;

  const image = affiche_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=600&fit=crop";
  const location = [lieu, ville].filter(Boolean).join(", ");

  const dateStr = date_debut
    ? new Date(date_debut).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        <h2 className="font-semibold text-[#111827] text-lg">À ne pas manquer</h2>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/evenements/${id}`)}
      >
        <div className="relative" style={{ paddingBottom: "40%" }}>
          <img
            src={image}
            alt={titre}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Événement vedette
            </span>
            <h3 className="text-white font-bold text-xl md:text-3xl leading-tight mb-2 max-w-xl">
              {titre}
            </h3>
            {dateStr && (
              <p className="text-white/80 text-sm md:text-base mb-1">{dateStr}</p>
            )}
            {location && (
              <p className="text-white/60 text-sm">{location}</p>
            )}
          </div>
        </div>

        <div className="absolute top-6 right-6 bg-white/15 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconArrowRight size={24} className="text-white" />
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanner;
