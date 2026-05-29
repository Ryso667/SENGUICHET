import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminNavItems = [
  { icon: "🏠", label: "Dashboard", path: "/admin/dashboard" },
  { icon: "👥", label: "Organisateurs", path: "/admin/organisateurs" },
  { icon: "📅", label: "Événements", path: "/admin/evenements" },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
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
        {adminNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: active ? "rgba(251,146,60,0.1)" : "transparent",
                color: active ? "#FB923C" : "rgba(255,255,255,0.5)",
                borderLeft: active ? "3px solid #FB923C" : "3px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={() => { logout(); navigate("/connexion"); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
