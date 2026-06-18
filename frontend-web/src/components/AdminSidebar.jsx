import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { adminListerEvenements } from "../services/eventService";
import { adminListerDemandes } from "../services/eventService";
import {
  LayoutDashboard, Users, Calendar, FileText, Star, LogOut, ShieldCheck, Settings,
  Menu, X,
} from "lucide-react";
import NotificationsBell from "./NotificationsBell";

/* Navigation structurée en sections */
const sectionsNav = [
  {
    label: "PRINCIPAL",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
      { icon: Users, label: "Organisateurs", path: "/admin/organisateurs" },
      { icon: Calendar, label: "Événements", path: "/admin/evenements" },
    ],
  },
  {
    label: "GESTION",
    items: [
      { icon: FileText, label: "Demandes", path: "/admin/demandes" },
      { icon: Star, label: "Partenaires", path: "/admin/partenaires" },
      { icon: Settings, label: "Gest. partenaires", path: "/admin/partenaires/gestion" },
    ],
  },
  {
    label: "SÉCURITÉ",
    items: [
      { icon: ShieldCheck, label: "Contrôleurs", path: "/admin/controleurs" },
    ],
  },
];

/* ─── Bouton de navigation ─── */
const NavButton = ({ item, badge, location, navigate, closeDrawer }) => {
  const actif = location.pathname === item.path;
  const Icon = item.icon;
  return (
    <button
      onClick={() => { navigate(item.path); closeDrawer?.(); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm relative"
      style={{
        background: actif ? "#F0F4F8" : "transparent",
        color: actif ? "#1a1a1a" : "#64748B",
        borderLeft: actif ? "2px solid #1a1a1a" : "2px solid transparent",
        borderRadius: "0 8px 8px 0",
        fontWeight: actif ? "600" : "400",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!actif) { e.currentTarget.style.background = "#F5F7FA"; e.currentTarget.style.color = "#1a1a1a"; }
      }}
      onMouseLeave={(e) => {
        if (!actif) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }
      }}
    >
      <Icon size={18} style={{ color: actif ? "#1a1a1a" : "#94A3B8", flexShrink: 0 }} />
      <span className="flex-1 truncate">{item.label}</span>
      {badge > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none flex-shrink-0"
          style={{ background: "#EF4444", color: "#FFFFFF" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
};

/* ─── Sidebar ─── */
const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badges, setBadges] = useState({});

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [events, demandes] = await Promise.all([
          adminListerEvenements(),
          adminListerDemandes(),
        ]);
        setBadges({
          "/admin/evenements": events.filter((e) => e.statut === "en_attente").length,
          "/admin/demandes": demandes.filter((d) => d.statut === "soumis" || d.statut === "en_analyse").length,
        });
      } catch {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const contenuSidebar = (fermer) => (
    <>
      {/* Logo SENGUICHET */}
      <div className="py-6 px-6 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "#E8EEF4" }}>
        <img src="/images/logo-400.png" alt="SENGUICHET" className="h-32 w-auto" />
        <NotificationsBell />
      </div>

      {/* Avatar fixe */}
      <div className="p-4 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: "#E8EEF4" }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1a1a1a, #333333)", color: "#FFFFFF" }}
        >
          AS
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>Admin SENGUICHET</p>
        </div>
      </div>

      {/* Navigation par sections */}
      <nav className="flex-1 p-3 overflow-y-auto admin-scrollbar">
        {sectionsNav.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase px-4 mb-2" style={{ color: "#94a3b8" }}>
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavButton key={item.path} item={item} badge={badges[item.path] || 0} location={location} navigate={navigate} closeDrawer={fermer} />
            ))}
          </div>
        ))}
      </nav>

      {/* Déconnexion discrète */}
      <div className="p-3 pt-2 flex-shrink-0" style={{ borderTop: "1px solid #E8EEF4" }}>
        <button
          onClick={() => { logout(); navigate("/connexion"); fermer?.(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-xl"
          style={{ color: "#94a3b8" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "#F5F7FA"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={16} /> Déconnexion
        </button>
        <div className="flex items-center justify-center mt-3 admin-shortcuts-hint">
          Appuyez sur <kbd>?</kbd> pour les raccourcis
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger (mobile) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border transition-all"
        style={{ background: "#FFFFFF", borderColor: "#E8EEF4", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Menu size={18} style={{ color: "#1a1a1a" }} />
      </button>

      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col w-[260px] fixed h-full z-20"
        style={{ background: "#FFFFFF", borderRight: "1px solid #E8EEF4", boxShadow: "2px 0 12px rgba(0,0,0,0.06)" }}
      >
        {contenuSidebar()}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col h-full w-[280px]"
              style={{ background: "#FFFFFF", boxShadow: "4px 0 24px rgba(0,0,0,0.12)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between py-4 px-5 border-b flex-shrink-0" style={{ borderColor: "#E8EEF4" }}>
                <span className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Menu</span>
                <div className="flex items-center gap-2">
                  <NotificationsBell />
                  <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg" style={{ color: "#64748B" }}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              {contenuSidebar(() => setDrawerOpen(false))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
