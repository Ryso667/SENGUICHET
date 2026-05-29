import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

const bottomNav = [
  { icon: "🏠", path: "/dashboard" },
  { icon: "📅", path: "/dashboard/evenements" },
  { icon: "➕", path: "/dashboard/evenements/creer" },
  { icon: "⚙️", path: "/dashboard/parametres" },
];

const DashboardLayout = ({ children, title = "Dashboard" }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <Sidebar />

      <div className="flex-1 lg:ml-[260px] flex flex-col">
        <header
          className="sticky top-0 z-10 px-4 sm:px-8 py-3 flex items-center justify-between"
          style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-white text-lg" onClick={() => navigate(-1)}>←</button>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>{title}</h1>
          </div>
          <button onClick={() => { logout(); navigate("/connexion"); }} className="lg:hidden px-3 py-1.5 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Déconnexion
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6">
          {children}
        </main>

        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-2 py-2"
          style={{ background: "rgba(6,7,16,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex justify-around">
            {bottomNav.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] transition-all"
                style={{
                  color: location.pathname === item.path ? "#818CF8" : "rgba(255,255,255,0.35)",
                  background: location.pathname === item.path ? "rgba(99,102,241,0.1)" : "transparent",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span className="text-lg">{item.icon}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
