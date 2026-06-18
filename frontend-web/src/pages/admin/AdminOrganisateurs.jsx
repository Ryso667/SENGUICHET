import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur } from "../../services/authService";
import { Lock, X, Check, Loader2, Users, ChevronUp, ChevronDown, Search, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const badgeMap = {
  VALIDE: { cls: "badge-active", label: "Actif" },
  EN_ATTENTE: { cls: "badge-pending", label: "En attente" },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

const AdminOrganisateurs = () => {
  const [orgas, setOrgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const [filterStatut, setFilterStatut] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const addToast = useToast();

  const sorted = useMemo(() => {
    if (!sortKey) return orgas;
    return [...orgas].sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [orgas, sortKey, sortDir]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (filterStatut !== "all") list = list.filter((o) => o.statut === filterStatut);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) => (o.nom || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q));
    }
    return list;
  }, [sorted, filterStatut, searchQuery]);

  const toggleSort = (key) => {
    if (sortKey === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortKey(key); setSortDir("asc"); }
  };

  useEffect(() => {
    const fetchOrgas = async () => {
      try {
        const data = await adminListerOrganisateurs();
        setOrgas(data);
      } catch (err) {
        console.error("Erreur chargement organisateurs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgas();
  }, []);

  const handleReset = async () => {
    if (!resetModal || newPassword.length < 6) return;
    setResetting(true);
    try {
      await reinitialiserMotDePasseOrganisateur(resetModal.id, newPassword);
      setSuccessMsg(`Mot de passe réinitialisé pour ${resetModal.nom}`);
      addToast(`Mot de passe réinitialisé pour ${resetModal.nom} ✅`, "success");
      setResetModal(null);
      setNewPassword("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Erreur reset:", err);
      addToast("Erreur lors de la réinitialisation", "error");
    } finally {
      setResetting(false);
    }
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const exportCSV = () => {
    const headers = ["Nom", "Email", "Téléphone", "Date inscription", "Événements", "Statut"];
    const rows = orgas.map(o => [o.nom, o.email, o.telephone, o.date, o.nb_evenements, badgeMap[o.statut]?.label || o.statut]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "organisateurs.csv";
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Pages / Organisateurs</p>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Organisateurs</h1>
            </div>
            <div className="flex items-center gap-3">
              {orgas.length > 0 && (
                <button onClick={exportCSV} className="admin-export-btn"
                  style={{ background: "#FFFFFF", border: "1px solid #E8EEF4", color: "#64748B" }}>
                  Exporter CSV
                </button>
              )}
              <p className="text-xs capitalize" style={{ color: "#94a3b8" }}>{today}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8">

        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.2)" }}>
              <Check size={18} style={{ color: "#15803D", flexShrink: 0 }} />
              <span style={{ color: "#15803D", fontSize: "14px" }}>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="rounded-2xl overflow-hidden border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
            <div className="p-5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 py-3" style={{ borderBottom: i < 5 ? "1px solid #F1F5F9" : "none" }}>
                  <div className="flex-1">
                    <div className="admin-skeleton mb-1.5" style={{ height: 12, width: "50%" }} />
                    <div className="admin-skeleton" style={{ height: 10, width: "40%" }} />
                  </div>
                  <div className="admin-skeleton" style={{ height: 10, width: 60 }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* ─── Filtres ─── */}
            <div className="admin-filter-bar">
              {["all","VALIDE","EN_ATTENTE"].map((f) => (
                <button key={f} onClick={() => setFilterStatut(f)}
                  className="admin-filter-btn"
                  style={{
                    background: filterStatut === f ? "#15803D" : "#FFFFFF",
                    color: filterStatut === f ? "#FFFFFF" : "#64748B",
                    borderColor: filterStatut === f ? "#15803D" : "#E8EEF4",
                  }}
                >
                  {f === "all" ? "Tous" : f === "VALIDE" ? "Actifs" : "En attente"}
                </button>
              ))}
              <div className="relative ml-auto" style={{ maxWidth: 220 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..." className="admin-filter-search w-full" />
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E8EEF4", background: "#F8FAFC" }}>
                    <th className="px-4 py-3.5 w-10">
                      <input type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set());
                          else setSelected(new Set(filtered.map((o) => o.id)));
                        }}
                        style={{ accentColor: "#15803D", cursor: "pointer" }} />
                    </th>
                    {["nom", "email", "telephone", "date", "nb_evenements", "statut", null].map((key, idx) => {
                      const labels = ["Nom", "Email", "Téléphone", "Date inscription", "Événements", "Statut", "Actions"];
                      const isActive = sortKey === key;
                      return (
                        <th key={idx}
                          onClick={key ? () => toggleSort(key) : undefined}
                          className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider select-none"
                          style={{
                            color: isActive ? "#15803D" : "#64748B",
                            cursor: key ? "pointer" : "default",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={key ? (e) => { if (!isActive) e.currentTarget.style.color = "#15803D"; } : undefined}
                          onMouseLeave={key ? (e) => { if (!isActive) e.currentTarget.style.color = "#64748B"; } : undefined}
                        >
                          <span className="flex items-center gap-1">
                            {labels[idx]}
                            {key && isActive && (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((o, i) => {
                      const b = badgeMap[o.statut] || badgeMap.VALIDE;
                      return (
                        <motion.tr key={o.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                          whileHover={{ background: "#F8FAFC" }}
                          style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}>
                          <td className="px-4 py-3.5">
                            <input type="checkbox" checked={selected.has(o.id)}
                              onChange={() => {
                                const next = new Set(selected);
                                if (next.has(o.id)) next.delete(o.id);
                                else next.add(o.id);
                                setSelected(next);
                              }}
                              style={{ accentColor: "#15803D", cursor: "pointer" }} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="font-medium cursor-pointer relative"
                              style={{ color: "#1a1a1a" }}
                              onMouseEnter={(ev) => {
                                const rect = ev.currentTarget.getBoundingClientRect();
                                setPreview({ nom: o.nom, email: o.email, telephone: o.telephone, date: o.date, nb: o.nb_evenements, x: rect.right + 12, y: rect.top - 10 });
                              }}
                              onMouseLeave={() => setPreview(null)}
                            >
                              {o.nom}
                            </span>
                          </td>
                          <td className="px-4 py-3.5" style={{ color: "#64748B" }}>{o.email}</td>
                          <td className="px-4 py-3.5" style={{ color: "#64748B" }}>{o.telephone}</td>
                          <td className="px-4 py-3.5" style={{ color: "#64748B" }}>{o.date}</td>
                          <td className="px-4 py-3.5" style={{ color: "#64748B" }}>{o.nb_evenements}</td>
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-1.5 font-semibold text-xs"
                              style={{ background: "rgba(21,128,61,0.1)", color: "#15803D", borderRadius: "20px", padding: "4px 12px", display: "inline-flex" }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#15803D", boxShadow: "0 0 6px rgba(21,128,61,0.6)" }} />
                              {b.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => { setResetModal(o); setNewPassword(""); }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                              style={{ border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}
                              onMouseEnter={(el) => { el.currentTarget.style.background = "rgba(21,128,61,0.06)"; }}
                              onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}>
                              <Lock size={14} /> Réinitialiser
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="admin-empty-state">
                  <Users size={48} />
                  <h3>{searchQuery || filterStatut !== "all" ? "Aucun résultat" : "Aucun organisateur"}</h3>
                  <p>{searchQuery || filterStatut !== "all" ? "Essayez de modifier vos filtres." : "Les organisateurs inscrits via la plateforme apparaîtront ici."}</p>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        )}

        {/* ─── Sélection bulk ─── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              className="admin-selection-bar">
              <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                {selected.size} organisateur{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <button onClick={async () => {
                addToast(`${selected.size} organisateur(s) supprimé(s) de la sélection`, "info");
                setSelected(new Set());
              }}
                style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}>
                <Trash2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Effacer
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ background: "#F1F5F9", color: "#64748B" }}>
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Hover preview ─── */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="admin-hover-preview"
              style={{ left: preview.x, top: preview.y }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: "#1a1a1a" }}>{preview.nom}</p>
              <p style={{ color: "#64748B" }}>{preview.email}</p>
              <p style={{ color: "#94a3b8" }}>{preview.telephone} · {preview.nb} événement(s)</p>
            </motion.div>
          )}
        </AnimatePresence>

        </main>

        <AnimatePresence>
          {resetModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
              onClick={() => { if (!resetting) setResetModal(null); }}>
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                    <Lock size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "#15803D" }} />
                    Réinitialiser le mot de passe
                  </h2>
                  <motion.button whileHover={{ rotate: 90 }} onClick={() => { if (!resetting) setResetModal(null); }}
                    className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}>
                    <X size={18} />
                  </motion.button>
                </div>
                <p className="text-sm mb-4" style={{ color: "#64748B" }}>
                  Nouveau mot de passe pour <strong style={{ color: "#1a1a1a" }}>{resetModal.nom}</strong> — {resetModal.email}
                </p>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  className="w-full mb-6 px-4 py-3 rounded-xl text-sm border" autoFocus
                  style={{ borderColor: "#E8EEF4", color: "#1a1a1a", background: "#F8FAFC" }} />
                <div className="flex gap-3">
                  <button onClick={() => setResetModal(null)} disabled={resetting}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ border: "1px solid #E8EEF4", color: "#64748B", opacity: resetting ? 0.5 : 1, cursor: resetting ? "not-allowed" : "pointer" }}>
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleReset} disabled={resetting || newPassword.length < 6}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ background: (resetting || newPassword.length < 6) ? "#94a3b8" : "#15803D", cursor: (resetting || newPassword.length < 6) ? "not-allowed" : "pointer" }}>
                    {resetting ? "Réinitialisation..." : "Confirmer"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminOrganisateurs;
