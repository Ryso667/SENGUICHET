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
    <aside className="hidden lg:flex flex-col w-[260px] fixed h-full z-20" style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}>
      <div className="py-8 px-6 border-b flex justify-center" style={{ borderColor: "var(--color-border)" }}>
        <img src={logo} alt="SENGUICHET" style={{ height: 72, width: "auto" }} />
      </div>

      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--gradient)" }}>
          {user?.nom?.charAt(0)?.toUpperCase() || <Ticket size={14} />}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.nom || "Organisateur"}</p>
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
                background: active ? "rgba(21,128,61,0.08)" : "transparent",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
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

      <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "var(--color-text-muted)",
            background: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.08)"; e.currentTarget.style.color = "var(--error)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
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
              color: "var(--color-text-muted)",
              fontSize: "11px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            Propulsé par SDP — Sen Digital Pulse
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
