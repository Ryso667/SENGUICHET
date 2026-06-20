import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LayoutDashboard, Users, Calendar, FileText, Star, ShieldCheck, Settings, LogOut, ArrowRight } from "lucide-react";

const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard", shortcut: "G D" },
  { icon: Users, label: "Organisateurs", path: "/admin/organisateurs", shortcut: "G O" },
  { icon: Calendar, label: "Événements", path: "/admin/evenements", shortcut: "G E" },
  { icon: FileText, label: "Demandes", path: "/admin/demandes", shortcut: "G D" },
  { icon: Star, label: "Partenaires", path: "/admin/partenaires", shortcut: "G P" },
  { icon: Settings, label: "Gest. Partenaires", path: "/admin/partenaires/gestion", shortcut: "G G" },
  { icon: ShieldCheck, label: "Contrôleurs", path: "/admin/controleurs", shortcut: "G C" },
];

const quickActions = [
  { icon: ArrowRight, label: "Aller au site", path: "/", shortcut: "G H" },
  { icon: LogOut, label: "Déconnexion", path: "/connexion", action: "logout" },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminRoute) return;
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdminRoute]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allItems = [...adminItems, ...quickActions];
  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback(
    (item) => {
      setOpen(false);
      if (item.action === "logout") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate(item.path);
      } else {
        navigate(item.path);
      }
    },
    [navigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && filtered[selectedIdx]) {
      handleSelect(filtered[selectedIdx]);
    }
  };

  if (!isAdminRoute) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-2xl border overflow-hidden shadow-2xl w-full mx-4"
            style={{ maxWidth: 540, background: "#FFFFFF", borderColor: "#E8EEF4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E8EEF4" }}>
              <Search size={18} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher une page…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIdx(0);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "#1a1a1a", border: "none", boxShadow: "none" }}
              />
              <kbd
                className="px-2 py-1 rounded text-[11px] font-medium border hidden sm:inline"
                style={{ background: "#F1F5F9", color: "#64748B", borderColor: "#E2E8F0" }}
              >
                ESC
              </kbd>
            </div>
            <div className="p-2 max-h-[320px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    Aucun résultat pour « {query} »
                  </p>
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path + item.label}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: idx === selectedIdx || isActive ? "#F0F4F8" : "transparent",
                        color: "#1a1a1a",
                      }}
                      onMouseEnter={() => setSelectedIdx(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={16}
                          style={{
                            color: idx === selectedIdx || isActive ? "#1a1a1a" : "#94A3B8",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <kbd
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: "#F1F5F9", color: "#94a3b8" }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
