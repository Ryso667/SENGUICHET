import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return () => {};
  return ctx;
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: { bg: "#ECFDF5", border: "#A7F3D0", icon: "#10B981", text: "#065F46" },
  error: { bg: "#FEF2F2", border: "#FECACA", icon: "#EF4444", text: "#991B1B" },
  info: { bg: "#EFF6FF", border: "#BFDBFE", icon: "#3B82F6", text: "#1E40AF" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", icon: "#F59E0B", text: "#92400E" },
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000, action = null) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 380 }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const c = colors[toast.type] || colors.info;
            const Icon = icons[toast.type] || icons.info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border"
                style={{ background: c.bg, borderColor: c.border, minWidth: 300, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
              >
                <Icon size={18} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm flex-1" style={{ color: c.text }}>{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => { toast.action.onClick(); removeToast(toast.id); }}
                    className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                    style={{ background: c.icon + "20", color: c.icon, border: "none", cursor: "pointer" }}
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-0.5 rounded transition-opacity hover:opacity-70"
                  style={{ color: c.icon, background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
