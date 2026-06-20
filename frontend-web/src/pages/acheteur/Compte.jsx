import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Ticket, Mail, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Compte() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || localStorage.getItem("@senguichet_acheteur_email") || "Non connecté";
  const profil = JSON.parse(localStorage.getItem("@senguichet_profil") || "{}");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: "#F0F4F8" }}>
        <div className="text-center">
          <User size={48} className="mx-auto mb-3" style={{ color: "#94a3b8" }} />
          <p style={{ color: "#64748B" }}>Vous n'êtes pas connecté</p>
          <button onClick={() => navigate("/connexion-acheteur")}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#15803D", border: "none", cursor: "pointer" }}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: "#F0F4F8" }}>
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,128,61,0.1)" }}>
            <User size={36} style={{ color: "#15803D" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Mon compte</h1>
        </div>

        <div className="rounded-2xl border p-4 mb-4" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
          <div className="flex items-center gap-3">
            <Mail size={18} style={{ color: "#15803D" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Email</p>
              <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{email}</p>
            </div>
          </div>
        </div>

        <button onClick={() => navigate("/acheteur/mes-billets")}
          className="w-full rounded-2xl border p-4 flex items-center gap-3 mb-4 hover:shadow-md transition-all"
          style={{ background: "#FFFFFF", borderColor: "#E8EEF4", cursor: "pointer" }}>
          <Ticket size={18} style={{ color: "#15803D" }} />
          <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>Mes billets</span>
        </button>

        <button onClick={handleLogout}
          className="w-full rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-all"
          style={{ background: "#FFFFFF", borderColor: "#E8EEF4", cursor: "pointer" }}>
          <LogOut size={18} style={{ color: "#EF4444" }} />
          <span className="text-sm font-medium" style={{ color: "#EF4444" }}>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
