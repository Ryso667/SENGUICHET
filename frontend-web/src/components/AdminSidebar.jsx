import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutGrid, Users, Calendar, FileText, Star, Ticket, LogOut, Shield, Settings } from "../components/Icons";
import logo from "../assets/logo.jpg";

const adminNavItems = [
  { icon: <LayoutGrid size={18} />, label: "Dashboard", path: "/admin/dashboard" },
  { icon: <Users size={18} />, label: "Organisateurs", path: "/admin/organisateurs" },
  { icon: <Calendar size={18} />, label: "Événements", path: "/admin/evenements" },
  { icon: <FileText size={18} />, label: "Demandes", path: "/admin/demandes" },
  { icon: <Star size={18} />, label: "Partenaires", path: "/admin/partenaires" },
  { icon: <Settings size={18} />, label: "Gest. partenaires", path: "/admin/partenaires/gestion" },
  { icon: <Shield size={18} />, label: "Contrôleurs", path: "/admin/controleurs" },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] fixed h-full z-20" style={{ background: "#0D1B2A", borderRight: "1px solid rgba(0, 200, 255, 0.15)" }}>
      <div className="py-8 px-6 border-b flex justify-center" style={{ borderColor: "rgba(0, 200, 255, 0.12)" }}>
        <img src={logo} alt="SENGUICHET" style={{ height: 72, width: "auto" }} />
      </div>

      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(0, 200, 255, 0.12)" }}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C8FF] to-[#0077FF] flex items-center justify-center text-white font-bold text-sm">
          {user?.nom?.charAt(0)?.toUpperCase() || <Ticket size={14} />}
        </div>
        <div>
          <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Admin"}</p>
          <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(0, 200, 255, 0.15)", color: "#00C8FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Admin</span>
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
                background: active ? "rgba(0,119,255,0.1)" : "transparent",
                color: active ? "var(--accent)" : "rgba(255,255,255,0.5)",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
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
          style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--error)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
