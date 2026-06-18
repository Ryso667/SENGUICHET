import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { listerEvenementsPublic } from "../services/eventService";
import EventCard, { EventCardSkeleton } from "../components/EventCard";
import FeaturedBanner from "../components/FeaturedBanner";
import CategoryBar from "../components/CategoryBar";

// ─────────────────────────────────────────
// useCountUp — Hook compteur animé (IntersectionObserver)
// ─────────────────────────────────────────

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || started) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return [count, ref];
}

function AnimatedCounter({ value, suffix, label }) {
  const [count, ref] = useCountUp(value);

  return (
    <div
      ref={ref}
      className="text-center"
      style={{
        opacity: count > 0 || 0,
        animation: count > 0 ? "fadeInUp 0.6s ease-out" : "none",
      }}
    >
      <div className="text-[#15803D]" style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-sm mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}

const FILTERS = ["Tous", "Concert", "Festival", "Théâtre", "Sport", "Conférence", "Gratuits"];

const Accueil = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Tous");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await listerEvenementsPublic();
        setEvents(Array.isArray(data) ? data : data.evenements || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const isFree = (e) => (e.prix_min ?? e.prix) === 0;

  const filteredEvents = events.filter((e) => {
    if (activeFilter === "Tous") return true;
    if (activeFilter === "Gratuits") return isFree(e) || e.prix_min === 0 || e.prix_max === 0;
    return (e.categorie || e.category) === activeFilter;
  });

  const featured = events[0];
  const populaires = filteredEvents.slice(0, 6);
  const aVenir = filteredEvents.slice(6, 12);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="min-h-screen">

        {/* ─── HERO ─── */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#15803D] via-[#22C55E] to-[#15803D]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 0%, transparent 50%), radial-gradient(circle at 75% 50%, white 0%, transparent 50%)" }} />
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6" style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)" }}>
              Découvrez les meilleurs événements au Sénégal
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-4 text-white">
              Vivez des moments <span className="text-[#FBBF24]">inoubliables</span>
            </h1>
            <p className="text-base md:text-lg mb-8 max-w-xl text-white/80">
              Concerts, festivals, sport, culture — trouvez et réservez vos billets en un clic.
            </p>
            <button
              onClick={() => navigate("/evenements")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base bg-white text-[#15803D] hover:bg-[#F0FDF4] transition-all"
            >
              Explorer les événements
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>

        {/* ─── SECTION VEDETTE — À NE PAS MANQUER ─── */}
        {!loading && featured && (
          <section className="py-10 px-4 max-w-7xl mx-auto">
            <FeaturedBanner event={featured} />
          </section>
        )}

        {/* ─── CATÉGORIES ─── */}
        <section className="pb-6 px-4 max-w-7xl mx-auto">
          <CategoryBar />
        </section>

        {/* ─── FILTRES + GRILLE ─── */}
        <section className="py-6 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-[#15803D] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-gray-500">Impossible de charger les événements.</p>
              <button onClick={() => window.location.reload()} className="mt-3 text-[#15803D] underline text-sm">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && populaires.length > 0 && (
            <>
              <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">Les plus populaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {populaires.map((event) => (
                  <div key={event.id} onClick={() => navigate(`/evenements/${event.id}`)} className="cursor-pointer">
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && aVenir.length > 0 && (
            <>
              <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900">À venir</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {aVenir.map((event) => (
                  <div key={event.id} onClick={() => navigate(`/evenements/${event.id}`)} className="cursor-pointer">
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">Aucun événement dans cette catégorie pour le moment.</p>
            </div>
          )}
        </section>

        {/* ─── STATISTIQUES ─── */}
        <section className="py-16 px-4" style={{ background: "var(--color-bg-soft)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
              <AnimatedCounter value={events.length || 0} suffix="+" label="Événements" />
              <AnimatedCounter value={12000} suffix="+" label="Billets vendus" />
              <AnimatedCounter value={50} suffix="+" label="Organisateurs" />
              <AnimatedCounter value={5} suffix="" label="Moyens de paiement" />
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default Accueil;
