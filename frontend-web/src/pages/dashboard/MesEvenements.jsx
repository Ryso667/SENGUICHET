import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { listerEvenements } from "../../services/eventService";

const badgeConfig = {
  active: { cls: "badge-active", label: "Actif" },
  "sold-out": { cls: "badge-sold-out", label: "Complet" },
  en_attente: { cls: "badge-pending", label: "En attente" },
  refuse: { cls: "badge-sold-out", label: "Refusé" },
  suspendu: { cls: "badge-sold-out", label: "Suspendu" },
  annule: { cls: "badge-sold-out", label: "Annulé" },
};

const tabs = ["Tous", "Actifs", "En attente", "Terminés", "Annulés"];

const categories = ["Concert", "Festival", "Soirée", "Sport", "Conférence", "Autre"];

const MesEvenements = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Tous");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await listerEvenements();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((e) => {
    if (activeTab === "Actifs" && e.statut !== "active" && e.statut !== "sold-out") return false;
    if (activeTab === "En attente" && e.statut !== "en_attente") return false;
    if (activeTab === "Annulés" && e.statut !== "annule") return false;
    if (search && !e.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && e.categorie !== catFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Mes événements">
        <div className="flex items-center justify-center py-20">
          <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mes événements">
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Mes événements</h1>
          <button
            onClick={() => navigate("/dashboard/evenements/creer")}
            className="btn-primary btn-md sm:w-auto w-full"
          >
            ➕ Créer un événement
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: activeTab === t ? "var(--gradient)" : "transparent",
                color: activeTab === t ? "white" : "rgba(255,255,255,0.5)",
                border: activeTab === t ? "none" : "1px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="input-premium-wrapper flex-1">
            <span className="input-icon">🔍</span>
            <input className="input-premium" placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            className="input-premium sm:w-[180px]"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "white" }}>Vous n'avez pas encore créé d'événement</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Créez votre premier événement et commencez à vendre des billets.
            </p>
            <button onClick={() => navigate("/dashboard/evenements/creer")} className="btn-primary">Créer mon premier événement</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block glass-card overflow-hidden">
              <table className="w-full text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Événement", "Date", "Lieu", "Billets", "Revenus", "Statut", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 150ms" }}
                      onMouseEnter={(el) => el.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img src={e.img} alt={e.nom} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{e.nom}</p>
                            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{e.categorie}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{e.date}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{e.lieu}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${(e.remplis / e.capacite) * 100}%`, background: "var(--gradient)" }} />
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.remplis}/{e.capacite}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="gradient-text font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{e.revenus}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${(badgeConfig[e.statut] || badgeConfig.annule).cls}`}>
                          {(badgeConfig[e.statut] || badgeConfig.annule).label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {[
                            { icon: "👁", label: "Voir", path: `/dashboard/evenements/${e.id}` },
                            { icon: "✏️", label: "Modifier", path: `/dashboard/evenements/${e.id}/modifier` },
                            { icon: "❌", label: "Annuler", path: `/dashboard/evenements/${e.id}/annuler` },
                          ].map((a) => (
                            <button
                              key={a.label}
                              onClick={() => navigate(a.path)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-95"
                              title={a.label}
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                            >
                              {a.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((e) => (
                <div key={e.id} className="glass-card overflow-hidden">
                  <div className="relative h-[120px] overflow-hidden">
                    <img src={e.img} alt={e.nom} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,11,26,0.9), transparent)" }} />
                    <span className="absolute top-3 right-3">
                      <span className={`badge ${(badgeConfig[e.statut] || badgeConfig.annule).cls}`}>
                        {(badgeConfig[e.statut] || badgeConfig.annule).label}
                      </span>
                    </span>
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-sm font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{e.nom}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{e.date} · {e.lieu}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span style={{ color: "var(--text-secondary)" }}>{e.remplis}/{e.capacite} places</span>
                      <span className="gradient-text font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>{e.revenus}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/dashboard/evenements/${e.id}`)} className="btn-primary btn-sm flex-1">Gérer</button>
                      <button onClick={() => navigate("/dashboard/statistiques")} className="btn-ghost btn-sm flex-1">Stats</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MesEvenements;
