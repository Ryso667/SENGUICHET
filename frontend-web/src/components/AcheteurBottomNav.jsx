import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Ticket, User } from "lucide-react";

const TABS = [
  { key: "accueil", label: "Accueil", icon: Home, path: "/acheteur/accueil" },
  { key: "explorer", label: "Explorer", icon: Search, path: "/acheteur/explorer" },
  { key: "mes-billets", label: "Mes billets", icon: Ticket, path: "/acheteur/mes-billets" },
  { key: "compte", label: "Compte", icon: User, path: "/acheteur/compte" },
];

export default function AcheteurBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center px-2 py-1"
      style={{ background: "#FFFFFF", borderColor: "#E8EEF4", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      {TABS.map(tab => {
        const active = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button key={tab.key} onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all"
            style={{ background: active ? "rgba(21,128,61,0.08)" : "transparent", border: "none", cursor: "pointer" }}>
            <Icon size={20} style={{ color: active ? "#15803D" : "#94a3b8" }} />
            <span className="text-[10px] font-medium" style={{ color: active ? "#15803D" : "#94a3b8" }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
