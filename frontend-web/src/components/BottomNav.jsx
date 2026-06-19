// Fichier : BottomNav.jsx
// Rôle : Barre de navigation inférieure fixe pour mobile (Accueil, Recherche, Billets, Compte)

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconHome, IconSearch, IconTicket, IconUser } from "@tabler/icons-react";

const tabs = [
  { label: "Accueil", icon: IconHome, to: "/" },
  { label: "Recherche", icon: IconSearch, to: "/evenements" },
  { label: "Billets", icon: IconTicket, to: "/connexion" },
  { label: "Compte", icon: IconUser, to: "/connexion" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/5 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[64px] min-h-[44px] ${
                isActive ? "text-[#15803D]" : "text-[#9CA3AF]"
              }`}
            >
              <tab.icon size={20} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
