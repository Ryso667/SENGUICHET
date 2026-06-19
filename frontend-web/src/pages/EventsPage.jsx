import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconX,
  IconMapPin,
  IconAlertCircle,
  IconSearchOff,
  IconSearch,
} from "@tabler/icons-react";
import { listerEvenementsPublic, listerCategories } from "../services/eventService";
import EventCard, { EventCardSkeleton } from "../components/EventCard";

const TEMPORAL_TABS = ["Tous", "Ce week-end", "Cette semaine", "Gratuits"];

const isThisWeekend = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const day = d.getDay();
  if (day !== 0 && day !== 6) return false;
  const now = new Date();
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (6 - now.getDay()));
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);
  return d >= saturday && d <= sunday;
};

const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  return d >= now && d <= weekEnd;
};

const spring = { type: "spring", stiffness: 500, damping: 30 };

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("categorie") || "Tous");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const TABS = useMemo(() => [...TEMPORAL_TABS, ...categories], [categories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, cats] = await Promise.all([
          listerEvenementsPublic(),
          listerCategories().catch(() => []),
        ]);
        const list = Array.isArray(eventsData) ? eventsData : eventsData.evenements || [];
        setEvents(list);
        setCategories(Array.isArray(cats) ? cats.map(c => c.categorie).filter(Boolean) : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPrice = (e) => e.prix_min ?? e.prix ?? 0;

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (activeTab === "Ce week-end") return isThisWeekend(event.date_debut);
      if (activeTab === "Cette semaine") return isThisWeek(event.date_debut);
      if (activeTab === "Gratuits") return getPrice(event) === 0;
      if (activeTab !== "Tous") return (event.categorie || event.category) === activeTab;
      return true;
    }).filter((event) => {
      const p = getPrice(event);
      if (priceFilter === "free") return p === 0;
      if (priceFilter === "under10k") return p > 0 && p <= 10000;
      if (priceFilter === "10k30k") return p > 10000 && p <= 30000;
      if (priceFilter === "over30k") return p > 30000;
      return true;
    });
  }, [activeTab, priceFilter, events]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;
  const activePriceLabel = useMemo(() => {
    const labels = { all: "Tous les prix", free: "Gratuit", under10k: "< 10 000 CFA", "10k30k": "10 000 - 30 000 CFA", over30k: "> 30 000 CFA" };
    return labels[priceFilter] || "Tous les prix";
  }, [priceFilter]);

  const loadMore = useCallback(() => setVisibleCount((prev) => prev + 6), []);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    if (TEMPORAL_TABS.includes(tab)) {
      navigate("/evenements", { replace: true });
    } else {
      navigate(`/evenements?categorie=${encodeURIComponent(tab)}`, { replace: true });
    }
  }, [navigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {/* ═══════════════════════════════════════════════════════════
          HERO BANNIÈRE
          ═══════════════════════════════════════════════════════════ */}
      <section className="hero-gradient relative overflow-hidden py-16 md:py-20 px-4 md:px-8 text-center">
        <div className="absolute top-8 right-12 w-20 h-20 rounded-full bg-white/20 pointer-events-none animate-[floating_8s_ease-in-out_infinite]" aria-hidden="true" />
        <div className="absolute bottom-8 left-12 w-16 h-16 rounded-full bg-white/15 pointer-events-none animate-[floating_10s_ease-in-out_infinite_1s]" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-full bg-[#15803D]/10 pointer-events-none animate-[floating_7s_ease-in-out_infinite_0.5s]" aria-hidden="true" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
            style={{ border: "1px solid rgba(21, 128, 61, 0.4)", color: "#15803D" }}
          >
            <IconSearch size={14} />
            Explorez les événements
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold leading-tight mb-3"
            style={{ color: "#111827" }}
          >
            Tous les événements <span style={{ color: "#15803D" }}>près de chez vous</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-6"
            style={{ color: "#6B7280" }}
          >
            Concerts, festivals, théâtre, sport… trouvez l'événement qui vous correspond.
          </motion.p>

          {/* Compteur animé */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.35 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
              {filteredEvents.length} événement{filteredEvents.length !== 1 ? "s" : ""} trouvé{filteredEvents.length !== 1 ? "s" : ""}
            </motion.div>
          )}
        </div>
      </section>

      {/* Vague séparatrice */}
      <svg className="wave-separator" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="#FAFAFA" style={{ marginTop: -1 }}>
        <path d="M0,20 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
      </svg>

      {/* ═══════════════════════════════════════════════════════════
          FILTRES STICKY AVEC PILLULE GLISSANTE
          ═══════════════════════════════════════════════════════════ */}
      <div className="sticky z-40" style={{ top: "56px", background: "#FAFAFA", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 md:px-8 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className="relative px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
                style={{ color: activeTab === tab ? "#fff" : "#6B7280" }}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "#15803D" }}
                    transition={spring}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative hidden sm:block">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none text-sm font-medium px-3 py-2 pr-8 rounded-full border cursor-pointer outline-none transition-colors"
                style={{ borderColor: "#E5E7EB", color: "#111827", background: "#fff" }}
                onFocus={(e) => e.target.style.borderColor = "#15803D"}
                onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
              >
                <option value="all">Tous les prix</option>
                <option value="free">Gratuit</option>
                <option value="under10k">&lt; 10 000 CFA</option>
                <option value="10k30k">10 000 - 30 000 CFA</option>
                <option value="over30k">&gt; 30 000 CFA</option>
              </select>
              <IconChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
            </div>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowMobileFilter(true)}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full border transition-colors sm:hidden"
              style={{ borderColor: "#E5E7EB", color: "#111827", background: "#fff" }}
            >
              <IconAdjustmentsHorizontal size={16} />
              <span className="text-xs">{activePriceLabel}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowMobileFilter(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:border-[#15803D] hover:text-[#15803D]"
              style={{ borderColor: "#E5E7EB", color: "#111827", background: "#fff" }}
            >
              <IconAdjustmentsHorizontal size={16} />
              <span>Filtres</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DRAWER FILTRES (Mobile) — SPRING ANIMÉ
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMobileFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.3)" }}
              onClick={() => setShowMobileFilter(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-0 right-0 w-[300px] h-full z-[60] flex flex-col"
              style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
                <span className="font-bold text-base" style={{ color: "#111827" }}>Filtres avancés</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMobileFilter(false)}
                  className="flex items-center justify-center p-1 rounded-full"
                  style={{ color: "#111827" }}
                >
                  <IconX size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
                <div>
                  <label className="text-sm font-semibold mb-2.5 block" style={{ color: "#111827" }}>Catégorie</label>
                  <div className="flex flex-wrap gap-2">
                    {TABS.map((cat) => (
                      <motion.button
                        key={cat}
                        whileTap={{ scale: 0.95 }}
                        className={`text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                          activeTab === cat
                            ? "text-white border-[#15803D]"
                            : "hover:border-[#15803D] hover:text-[#15803D]"
                        }`}
                        style={{
                          background: activeTab === cat ? "#15803D" : "transparent",
                          borderColor: activeTab === cat ? "#15803D" : "#E5E7EB",
                          color: activeTab === cat ? "#fff" : "#6B7280",
                        }}
                        onClick={() => { handleTabClick(cat); setShowMobileFilter(false); }}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2.5 block" style={{ color: "#111827" }}>Prix</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Tous" },
                      { value: "free", label: "Gratuit" },
                      { value: "under10k", label: "< 10 000 CFA" },
                      { value: "10k30k", label: "10 000 - 30 000 CFA" },
                      { value: "over30k", label: "> 30 000 CFA" },
                    ].map((opt) => (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.95 }}
                        className={`text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                          priceFilter === opt.value
                            ? "text-white border-[#15803D]"
                            : "hover:border-[#15803D] hover:text-[#15803D]"
                        }`}
                        style={{
                          background: priceFilter === opt.value ? "#15803D" : "transparent",
                          borderColor: priceFilter === opt.value ? "#15803D" : "#E5E7EB",
                          color: priceFilter === opt.value ? "#fff" : "#6B7280",
                        }}
                        onClick={() => setPriceFilter(opt.value)}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4" style={{ borderTop: "1px solid #E5E7EB" }}>
                <motion.button
                  whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(21,128,61,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowMobileFilter(false)}
                  className="w-full py-3 rounded-full font-semibold text-sm text-white"
                  style={{ background: "#15803D" }}
                >
                  Voir les résultats ({filteredEvents.length})
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          GRILLE ÉVÉNEMENTS
          ═══════════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 pb-16">
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-extrabold" style={{ color: "#111827" }}>
              {activeTab === "Tous"
                ? "Tous les événements"
                : activeTab === "Ce week-end"
                  ? "Ce week-end"
                  : activeTab === "Cette semaine"
                    ? "Cette semaine"
                    : activeTab === "Gratuits"
                      ? "Événements gratuits"
                      : activeTab}
            </h2>
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
              {filteredEvents.length} résultat{filteredEvents.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCardSkeleton />
                </motion.div>
              ))}
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconAlertCircle size={48} style={{ color: "#DC2626" }} />
              </motion.div>
              <p className="text-lg font-semibold" style={{ color: "#111827" }}>Une erreur est survenue</p>
              <p className="text-sm max-w-sm" style={{ color: "#6B7280" }}>{error}</p>
              <motion.button
                whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(21,128,61,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white mt-2"
                style={{ background: "#15803D" }}
              >
                Réessayer
              </motion.button>
            </motion.div>
          )}

          {/* Aucun résultat */}
          {!loading && !error && filteredEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconSearchOff size={48} style={{ color: "#9CA3AF" }} />
              </motion.div>
              <p className="text-lg font-semibold" style={{ color: "#111827" }}>Aucun événement trouvé</p>
              <p className="text-sm max-w-xs" style={{ color: "#6B7280" }}>
                Essaie de modifier tes filtres ou de choisir un autre onglet.
              </p>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleTabClick("Tous"); setPriceFilter("all"); }}
                className="px-5 py-2 rounded-full text-sm font-semibold mt-2 border transition-colors hover:border-[#15803D] hover:text-[#15803D]"
                style={{ borderColor: "#E5E7EB", color: "#111827", background: "transparent" }}
              >
                Réinitialiser les filtres
              </motion.button>
            </motion.div>
          )}

          {/* Grille avec AnimatePresence + stagger */}
          <AnimatePresence mode="wait">
            {!loading && !error && filteredEvents.length > 0 && (
              <motion.div
                key={activeTab + priceFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                    >
                      <Link to={`/evenements/${event.id}`} style={{ textDecoration: "none" }}>
                        <EventCard {...event} />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center mt-10"
                  >
                    <motion.button
                      whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(21,128,61,0.25)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={loadMore}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition-shadow"
                      style={{ background: "#15803D" }}
                    >
                      Charger plus ({filteredEvents.length - visibleCount} restants)
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION PRÈS DE CHEZ VOUS REDESIGN
            ═══════════════════════════════════════════════════════════ */}
        {!loading && !error && events.length > 0 && (
          <section className="mt-12 pt-8" style={{ borderTop: "1px solid #E5E7EB" }}>
            <h2 className="text-xl md:text-2xl font-extrabold mb-2 flex items-center gap-2" style={{ color: "#111827" }}>
              <IconMapPin size={20} style={{ color: "#15803D" }} />
              Événements près de chez vous
            </h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
              Active la géolocalisation pour découvrir les événements autour de toi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.slice(0, 4).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                >
                  <Link to={`/evenements/${event.id}`} style={{ textDecoration: "none" }}>
                    <EventCard {...event} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
}
