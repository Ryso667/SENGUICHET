// Fichier : HomePage.jsx
// Rôle : Page d'accueil SenGuichet — Hero, À la une, Catégories,
//        Comment ça marche, À venir, Organisateurs, Témoignages

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  IconSearch, IconArrowRight, IconChevronLeft, IconChevronRight,
  IconCheck, IconArrowUp, IconTicket,
} from "@tabler/icons-react";
import { listerEvenementsPublic } from "../services/eventService";
import EventCard, { EventCardSkeleton } from "../components/EventCard";

/* ─── Helpers ─── */

const formatDateFr = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "short",
    }).replace(/\./g, "");
  } catch { return ""; }
};

const isFree = (e) => (e.prix_min ?? e.prix) === 0;

const isThisWeek = (d) => {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return date >= monday && date < nextMonday;
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop";

const isNew = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (d - now) / (1000 * 60 * 60 * 24);
  return diffDays >= -7 && diffDays <= 30;
};

const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const isFloat = target % 1 !== 0;
        const increment = isFloat ? target / 60 : Math.max(1, Math.floor(target / 60));
        const stepTime = duration / 60;

        timerRef.current = setInterval(() => {
          setCount((prev) => {
            const next = prev + increment;
            if (next >= target) {
              clearInterval(timerRef.current);
              observer.disconnect();
              return target;
            }
            return isFloat ? Math.round(next * 10) / 10 : Math.floor(next);
          });
        }, stepTime);

        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [target, duration]);

  return [count, ref];
};

const StatCard = ({ num, suffix = "", label, decimals = 0, displayNum }) => {
  const [count, ref] = useCountUp(num);
  const formatted = displayNum ? displayNum(count) : decimals > 0 ? count.toFixed(decimals) : count.toLocaleString("fr-FR");
  return (
    <div
      ref={ref}
      className="rounded-2xl p-5"
      style={{
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
      }}
    >
      <div className="text-3xl font-extrabold text-[#111827] mb-1">{formatted}{suffix}</div>
      <div className="text-sm text-[#6B7280]">{label}</div>
    </div>
  );
};

const isThisWeekend = (d) => {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  const sat = new Date(now);
  sat.setDate(now.getDate() + (6 - now.getDay()));
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return date >= sat && date <= sun;
};

/* ─── Hooks personnalisés ─── */

const useMagneticEffect = (ref, strength = 3) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength / 20}px, ${y * strength / 20}px)`;
    };
    const onLeave = () => { el.style.transform = "translate(0,0)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [ref, strength]);
};

const useTiltEffect = (ref, maxAngle = 4) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll("[data-tilt]");
    const onMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * maxAngle}deg) rotateX(${-y * maxAngle}deg)`;
      card.style.transition = "none";
    };
    const onLeave = (e) => {
      const card = e.currentTarget;
      card.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg)";
      card.style.transition = "transform 0.4s ease";
    };
    cards.forEach((card) => {
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [ref, maxAngle]);
};



/* ─── Section animée ─── */

const AnimatedSection = ({ children, className, ...props }) => (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.section>
);

/* ─── Props ─── */

const FILTERS = [
  { key: "Tous", label: "Tous" },
  { key: "Ce week-end", label: "Ce week-end" },
  { key: "Cette semaine", label: "Cette semaine" },
  { key: "Gratuits", label: "Gratuits" },
];

const TESTIMONIALS = [
  {
    initials: "MD", name: "Moussa D.", role: "Organisateur",
    text: "SenGuichet a transformé la façon dont je gère mes événements. La billetterie en ligne m'a fait gagner un temps précieux.",
  },
  {
    initials: "AS", name: "Aminata S.", role: "Spectatrice",
    text: "Je réserve tous mes billets sur SenGuichet maintenant. Simple, rapide, et je reçois mon QR code en un clic.",
  },
  {
    initials: "CT", name: "Cheikh T.", role: "Organisateur",
    text: "Les paiements Wave et Orange Money ont vraiment facilité la vente de billets pour mon festival.",
  },
  {
    initials: "FK", name: "Fatou K.", role: "Spectatrice",
    text: "Enfin une plateforme locale qui propose des événements partout au Sénégal. Je recommande !",
  },
];

/* ─── HomePage ─── */

