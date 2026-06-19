import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Calendar, Users, FileText } from "lucide-react";

const NotificationsBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { adminListerEvenements } = await import("../services/eventService");
        const { adminListerDemandes } = await import("../services/eventService");
        const { adminListerOrganisateurs } = await import("../services/authService");
        const [events, demandes, orgs] = await Promise.all([
          adminListerEvenements(),
          adminListerDemandes(),
          adminListerOrganisateurs(),
        ]);
        const list = [];
        const attenteEvents = (events || []).filter((e) => e.statut === "en_attente");
        const soumisDemandes = (demandes || []).filter((d) => d.statut === "soumis" || d.statut === "en_analyse");
        const nouveauxOrgs = (orgs || []).filter((o) => {
          if (!o.date) return false;
          const days = (Date.now() - new Date(o.date).getTime()) / 86400000;
          return days < 2;
        });
        attenteEvents.slice(0, 3).forEach((e) => list.push({ icon: Calendar, text: `Événement en attente : ${e.nom}` }));
        soumisDemandes.slice(0, 3).forEach((d) => list.push({ icon: FileText, text: `Demande ${d.type_action || "soumis"} par ${d.organisateur_nom || d.organisateur_email}` }));
        nouveauxOrgs.slice(0, 2).forEach((o) => list.push({ icon: Users, text: `Nouvel organisateur : ${o.nom || o.email}` }));
        setNotifications(list);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        style={{ border: "1px solid #E8EEF4", background: open ? "#F8FAFC" : "#FFFFFF" }}
      >
        <Bell size={16} style={{ color: "#64748B" }} />
        {notifications.length > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#EF4444", color: "#FFFFFF" }}
          >
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-0 top-full mt-2 w-80 rounded-2xl border shadow-xl overflow-hidden"
            style={{ background: "#FFFFFF", borderColor: "#E8EEF4", zIndex: 9999 }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: "#E8EEF4" }}>
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: "#94a3b8" }}>
                Aucune notification
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 transition-all"
                      style={{ borderBottom: i < notifications.length - 1 ? "1px solid #F1F5F9" : "none" }}
                    >
                      <Icon size={16} style={{ color: "#64748B", flexShrink: 0, marginTop: 2 }} />
                      <p className="text-sm" style={{ color: "#475569" }}>{n.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsBell;
