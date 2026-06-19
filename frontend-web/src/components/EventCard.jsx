// Fichier : EventCard.jsx
// Rôle : Carte d'événement style affiche plein écran avec overlays

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconMapPin } from "@tabler/icons-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop";

const formatDate = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    }).replace(/\./g, "").replace(/^\w/, (c) => c.toUpperCase());
  } catch {
    return isoString;
  }
};

const formatPrice = (prixMin, prixMax) => {
  if (prixMin != null && prixMax != null) {
    if (prixMin === 0 && prixMax === 0) return "Gratuit";
    if (prixMin === prixMax) return `${prixMin.toLocaleString("fr-FR")} CFA`;
    return `${prixMin.toLocaleString("fr-FR")} - ${prixMax.toLocaleString("fr-FR")} CFA`;
  }
  return null;
};

const isNew = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (d - now) / (1000 * 60 * 60 * 24);
  return diffDays >= -7 && diffDays <= 30;
};

/**
 * EventCard — Carte d'événement style affiche plein écran
 * @param {Object} props
 * @param {number} props.id - ID de l'événement
 * @param {string} props.titre - Titre de l'événement
 * @param {string} props.affiche_url - URL de l'affiche (fond de la card)
 * @param {string} props.date_debut - Date ISO de début
 * @param {string} props.lieu - Lieu de l'événement
 * @param {string} props.ville - Ville
 * @param {string} props.categorie - Catégorie (ex: "Concert")
 * @param {number} props.prix_min - Prix minimum
 * @param {number} props.prix_max - Prix maximum
 * @param {string} props.organisateur_nom - Nom de l'organisateur
 * @param {string} props.organisateur_avatar - URL avatar organisateur (optionnel)
 * @param {boolean} props.isFeatured - Affiche le ruban "À LA UNE"
 * @param {boolean} props.isSoldOut - Affiche l'overlay "COMPLET"
 * @param {Function} props.onClick - Callback au clic (optionnel)
 */
const EventCard = ({
  id,
  titre,
  affiche_url,
  date_debut,
  lieu,
  ville,
  categorie,
  prix_min,
  prix_max,
  organisateur_nom,
  organisateur_avatar,
  isFeatured,
  isSoldOut,
  onClick,
}) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const title = titre || "Événement";
  const image = imgError || !affiche_url ? FALLBACK_IMG : affiche_url;
  const nouveau = !isFeatured && isNew(date_debut);
  const date = formatDate(date_debut);
  const location = [lieu, ville].filter(Boolean).join(", ");
  const priceLabel = formatPrice(prix_min, prix_max);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/evenements/${id}`);
    }
  };

  return (
    <article
      className="group relative rounded-[20px] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      onClick={handleClick}
    >
      <div className="relative" style={{ paddingBottom: "140%" }}>
        {/* Image plein écran */}
        <img
          src={image}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient overlay permanent (bas → haut) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* Ruban "À LA UNE" */}
        {isFeatured && (
          <span className="absolute top-[10px] left-[10px] bg-white/10 backdrop-blur-sm border border-white/30 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-[4px] z-10">
            À LA UNE
          </span>
        )}

        {/* Badge "Nouveau" */}
        {nouveau && (
          <span className="absolute top-[10px] left-[10px] bg-[#F59E0B] text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full z-10">
            Nouveau
          </span>
        )}

        {/* Badge catégorie (haut-gauche) */}
        {categorie && (
          <span className={`absolute ${isFeatured || nouveau ? "top-[42px]" : "top-[10px]"} left-[10px] bg-white/90 backdrop-blur-sm text-[#111827] text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full z-10`}>
            {categorie}
          </span>
        )}

        {/* Badge prix (haut-droite) */}
        {priceLabel && (
          <span className="absolute top-[10px] right-[10px] bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
            {priceLabel}
          </span>
        )}

        {/* Overlay "COMPLET" */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="text-white font-extrabold text-lg uppercase tracking-wider">Complet</span>
          </div>
        )}

        {/* Infos en bas sur l'image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          {date && (
            <p className="text-[#4ADE80] text-xs font-semibold mb-1 tracking-wide">{date}</p>
          )}
          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-1">
            {title}
          </h3>
          {location && (
            <p className="flex items-center gap-1 text-white/75 text-sm mb-3">
              <IconMapPin size={13} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}

          {/* Barre organisateur + CTA */}
          <div className="flex items-center justify-between">
            {organisateur_nom && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                  {organisateur_avatar ? (
                    <img src={organisateur_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    organisateur_nom.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-white text-xs font-medium truncate max-w-[120px]">
                  {organisateur_nom}
                </span>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white text-xs font-medium px-4 py-2.5 rounded-full hover:bg-white/20 transition-all flex-shrink-0 min-h-[44px]"
            >
              Voir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton loader pour EventCard (même ratio 140%)
 */
const EventCardSkeleton = () => (
  <div className="relative rounded-[20px] overflow-hidden">
    <div className="relative" style={{ paddingBottom: "140%" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s ease-in-out infinite",
        }}
      />
    </div>
  </div>
);

export { EventCardSkeleton };
export default EventCard;
