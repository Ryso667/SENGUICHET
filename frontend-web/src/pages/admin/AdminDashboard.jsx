import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminListerEvenements } from "../../services/eventService";

const adminNavItems = [
  { icon: "🏠", label: "Dashboard", key: "dashboard" },
  { icon: "👥", label: "Organisateurs", key: "organisateurs" },
  { icon: "📅", label: "Événements", key: "events" },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
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

  const handleLogout = () => { logout(); navigate("/connexion"); };
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <aside className="hidden lg:flex flex-col w-[260px] fixed h-full z-20" style={{ background: "#060710", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, background: "linear-gradient(135deg, #FB923C, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SenGuichet</p>
        </div>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FB923C] to-[#EF4444] flex items-center justify-center text-white font-bold text-sm">
            {user?.nom?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Admin"}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(239,68,68,0.2)", color: "#FB923C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNavItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key === "dashboard" ? "/admin/dashboard" : item.key === "organisateurs" ? "/admin/organisateurs" : "/admin/evenements")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: activeNav === item.key ? "rgba(251,146,60,0.1)" : "transparent",
                color: activeNav === item.key ? "#FB923C" : "rgba(255,255,255,0.5)",
                borderLeft: activeNav === item.key ? "3px solid #FB923C" : "3px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[260px] flex flex-col">
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Dashboard Admin 👋</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>{today}</p>
            </div>
            <button onClick={handleLogout} className="lg:hidden px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {adminStats.map((stat) => (
              <div key={stat.label} className="glass-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-lg sm:text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, background: "linear-gradient(135deg, #FB923C, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</span>
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
                  { nom: "Aminata Ba", email: "amina@email.com", statut: "VALIDE" },
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

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-2 py-2" style={{ background: "rgba(6,7,16,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-around">
            {adminNavItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.key === "dashboard" ? "/admin/dashboard" : item.key === "organisateurs" ? "/admin/organisateurs" : "/admin/evenements")}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-all"
                style={{
                  color: activeNav === item.key ? "#FB923C" : "rgba(255,255,255,0.4)",
                  background: activeNav === item.key ? "rgba(251,146,60,0.1)" : "transparent",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminDashboard;
