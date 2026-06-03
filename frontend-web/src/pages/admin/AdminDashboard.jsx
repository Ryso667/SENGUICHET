import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenements } from "../../services/eventService";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminListerEvenements();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.statut === "actif").length;
  const suspendedEvents = totalEvents - activeEvents;

  const adminStats = [
    { label: "Organisateurs", value: new Set(events.map((e) => e.email)).size.toString() || "—", icon: "👥" },
    { label: "Événements total", value: String(totalEvents), icon: "📅" },
    { label: "Événements actifs", value: String(activeEvents), icon: "🎫" },
    { label: "Suspendus", value: String(suspendedEvents), icon: "💰" },
  ];

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] flex flex-col">
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Dashboard Admin</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>{today}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {adminStats.map((stat) => (
              <div key={stat.label} className="glass-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-lg sm:text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--error))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</span>
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6">
              <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>Derniers événements</h2>
              {loading ? (
                <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div>
                        <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{e.nom}</p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.organisateur}</p>
                      </div>
                      <span className={`badge ${e.statut === "actif" ? "badge-active" : "badge-sold-out"}`}>
                        {e.statut === "actif" ? "Actif" : e.statut === "en_attente" ? "En attente" : e.statut === "suspendu" ? "Suspendu" : "Refusé"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => navigate("/admin/evenements")} className="btn-ghost btn-sm btn-full mt-3">Voir tous les événements</button>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>Organisateurs</h2>
              <div className="space-y-3">
                {[
                  { nom: "Moussa Fall", email: "moussa@email.com", statut: "VALIDE" },
                  { nom: "Aminata Ba", email: "mina@email.com", statut: "VALIDE" },
                ].map((o) => (
                  <div key={o.email} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{o.nom}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{o.email}</p>
                    </div>
                    <span className="badge badge-active">Validé</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/admin/organisateurs")} className="btn-ghost btn-sm btn-full mt-3">Gérer les organisateurs</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
