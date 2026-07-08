import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenementsControleurs } from "../../services/controleurService";
import { useToast } from "../../context/ToastContext";
import { Shield, Loader2, ChevronRight } from "lucide-react";

const statutConfig = {
  en_attente: { label: "En attente", color: "#15803D" },
  actif: { label: "Actif", color: "#15803D" },
  refuse: { label: "Refusé", color: "#15803D" },
  suspendu: { label: "Suspendu", color: "#64748B" },
  annule: { label: "Annulé", color: "#64748B" },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const AdminControleurs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const addToast = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminListerEvenementsControleurs();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement events controleurs:", err);
        addToast("Impossible de charger les événements contrôleurs.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Pages / Contrôleurs</p>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Contrôleurs</h1>
            </div>
            <p className="text-xs capitalize" style={{ color: "#94a3b8" }}>{today}</p>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl border-l-4"
          style={{ background: "rgba(21,128,61,0.06)", borderLeftColor: "#15803D" }}>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Chaque événement dispose d'un code unique à 4 chiffres pour les contrôleurs.
          </p>
        </motion.div>

        {loading ? (
          <div className="rounded-2xl p-6 border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F8FAFC" }}>
                  <div className="flex-1">
                    <div className="admin-skeleton mb-1.5" style={{ height: 12, width: "50%" }} />
                    <div className="admin-skeleton" style={{ height: 10, width: "30%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="admin-empty-state" style={{ borderRadius: "16px", background: "#FFFFFF", border: "1px solid #E8EEF4" }}>
            <Shield size={48} />
            <h3>Aucun événement</h3>
            <p>Les événements avec contrôleurs configurés apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {events.map((e, i) => {
                const cfg = statutConfig[e.statut] || statutConfig.annule;
                return (
                  <motion.div key={e.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                    whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}
                    className="rounded-2xl p-5 transition-all border cursor-pointer"
                    style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
                    onClick={() => navigate(`/admin/controleurs/${e.id}`)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate" style={{ color: "#1a1a1a" }}>{e.nom}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs" style={{ color: "#64748B" }}>
                          <span>{e.date}</span>
                          <span style={{ color: "#D1D5DB" }}>•</span>
                          <span>{e.lieu}</span>
                          <span style={{ color: "#D1D5DB" }}>•</span>
                          <span className="font-medium flex items-center gap-1" style={{ color: cfg.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
                            {cfg.label}
                          </span>
                          {e.code ? (
                            <>
                              <span style={{ color: "#D1D5DB" }}>•</span>
                              <span className="font-mono font-bold" style={{ color: "#15803D", letterSpacing: "2px" }}>Code : {e.code}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ color: "#D1D5DB" }}>•</span>
                              <span style={{ color: "#94a3b8" }}>Pas de code</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: "#CBD5E1", flexShrink: 0 }} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default AdminControleurs;
