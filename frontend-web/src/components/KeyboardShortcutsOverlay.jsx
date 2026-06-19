import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, ChevronDown, ArrowUpDown, Trash2, Printer } from "lucide-react";

const shortcuts = [
  { key: "⌘K", desc: "Ouvrir la palette de commandes" },
  { key: "?", desc: "Afficher ce menu" },
  { key: "Esc", desc: "Fermer les modales / menus" },
  { key: "⌘P", desc: "Imprimer la page (dashboard)" },
  { key: "S", desc: "Activer le filtre de recherche" },
  { key: "↑↓", desc: "Naviguer dans les tableaux" },
  { key: "↵", desc: "Valider / Confirmer" },
];

const icons = [Search, Check, ChevronDown, ArrowUpDown, Trash2, Printer];

const KeyboardShortcutsOverlay = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9997] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-2xl border shadow-xl p-6 w-full max-w-md"
            style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Raccourcis clavier</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg" style={{ color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s, i) => {
                const Icon = icons[i] || null;
                return (
                  <div
                    key={s.key}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ background: i % 2 === 0 ? "#F8FAFC" : "transparent" }}
                  >
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
                      {Icon && <Icon size={14} style={{ color: "#94a3b8" }} />}
                      {s.desc}
                    </span>
                    <kbd
                      className="text-xs font-semibold px-2 py-1 rounded-md"
                      style={{ background: "#F1F5F9", color: "#1a1a1a", border: "1px solid #E8EEF4", fontFamily: "inherit" }}
                    >
                      {s.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-6 text-center" style={{ color: "#94a3b8" }}>
              Appuyez sur <kbd style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, border: "1px solid #E8EEF4", fontFamily: "inherit" }}>?</kbd> pour fermer
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsOverlay;
