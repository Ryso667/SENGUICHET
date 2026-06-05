import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { listerEvenements } from "../../services/eventService";
import { Ticket, Calendar, LayoutGrid } from "../../components/Icons";

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await listerEvenements();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const activeCount = events.filter((e) => e.statut === "active").length;
  const totalVendus = events.reduce((s, e) => s + (e.remplis || 0), 0);
  const totalCapacite = events.reduce((s, e) => s + (e.capacite || 0), 0);
  const totalRevenus = events.reduce((s, e) => {
    const num = parseInt((e.revenus || "0").replace(/\D/g, ""));
    return s + num;
  }, 0);
  const tauxRemplissage = totalCapacite > 0 ? Math.round((totalVendus / totalCapacite) * 100) : 0;

  const prochainEvent = events
    .filter((e) => e.statut === "active")
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const stats = [
    { icon: <Ticket size={20} />, label: "Total billets vendus", value: String(totalVendus) },
    { icon: "⚘", label: "Revenus générés", value: `${totalRevenus.toLocaleString()} FCFA` },
    { icon: <Calendar size={20} />, label: "Événements actifs", value: String(activeCount) },
    { icon: <LayoutGrid size={20} />, label: "Prochain événement", value: prochainEvent?.nom || "—" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl">

        <div className="mb-8" style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <h1 className="text-2xl sm:text-[28px] font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <LayoutGrid size={22} style={{ marginRight: 8 }} /> Bonjour, {user?.nom || "Organisateur"} —
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>{today}</p>
        </div>

        <div
          className="p-4 sm:p-5 rounded-xl mb-8 flex items-start gap-3"
          style={{
            background: "rgba(0, 200, 255, 0.08)",
            borderLeft: "4px solid var(--primary)",
            animation: "fadeInUp 0.4s ease-out 0.1s both",
          }}
        >
          <Ticket size={20} style={{ marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Votre espace est en lecture seule.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Pour toute modification, utilisez la section{" "}
              <button onClick={() => navigate("/dashboard/demandes")} className="underline" style={{ color: "var(--primary)" }}>Mes demandes</button>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}>
              <div className="flex items-center justify-between">
                <span className="text-lg">{s.icon}</span>
                <span className="stat-value text-lg" style={{ fontSize: "22px" }}>{s.value}</span>
              </div>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8 mb-8" style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>Mes événements récents</h2>
            <button onClick={() => navigate("/dashboard/evenements")} className="btn-ghost btn-sm">Voir tout</button>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
          ) : events.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>Aucun événement</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.slice(0, 3).map((ev, i) => (
                <div key={ev.nom} className="group overflow-hidden" style={{ borderRadius: "20px", background: "var(--surface)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", animation: `fadeInUp 0.5s ease-out ${0.3 + i * 0.15}s both`, transition: "transform 250ms, box-shadow 250ms" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "var(--glow-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <div className="relative h-[160px] overflow-hidden">
                    <img src={ev.img} alt={ev.nom} className="w-full h-full object-cover transition-transform duration-500" style={{ groupHover: "scale-110" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,11,26,0.9) 0%, transparent 60%)" }} />
                    <span className="absolute top-3 left-3">
                      <span className={`badge ${ev.statut === "active" ? "badge-active" : ev.statut === "pending" ? "badge-pending" : "badge-sold-out"}`}>
                        {ev.statut === "active" ? "Actif" : ev.statut === "pending" ? "En attente" : "Complet"}
                      </span>
                    </span>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-base font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{ev.nom}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ev.date} · {ev.lieu}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-2 rounded-full" style={{ width: `${(ev.remplis / ev.capacite) * 100}%`, background: "var(--gradient)" }} />
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ev.remplis} / {ev.capacite}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="gradient-text font-semibold" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{ev.revenus}</span>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/dashboard/evenements/${ev.id}`)} className="btn-primary btn-sm" style={{ padding: "6px 14px", fontSize: "11px" }}>Détails</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
