import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { icon: "🏠", label: "Vue d'ensemble", path: "/dashboard" },
  { icon: "📅", label: "Mes événements", path: "/dashboard/evenements" },
  { icon: "➕", label: "Créer un événement", path: "/dashboard/evenements/creer" },
  { icon: "🎟", label: "Gestion billets", path: "/dashboard/evenements/1/billets" },
  { icon: "🧑‍🤝‍🧑", label: "Mon équipe", path: "/dashboard/evenements/1/equipe" },
  { icon: "📊", label: "Statistiques", path: "/dashboard/statistiques" },
  { icon: "⚙️", label: "Paramètres", path: "/dashboard/parametres" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/connexion"); };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] fixed h-full z-20" style={{ background: "#060710", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate("/dashboard")} className="text-xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SenGuichet</button>
      </div>

      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#FB923C] flex items-center justify-center text-white font-bold text-sm">
          {user?.nom?.charAt(0)?.toUpperCase() || "O"}
        </div>
        <div>
          <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Organisateur"}</p>
          <span className={`badge ${user?.statut === "VALIDE" ? "badge-active" : "badge-pending"}`}>
            {user?.statut === "VALIDE" ? "Actif" : "En attente"}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: active ? "rgba(99,102,241,0.10)" : "transparent",
                color: active ? "#F1F5F9" : "rgba(255,255,255,0.45)",
                borderLeft: active ? "3px solid #6366F1" : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={handleLogout} className="btn-danger btn-full btn-sm">Déconnexion</button>
      </div>
    </aside>
  );
};

export default Sidebar;