const HomePage = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const tiltContainerRef = useRef(null);
  const categorieTiltRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const searchRef = useRef(null);
  const voirTousRef = useRef(null);
  const demandeRef = useRef(null);
  const exploreRef = useRef(null);
  const partenariatRef = useRef(null);

  useEffect(() => {
    listerEvenementsPublic()
      .then((data) => {
        setEvents(Array.isArray(data) ? data : data.evenements || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 600);
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const featured = events.slice(0, 8);

  // Auto-scroll carousel
  useEffect(() => {
    if (isCarouselHovered || !carouselRef.current || featured.length === 0) return;
    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + el.clientWidth * 0.8;
      el.scrollTo({ left: Math.min(next, maxScroll), behavior: "smooth" });
      if (next >= maxScroll) {
        setTimeout(() => { el.scrollTo({ left: 0, behavior: "smooth" }); }, 600);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isCarouselHovered, featured.length]);

  // Track carousel scroll position for dots
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || featured.length === 0) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / (el.children[0]?.offsetWidth + 16 || 300));
      setActiveCarouselIndex(Math.min(idx, featured.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [featured.length]);

  useMagneticEffect(voirTousRef, 4);
  useMagneticEffect(demandeRef, 4);
  useMagneticEffect(exploreRef, 3);
  useMagneticEffect(partenariatRef, 3);
  useTiltEffect(tiltContainerRef, 4);
  useTiltEffect(categorieTiltRef, 5);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (activeFilter === "Tous") return true;
      if (activeFilter === "Gratuits") return isFree(e);
      if (activeFilter === "Ce week-end") return isThisWeekend(e.date_debut);
      if (activeFilter === "Cette semaine") return isThisWeek(e.date_debut);
      return true;
    });
  }, [events, activeFilter]);

  const grid = filtered;

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: dir * 340,
        behavior: "smooth",
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/evenements?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /* ─── HERO RIGHT CARDS — rotation automatique toutes les 6s ─── */
  const [heroEvents, setHeroEvents] = useState([]);

  useEffect(() => {
    if (events.length === 0) return;

    const pick = () => {
      const shuffled = [...events].sort(() => Math.random() - 0.5);
      setHeroEvents(shuffled.slice(0, 2));
    };

    pick();
    const timer = setInterval(pick, 6000);
    return () => clearInterval(timer);
  }, [events]);

  const heroFallback = heroEvents.length === 0
    ? [
        { id: 1, titre: "Concert Live", date_debut: new Date().toISOString(), lieu: "Dakar", ville: "Sénégal", prix_min: 5000 },
        { id: 2, titre: "Festival d'Été", date_debut: new Date(Date.now() + 86400000).toISOString(), lieu: "Saint-Louis", ville: "Sénégal", prix_min: 10000 },
      ]
    : heroEvents.length === 1
    ? [...heroEvents, { id: 999, titre: "Plus d'événements bientôt", date_debut: null, lieu: "Sénégal" }]
    : heroEvents;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >

      {/* Barre de progression */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none">
        <div className="h-full bg-[#15803D] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Ticker annonces */}
      <div className="relative overflow-hidden bg-[#15803D] text-white text-[11px] md:text-sm py-2 font-medium">
        <div className="flex whitespace-nowrap animate-marquee gap-8 md:gap-12">
          <span>🔥 340+ événements organisés cette année</span>
          <span>·</span>
          <span>12 000+ billets vendus</span>
          <span>·</span>
          <span>80+ organisateurs partenaires</span>
          <span>·</span>
          <span>Paiements Wave, Orange Money & CB</span>
          <span>·</span>
          <span>🔥 340+ événements organisés cette année</span>
          <span>·</span>
          <span>12 000+ billets vendus</span>
          <span>·</span>
          <span>80+ organisateurs partenaires</span>
          <span>·</span>
          <span>Paiements Wave, Orange Money & CB</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO VISUEL (clair, animé, pas de dark)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[55vh] md:min-h-[70vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-16 py-8 md:py-20">
            {/* ── Colonne gauche ── */}
            <div className="md:w-[48%]">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}
              >
                Billetterie sénégalaise
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="font-bold leading-[1.08] mb-4"
                style={{ fontSize: "clamp(36px, 5vw, 52px)" }}
              >
                <span style={{ color: "#111827" }}>Vivez les meilleurs</span>
                <br />
                <span style={{ color: "#15803D" }}>événements</span>
                <br />
                <span style={{ color: "#111827" }}>du Sénégal</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="text-base md:text-lg mb-6 max-w-md"
                style={{ color: "#6B7280" }}
              >
                Concerts, festivals, sport, culture — trouvez et réservez vos billets en un clic.
              </motion.p>

              {/* Barre de recherche + suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                ref={searchRef}
                className="relative mb-5 max-w-lg"
              >
                <form onSubmit={handleSearch}>
                  <div
                    className="flex items-center bg-white border-2 transition-all"
                    style={{
                      borderColor: "rgba(21,128,61,0.2)",
                      borderRadius: "var(--radius-pill)",
                      boxShadow: "0 4px 20px rgba(21,128,61,0.08)",
                      padding: "14px 20px",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#15803D"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(21,128,61,0.15)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(21,128,61,0.2)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(21,128,61,0.08)"; }}
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Rechercher un événement..."
                      className="flex-1 bg-transparent border-none outline-none text-base md:text-sm"
                      style={{ color: "#111827", fontFamily: "var(--font-primary)" }}
                    />
                    <button type="submit" className="flex-shrink-0 ml-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                      style={{ color: "#9CA3AF" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#15803D"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF" }
                    >
                      <IconSearch size={20} />
                    </button>
                  </div>
                </form>

                {/* Suggestions dropdown */}
                {showSuggestions && searchQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border overflow-hidden z-50"
                    style={{ borderColor: "var(--color-border)", maxHeight: 300, overflowY: "auto" }}>
                    {events
                      .filter((e) => (e.titre || "").toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((e) => (
                        <button
                          key={e.id}
                          onClick={() => { setSearchQuery(e.titre || ""); setShowSuggestions(false); navigate(`/evenements/${e.id}`); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <IconSearch size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{e.titre}</span>
                        </button>
                      ))}
                    {events.filter((e) => (e.titre || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">Aucun résultat</p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="flex flex-wrap gap-x-2 gap-y-1 text-sm"
                style={{ color: "#9CA3AF" }}
              >
                <span className="font-semibold" style={{ color: "#111827" }}>12 000+</span> spectateurs
                <span className="opacity-40">·</span>
                <span className="font-semibold" style={{ color: "#111827" }}>340+</span> événements
                <span className="opacity-40">·</span>
                <span className="font-semibold" style={{ color: "#111827" }}>80+</span> organisateurs
              </motion.div>
            </div>

            {/* ── Colonne droite — 2 événements réels, 1 vertical (desktop only) ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="grid md:w-[52%] grid-cols-1 sm:grid-cols-2 gap-5"
            >
              {/* Événement #1 — mise en avant */}
              {heroFallback[0] && (
                <motion.button
                  onClick={() => navigate(`/evenements/${heroFallback[0].id}`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-2xl overflow-hidden text-left"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <div className="relative hero-card-pb">
                    <img
                      src={heroFallback[0].affiche_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop"}
                      alt={heroFallback[0].titre}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {heroFallback[0].date_fin && new Date(heroFallback[0].date_fin) < new Date() && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <span className="text-white font-extrabold text-xl uppercase tracking-wider">Terminé</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {heroFallback[0].date_debut && (
                        <p className="text-[#4ADE80] text-sm font-bold uppercase tracking-wide mb-1">
                          {formatDateFr(heroFallback[0].date_debut)}
                        </p>
                      )}
                      <p className="text-white text-xl font-extrabold leading-tight mb-1">
                        {heroFallback[0].titre}
                      </p>
                      <p className="text-white/70 text-sm mb-3">
                        {[heroFallback[0].lieu, heroFallback[0].ville].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center justify-between">
                        {(heroFallback[0].prix_min != null || heroFallback[0].prix != null) && (
                          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            {(heroFallback[0].prix_min ?? heroFallback[0].prix) === 0
                              ? "Gratuit"
                              : `À partir de ${((heroFallback[0].prix_min ?? heroFallback[0].prix) || 0).toLocaleString("fr-FR")} CFA`}
                          </span>
                        )}
                        <span className="bg-white/10 backdrop-blur-sm border border-white/30 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors hover:bg-white/20">
                          Voir
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )}

              {/* Événement #2 */}
              {heroFallback[1] && (
                <motion.button
                  onClick={() => navigate(`/evenements/${heroFallback[1].id}`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full relative rounded-2xl overflow-hidden text-left"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <div className="relative hero-card-pb">
                    <img
                      src={heroFallback[1].affiche_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop"}
                      alt={heroFallback[1].titre}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {heroFallback[1].date_fin && new Date(heroFallback[1].date_fin) < new Date() && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <span className="text-white font-extrabold text-lg uppercase tracking-wider">Terminé</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {heroFallback[1].date_debut && (
                        <p className="text-[#4ADE80] text-sm font-bold uppercase tracking-wide mb-1">
                          {formatDateFr(heroFallback[1].date_debut)}
                        </p>
                      )}
                      <p className="text-white text-lg font-bold leading-tight mb-1">
                        {heroFallback[1].titre}
                      </p>
                      <p className="text-white/60 text-sm mb-2">
                        {[heroFallback[1].lieu, heroFallback[1].ville].filter(Boolean).join(", ")}
                      </p>
                      <div className="flex items-center justify-between">
                        {(heroFallback[1].prix_min != null || heroFallback[1].prix != null) && (
                          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            {(heroFallback[1].prix_min ?? heroFallback[1].prix) === 0
                              ? "Gratuit"
                              : `${((heroFallback[1].prix_min ?? heroFallback[1].prix) || 0).toLocaleString("fr-FR")} CFA`}
                          </span>
                        )}
                        <span className="bg-white/10 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors hover:bg-white/20">
                          Voir
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vague décorative entre Hero et Catégories */}
      <svg className="wave-separator" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,30 C360,60 720,0 1440,30 L1440,60 L0,60 Z" fill="#FAFAFA" />
      </svg>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — EXPLOREZ PAR CATÉGORIE
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm font-semibold mb-2 text-center"
          style={{ color: "#15803D" }}
        >
          Explorez par catégorie
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-2xl md:text-4xl font-extrabold mb-8 md:mb-12 text-center"
          style={{ color: "#111827" }}
        >
          Trouvez l&apos;événement qui vous correspond
        </motion.h2>

        {/* Sera remplacé par API — compteurs statiques pour le moment */}
        <div ref={categorieTiltRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: "Concert",      count: 0, image: "https://i.pinimg.com/474x/15/14/ed/1514ede44200f9b6114524757a305097.jpg" },
            { label: "Festival",     count: 0, image: "https://i.pinimg.com/474x/25/97/88/259788cf546f5801c636dad67f4ce9bd.jpg" },
            { label: "Théâtre",      count: 0, image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&q=80" },
            { label: "Sport",        count: 0, image: "https://i.pinimg.com/474x/e3/86/97/e38697559a8f726041751e1f0e30ff8f.jpg" },
            { label: "Conférence",   count: 3, image: "https://i.pinimg.com/474x/77/e0/0f/77e00fad67669158ab313bc9335b8806.jpg" },
            { label: "Atelier",      count: 0, image: "https://i.pinimg.com/474x/a5/7e/d6/a57ed65d8d684412890a0201e5e2f12a.jpg" },
            { label: "Exposition",   count: 1, image: "https://i.pinimg.com/474x/94/64/fc/9464fc14400472b455f7bca233002496.jpg" },
            { label: "Club / Soirée", count: 0, image: "https://i.pinimg.com/474x/ce/8c/9f/ce8c9fd68afa6c637a1e0b89146c7cb5.jpg" },
            { label: "Gala",         count: 0, image: "https://i.pinimg.com/474x/f3/f6/0a/f3f60a1d1a421a8ff103284f5da04e52.jpg" },
          ].map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.08 }}
              whileHover={{ y: -6 }}
              data-tilt
              className="relative rounded-2xl overflow-hidden group cursor-pointer h-40 md:h-56"
              onClick={() => navigate(`/evenements?categorie=${encodeURIComponent(cat.label)}`)}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1] pointer-events-none"
                style={{ boxShadow: "inset 0 0 30px rgba(21,128,61,0.3)" }}
              />
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-[2]">
                <h3 className="text-white font-bold text-lg drop-shadow-sm">{cat.label}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-xs font-medium drop-shadow-sm">
                    {cat.count} événement{cat.count !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 transition-colors px-4 py-2.5 rounded-full">
                    Explorer
                    <IconArrowRight size={14} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — ÉVÉNEMENTS À LA UNE (carousel)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[28px] font-bold" style={{ color: "var(--color-text-primary)" }}>
              À la une
            </h2>
            <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              {featured.length} événements
            </span>
          </div>
          {/* Flèches nav desktop */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scrollCarousel(-1)}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
              aria-label="Précédent"
            >
              <IconChevronLeft size={20} style={{ color: "var(--color-text-primary)" }} />
            </button>
            <button
              onClick={() => scrollCarousel(1)}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
              aria-label="Suivant"
            >
              <IconChevronRight size={20} style={{ color: "var(--color-text-primary)" }} />
            </button>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Les événements les plus attendus
        </p>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[260px]">
                <EventCardSkeleton />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm py-8" style={{ color: "var(--color-text-muted)" }}>
            Aucun événement à la une pour le moment.
          </p>
        ) : (
          <div className="relative"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
          >
            {/* Edge fade indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div
              ref={(el) => { carouselRef.current = el; tiltContainerRef.current = el; }}
              className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {featured.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                  data-tilt
                  className="flex-shrink-0"
                  style={{ scrollSnapAlign: "start", width: "clamp(200px, 50vw, 300px)" }}
                >
                  <div className="active:scale-[0.97] transition-transform duration-150">
                    <EventCard {...event} isFeatured />
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Pagination dots */}
            <div className="flex justify-center gap-0 mt-4">
              {featured.slice(0, Math.min(featured.length, 6)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (carouselRef.current) {
                      const card = carouselRef.current.children[i];
                      if (card) card.scrollIntoView({ behavior: "smooth", inline: "start" });
                    }
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-300"
                  aria-label={`Aller à l'événement ${i + 1}`}
                >
                  <div
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: activeCarouselIndex === i ? 20 : 6,
                      height: 6,
                      background: activeCarouselIndex === i ? "#15803D" : "#D1D5DB",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — COMMENT ÇA MARCHE
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-16 md:py-20 px-4 md:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* SVG line de connexion (desktop only) */}
        <svg
          className="hidden md:block absolute top-[155px] left-[calc(50%+60px)] w-[calc(100%-120px)] h-8 pointer-events-none"
          viewBox="0 0 400 32"
          fill="none"
          style={{ transform: "translateX(-50%)", maxWidth: 480 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="stepLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#15803D" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#22C55E" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#15803D" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <line x1="0" y1="16" x2="360" y2="16" stroke="url(#stepLine)" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="80" cy="16" r="4" fill="#15803D" />
          <circle cx="200" cy="16" r="4" fill="#22C55E" />
          <circle cx="320" cy="16" r="4" fill="#15803D" />
          <polygon points="360,12 370,16 360,20" fill="#15803D" opacity="0.6" />
        </svg>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm font-semibold mb-2"
          style={{ color: "#15803D" }}
        >
          Comment ça marche
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-2xl md:text-4xl font-extrabold mb-8 md:mb-12"
          style={{ color: "#111827" }}
        >
          Trouvez, réservez, profitez
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: 1, icon: IconSearch, title: "Je cherche", desc: "Parcourez les événements par catégorie, date ou lieu. Trouvez celui qui vous fait vibrer." },
            { step: 2, icon: IconTicket, title: "Je réserve", desc: "Choisissez vos places et payez en toute sécurité par Wave, Orange Money ou carte." },
            { step: 3, icon: IconCheck, title: "Je profite", desc: "Recevez votre billet numérique et vivez l'expérience — pas d'impression nécessaire." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.15 }}
              whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(21,128,61,0.12)" }}
              className="rounded-2xl p-6 md:p-8 text-center relative z-10"
              style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", transition: "box-shadow 0.3s ease" }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 + i * 0.15 }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(21,128,61,0.1)" }}
              >
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 1.3 }}
                >
                  <item.icon size={28} style={{ color: "#15803D" }} />
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.4 + i * 0.15 }}
                className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold text-white"
                style={{ background: "#15803D" }}
              >
                {item.step}
              </motion.div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#111827" }}>{item.title}</h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — ÉVÉNEMENTS À VENIR (grille + filtres)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-[28px] font-bold mb-5" style={{ color: "var(--color-text-primary)" }}>
          À venir
        </h2>

        {/* Filtres — sliding pill */}
        <div className="flex gap-1 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`relative px-5 py-3 md:px-5 md:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.key ? "text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {activeFilter === f.key && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-[#15803D] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Grille */}
        {loading ? (
          <div
            className="grid gap-5 mt-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : grid.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Aucun événement trouvé pour ce filtre.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-5 mt-6"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            >
              {grid.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="active:scale-[0.97] transition-transform duration-150">
                    <EventCard key={event.id} {...event} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* CTA tout voir */}
        {!loading && grid.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              ref={voirTousRef}
              onClick={() => navigate("/evenements")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 transition-all w-full md:w-auto justify-center"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
                background: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Voir tous les événements
              <IconArrowRight size={16} />
            </button>
          </div>
        )}
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — POUR LES ORGANISATEURS
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden" style={{ borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16">
            {/* Colonne gauche */}
            <div className="md:w-1/2">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
                style={{ border: "1px solid rgba(21, 128, 61, 0.4)", color: "#15803D" }}
              >
                Pour les organisateurs
              </span>

              <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] leading-tight mb-4">
                Vous avez un événement à organiser ?
              </h2>

              <p className="text-lg md:text-xl text-[#6B7280] mb-4">
                SenGuichet vous accompagne de la création à la billetterie.
              </p>

              <p className="text-[#9CA3AF] text-sm md:text-base mb-8 leading-relaxed">
                Que vous soyez organisateur indépendant, association ou entreprise, notre plateforme
                vous offre tous les outils pour lancer, promouvoir et vendre vos billets en ligne
                en toute simplicité.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { text: "Billetterie 100 % digitale et sécurisée", delay: 0 },
                  { text: "Paiements Wave, Orange Money & carte bancaire", delay: 0.05 },
                  { text: "Tableau de bord temps réel : ventes, participants, revenus", delay: 0.1 },
                  { text: "Accompagnement personnalisé", delay: 0.15 },
                ].map((item) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: item.delay }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: item.delay + 0.1 }}
                      className="w-6 h-6 rounded-full bg-[#15803D] flex items-center justify-center flex-shrink-0 mt-0.5"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: item.delay + 0.5 }}
                      >
                        <IconCheck size={14} className="text-white" />
                      </motion.div>
                    </motion.div>
                    <span className="text-[#374151] text-sm md:text-base">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                ref={demandeRef}
                onClick={() => navigate("/partenariat")}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(21,128,61,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-4 rounded-full font-bold text-sm md:text-base transition-colors w-full md:w-auto justify-center"
                style={{
                  background: "var(--color-accent)",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(21, 128, 61, 0.4)",
                }}
              >
                Déposer une demande de partenariat
                <IconArrowRight size={18} />
              </motion.button>
            </div>

            {/* Colonne droite */}
            <div className="md:w-1/2 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <StatCard num={340} suffix="+" label="Événements organisés" />
                </motion.div>

                {/* Témoignage Moussa D. */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl p-5 flex flex-col justify-center"
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#15803D] flex items-center justify-center text-white font-bold text-sm">
                      MD
                    </div>
                    <div>
                      <p className="text-[#111827] text-sm font-semibold">Moussa D.</p>
                      <p className="text-xs text-[#6B7280]">Organisateur</p>
                    </div>
                  </div>
                  <p className="text-sm italic leading-relaxed text-[#4B5563]">
                    "SenGuichet a transformé la façon dont je gère mes événements. La billetterie en ligne m'a fait gagner un temps précieux."
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  whileHover={{ y: -4 }}
                  className="sm:col-span-2"
                >
                  <StatCard num={24} suffix="h" label="Délai de réponse moyen" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>



      <AnimatedSection className="py-16 md:py-20 px-4 md:px-8 text-center relative overflow-hidden">

        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#15803D" }}>Témoignages</p>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-10" style={{ color: "#111827" }}>Ce que disent nos utilisateurs</h2>
          <div className="relative min-h-[260px] md:min-h-[200px]">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: 40 }}
                animate={activeTestimonial === i ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col items-center"
                style={{ pointerEvents: activeTestimonial === i ? "auto" : "none" }}
              >
                <motion.div
                  animate={activeTestimonial === i ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-[#15803D] flex items-center justify-center text-white font-bold text-lg mb-4"
                >
                  {t.initials}
                </motion.div>
                <p className="text-lg md:text-xl italic leading-relaxed mb-5" style={{ color: "#4B5563", maxWidth: 600 }}>
                  "{t.text}"
                </p>
                <p className="font-semibold text-sm" style={{ color: "#111827" }}>{t.name}</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>{t.role}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center gap-0 mt-8 md:mt-48">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full cursor-pointer"
                aria-label={`Témoignage ${i + 1}`}
              >
                <motion.div
                  className="rounded-full"
                  animate={{
                    width: activeTestimonial === i ? 24 : 8,
                    height: 6,
                    background: activeTestimonial === i ? "#15803D" : "#D1D5DB",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Back to top */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className={`fixed bottom-20 md:bottom-8 right-5 w-11 h-11 rounded-full bg-[#15803D] text-white shadow-lg flex items-center justify-center z-50 transition-all duration-300 hover:bg-[#22C55E] ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Retour en haut"
      >
        <IconArrowUp size={20} />
      </motion.button>

    </motion.div>
  );
};

export default HomePage;
