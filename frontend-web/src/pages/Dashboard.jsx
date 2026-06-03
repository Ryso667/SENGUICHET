import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { icon: "🏠", label: "Dashboard", key: "dashboard" },
  { icon: "📅", label: "Mes événements", key: "events" },
  { icon: "➕", label: "Créer un événement", key: "create" },
  { icon: "🎫", label: "Mes billets", key: "tickets" },
  { icon: "⚙️", label: "Paramètres", key: "settings" },
];

const statsItems = [
  { label: "Événements créés", value: "0", icon: "📅" },
  { label: "Billets vendus", value: "0", icon: "🎫" },
  { label: "Revenus totaux", value: "0 F", icon: "💰" },
  { label: "Vues profil", value: "0", icon: "👁️" },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const isPending = user?.statut === "EN_ATTENTE";

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <aside className="hidden lg:flex flex-col w-[260px] fixed h-full z-20" style={{ background: "#060710", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SenGuichet</p>
        </div>

        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#FB923C] flex items-center justify-center text-white font-bold text-sm">
            {user?.nom?.charAt(0)?.toUpperCase() || "O"}
          </div>
          <div>
            <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Organisateur"}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(99,102,241,0.2)", color: "#818CF8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Organisateur</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: activeNav === item.key ? "rgba(99,102,241,0.1)" : "transparent",
                color: activeNav === item.key ? "#818CF8" : "rgba(255,255,255,0.5)",
                borderLeft: activeNav === item.key ? "3px solid #6366F1" : "3px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[260px] flex flex-col">
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                Bonjour, {user?.nom || "Organisateur"} 👋
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>{today}</p>
            </div>
            <button onClick={handleLogout} className="lg:hidden px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6">
          {isPending && (
            <div className="p-4 rounded-xl text-sm flex items-start gap-3 mb-6" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span>⏳</span>
              <div>
                <p className="font-medium">Votre compte est en attente de validation par l'administrateur.</p>
                <p className="mt-1" style={{ color: "rgba(245,158,11,0.7)" }}>Vous pourrez créer des événements une fois votre compte validé.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsItems.map((stat) => (
              <div key={stat.label} className="glass-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-lg sm:text-2xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>{stat.value}</span>
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>Mes événements récents</h2>
            </div>

            <div className="text-center py-10">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-base font-medium text-white mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>Aucun événement</p>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Vous n'avez pas encore créé d'événement.
              </p>
              <button
                disabled={isPending}
                className="btn-primary btn-md"
                style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? "not-allowed" : "pointer", width: "auto", paddingLeft: 28, paddingRight: 28 }}
                title={isPending ? "Validation du compte requise" : ""}
              >
                Créer mon premier événement
              </button>
            </div>
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-2 py-2" style={{ background: "rgba(6,7,16,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-around">
            {navItems.slice(0, 4).map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-all"
                style={{
                  color: activeNav === item.key ? "#818CF8" : "rgba(255,255,255,0.4)",
                  background: activeNav === item.key ? "rgba(99,102,241,0.1)" : "transparent",
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

export default Dashboard;
