import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutGrid, Calendar, BarChart, FileText, Ticket, LogOut } from "../components/Icons";
import logo from "../assets/logo.jpg";

const navItems = [
  { icon: <LayoutGrid size={18} />, label: "Tableau de bord", path: "/dashboard" },
  { icon: <Calendar size={18} />, label: "Mes événements", path: "/dashboard/evenements" },
  { icon: <BarChart size={18} />, label: "Mes statistiques", path: "/dashboard/statistiques" },
  { icon: <FileText size={18} />, label: "Mes demandes", path: "/dashboard/demandes", badge: true },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/connexion"); };

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
          <p className="text-sm font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Organisateur"}</p>
          <span className={`badge ${user?.statut === "VALIDE" ? "badge-active" : "badge-pending"}`}>
            {user?.statut === "VALIDE" ? <>Actif</> : <>Attente</>}
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
                background: active ? "rgba(0,200,255,0.10)" : "transparent",
                color: active ? "#F1F5F9" : "rgba(255,255,255,0.45)",
                borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--error)", boxShadow: "0 0 6px rgba(255,77,109,0.6)" }} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "rgba(0, 200, 255, 0.12)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "rgba(255,255,255,0.45)",
            background: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.1)"; e.currentTarget.style.color = "var(--error)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>

        <div className="mt-3 text-center">
          <a
            href="https://sendigitalpulse.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#374151",
              fontSize: "11px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#6B7280"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#374151"; }}
          >
            Propulsé par SDP — Sen Digital Pulse
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
