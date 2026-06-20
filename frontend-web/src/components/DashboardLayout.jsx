import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import { LayoutGrid, Calendar, BarChart, FileText, LogOut } from "../components/Icons";

const bottomNav = [
  { icon: <LayoutGrid size={18} />, path: "/dashboard" },
  { icon: <Calendar size={18} />, path: "/dashboard/evenements" },
  { icon: <BarChart size={18} />, path: "/dashboard/statistiques" },
  { icon: <FileText size={18} />, path: "/dashboard/demandes" },
];

const DashboardLayout = ({ children, title = "Dashboard" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F4F8" }}>
      <Sidebar />

      <div className="flex-1 lg:ml-[260px] flex flex-col">
        <header
          className="sticky top-0 z-10 px-4 sm:px-8 py-3 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-lg" style={{color: "var(--color-text-primary)"}} onClick={() => navigate(-1)}>←</button>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>{title}</h1>
          </div>
          <button onClick={() => { logout(); navigate("/connexion"); }} className="lg:hidden px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", color: "var(--error)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6">
          {children}
        </main>

        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-2 pt-2 pb-1"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--color-border)" }}
        >
          <div className="flex justify-around">
            {bottomNav.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-all"
                style={{
                  color: location.pathname === item.path ? "var(--color-accent)" : "var(--color-text-muted)",
                  background: location.pathname === item.path ? "rgba(21,128,61,0.08)" : "transparent",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span className="text-lg">{item.icon}</span>
              </button>
            ))}
          </div>
          <div className="text-center">
            <a
              href="https://sendigitalpulse.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--color-text-muted)",
                fontSize: "9px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: "none",
              }}
            >
              Propulsé par SDP
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
