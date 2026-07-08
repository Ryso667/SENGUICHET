import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenements, adminDetailEvenement, adminAccepterEvenement, adminRefuserEvenement, adminSuspendreEvenement } from "../../services/eventService";
import { Check, X, Ticket, Loader2, Calendar, XCircle, ChevronUp, ChevronDown, Search, Trash2 } from "lucide-react";
import { normalizeImageUrl } from "../../utils/normalizeUrl";
import { useToast } from "../../context/ToastContext";

const statutConfig = {
  en_attente: { label: "En attente", color: "#f59e0b" },
  actif: { label: "Actif", color: "#15803D" },
  refuse: { label: "Refusé", color: "#15803D" },
  suspendu: { label: "Suspendu", color: "#64748B" },
  annule: { label: "Annulé", color: "#64748B" },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

const AdminEvenements = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalTickets, setModalTickets] = useState(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const [filterStatut, setFilterStatut] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const addToast = useToast();

  const sorted = useMemo(() => {
    if (!sortKey) return events;
    return [...events].sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [events, sortKey, sortDir]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (filterStatut !== "all") list = list.filter((e) => e.statut === filterStatut);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => (e.nom || "").toLowerCase().includes(q) || (e.organisateur || "").toLowerCase().includes(q) || (e.lieu || "").toLowerCase().includes(q));
    }
    return list;
  }, [sorted, filterStatut, searchQuery]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminListerEvenements();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement events admin:", err);
        addToast("Impossible de charger les événements.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const updateStatut = (id, newStatut) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, statut: newStatut } : e)));
  };

  const openModal = async (ev) => {
    setRefuseComment("");
    setModalTickets(null);
    setModal(null);
    try {
      const res = await adminDetailEvenement(ev.id);
      const e = res.evenement;
      setModal({
        id: e.id, nom: e.titre, description: e.description,
        organisateur: e.organisateur_nom, email: e.organisateur_email,
        telephone: e.organisateur_telephone,
        categorie: e.categorie, ville: e.ville, lieu: e.lieu,
        date: e.date_debut ? new Date(e.date_debut).toLocaleDateString("fr-FR") : "—",
        capacite: e.capacite_totale, statut: e.statut,
        commentaire_admin: e.commentaire_admin,
        affiche_url: e.affiche_url,
      });
      setModalTickets(res.tickets);
    } catch (err) {
      console.error("Erreur chargement détail:", err);
      addToast("Impossible de charger le détail de l'événement.", "error");
      setModal(ev);
    }
  };

  const closeModal = () => { setModal(null); setModalTickets(null); setRefuseComment(""); };

  const handleAction = async (id, action) => {
    setActionLoading(true);
    const ev = events.find((e) => e.id === id);
    try {
      if (action === "accepter") { await adminAccepterEvenement(id); updateStatut(id, "actif"); if (modal) closeModal(); addToast(`${ev?.nom || "Événement"} accepté ✅`, "success", 6000, { label: "Annuler", onClick: () => handleAction(id, "refuser") }); }
      else if (action === "refuser") { await adminRefuserEvenement(id, refuseComment); updateStatut(id, "refuse"); closeModal(); addToast(`${ev?.nom || "Événement"} refusé`, "error", 6000, { label: "Annuler", onClick: () => handleAction(id, "accepter") }); }
      else if (action === "suspendre") { await adminSuspendreEvenement(id); updateStatut(id, "suspendu"); addToast(`${ev?.nom || "Événement"} suspendu`, "warning", 6000, { label: "Annuler", onClick: () => handleAction(id, "reactiver") }); }
      else if (action === "reactiver") { await adminSuspendreEvenement(id); updateStatut(id, "actif"); addToast(`${ev?.nom || "Événement"} réactivé ✅`, "success", 6000, { label: "Annuler", onClick: () => handleAction(id, "suspendre") }); }
      setConfirmId(null); setConfirmAction(null);
    } catch (err) { console.error("Erreur action:", err); addToast("Erreur lors de l'action sur l'événement.", "error"); }
    finally { setActionLoading(false); }
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const exportCSV = () => {
    const headers = ["Nom", "Organisateur", "Date", "Lieu", "Statut"];
    const rows = events.map(e => [e.nom, e.organisateur, e.date, e.lieu, statutConfig[e.statut]?.label || e.statut]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "evenements.csv";
    a.click(); URL.revokeObjectURL(url);
  };

  const v = (val) => val != null && val !== "" ? val : "—";

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Pages / Événements</p>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Événements</h1>
            </div>
            <div className="flex items-center gap-3">
              {events.length > 0 && (
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

        {loading ? (
          <div className="rounded-2xl overflow-hidden border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
            <div className="p-5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 py-3" style={{ borderBottom: i < 5 ? "1px solid #F1F5F9" : "none" }}>
                  <div className="flex-1">
                    <div className="admin-skeleton mb-1.5" style={{ height: 12, width: "60%" }} />
                    <div className="admin-skeleton" style={{ height: 10, width: "30%" }} />
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
              {["all","en_attente","actif","refuse","suspendu"].map((f) => (
                <button key={f} onClick={() => setFilterStatut(f)}
                  className="admin-filter-btn"
                  style={{
                    background: filterStatut === f ? "#15803D" : "#FFFFFF",
                    color: filterStatut === f ? "#FFFFFF" : "#64748B",
                    borderColor: filterStatut === f ? "#15803D" : "#E8EEF4",
                  }}
                >
                  {f === "all" ? "Tous" : { en_attente: "En attente", actif: "Actif", refuse: "Refusé", suspendu: "Suspendu" }[f]}
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
                    <th className="px-5 py-4 w-10">
                      <input type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set());
                          else setSelected(new Set(filtered.map((e) => e.id)));
                        }}
                        style={{ accentColor: "#15803D", cursor: "pointer" }}
                      />
                    </th>
                    {["nom", "organisateur", "date", "lieu", "statut", null].map((key, idx) => {
                      const labels = ["Événement", "Organisateur", "Date", "Lieu", "Statut", "Actions"];
                      const isActive = sortKey === key;
                      return (
                        <th
                          key={idx}
                          onClick={key ? () => toggleSort(key) : undefined}
                          className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider select-none"
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
                            {key && isActive && (
                              sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((e, i) => {
                      const cfg = statutConfig[e.statut] || statutConfig.annule;
                      const pendingConfirm = confirmId === e.id;
                      return (
                        <motion.tr key={e.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                          whileHover={{ background: "#F8FAFC" }}
                          style={{ borderBottom: "1px solid #F1F5F9", transition: "background 150ms" }}>
                          <td className="px-5 py-4">
                            <input type="checkbox" checked={selected.has(e.id)}
                              onChange={() => {
                                const next = new Set(selected);
                                if (next.has(e.id)) next.delete(e.id);
                                else next.add(e.id);
                                setSelected(next);
                              }}
                              style={{ accentColor: "#15803D", cursor: "pointer" }} />
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="text-sm font-semibold cursor-pointer relative"
                              style={{ color: "#1a1a1a" }}
                              onMouseEnter={(ev) => {
                                const rect = ev.currentTarget.getBoundingClientRect();
                                setPreview({ nom: e.nom, organisateur: e.organisateur, email: e.email, lieu: e.lieu, date: e.date, x: rect.right + 12, y: rect.top - 10 });
                              }}
                              onMouseLeave={() => setPreview(null)}
                            >
                              {e.nom}
                            </span>
                          </td>
                          <td className="px-5 py-4" style={{ color: "#64748B" }}>{e.organisateur}</td>
                          <td className="px-5 py-4" style={{ color: "#64748B" }}>{e.date}</td>
                          <td className="px-5 py-4" style={{ color: "#64748B" }}>{e.lieu}</td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-xs font-semibold"
                              style={{ background: `${cfg.color}12`, color: cfg.color, borderRadius: "20px", padding: "4px 12px", display: "inline-flex" }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1.5">
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => openModal(e)}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                style={{ border: "1px solid #E8EEF4", color: "#64748B" }}>
                                Voir
                              </motion.button>
                              {e.statut === "en_attente" && (
                                <>
                                  <motion.button whileHover={{ scale: 1.03 }}
                                    onClick={() => { if (pendingConfirm && confirmAction === "accepter") handleAction(e.id, "accepter"); else { setConfirmId(e.id); setConfirmAction("accepter"); } }}
                                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                    style={{ background: pendingConfirm && confirmAction === "accepter" ? "rgba(21,128,61,0.1)" : "transparent", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                                    {pendingConfirm && confirmAction === "accepter" ? <><Check size={14} /> Confirmer</> : "Accepter"}
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.03 }}
                                    onClick={() => { if (pendingConfirm && confirmAction === "refuser") handleAction(e.id, "refuser"); else { setConfirmId(e.id); setConfirmAction("refuser"); } }}
                                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                    style={{ background: pendingConfirm && confirmAction === "refuser" ? "rgba(21,128,61,0.1)" : "transparent", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                                    {pendingConfirm && confirmAction === "refuser" ? <><Check size={14} /> Confirmer</> : "Refuser"}
                                  </motion.button>
                                </>
                              )}
                              {e.statut === "actif" && (
                                <motion.button whileHover={{ scale: 1.03 }}
                                  onClick={() => { if (pendingConfirm && confirmAction === "suspendre") handleAction(e.id, "suspendre"); else { setConfirmId(e.id); setConfirmAction("suspendre"); } }}
                                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                  style={{ background: pendingConfirm && confirmAction === "suspendre" ? "rgba(21,128,61,0.1)" : "transparent", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                                  {pendingConfirm && confirmAction === "suspendre" ? <><Check size={14} /> Confirmer</> : "Suspendre"}
                                </motion.button>
                              )}
                              {e.statut === "suspendu" && (
                                <motion.button whileHover={{ scale: 1.03 }}
                                  onClick={() => { if (pendingConfirm && confirmAction === "reactiver") handleAction(e.id, "reactiver"); else { setConfirmId(e.id); setConfirmAction("reactiver"); } }}
                                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                  style={{ background: pendingConfirm && confirmAction === "reactiver" ? "rgba(21,128,61,0.1)" : "transparent", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                                  {pendingConfirm && confirmAction === "reactiver" ? <><Check size={14} /> Confirmer</> : "Réactiver"}
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="admin-empty-state">
                  <Calendar size={48} />
                  <h3>{searchQuery || filterStatut !== "all" ? "Aucun résultat" : "Aucun événement"}</h3>
                  <p>{searchQuery || filterStatut !== "all" ? "Essayez de modifier vos filtres." : "Les événements créés par les organisateurs apparaîtront ici."}</p>
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
                {selected.size} événement{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <button onClick={() => {
                selected.forEach((id) => handleAction(id, "suspendre"));
                setSelected(new Set());
                addToast(`${selected.size} événement(s) suspendu(s)`, "warning", 5000, { label: "Annuler", onClick: () => { selected.forEach((id) => handleAction(id, "reactiver")); } });
              }}
                style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}>
                <Trash2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Suspendre
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
              <p style={{ color: "#64748B" }}>{preview.organisateur}</p>
              <p style={{ color: "#94a3b8" }}>{preview.lieu} · {preview.date}</p>
            </motion.div>
          )}
        </AnimatePresence>

        </main>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            onClick={closeModal}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="rounded-2xl border shadow-xl p-6 sm:p-8 relative" style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto", background: "#FFFFFF", borderColor: "#E8EEF4" }}
              onClick={(e) => e.stopPropagation()}>
              <motion.button whileHover={{ rotate: 90 }} onClick={closeModal} className="absolute top-4 right-4 p-1" style={{ color: "#94a3b8" }}>
                <X size={18} />
              </motion.button>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#1a1a1a" }}>{modal.nom}</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold mb-6"
                style={{ background: `${(statutConfig[modal.statut] || statutConfig.annule).color}12`, color: (statutConfig[modal.statut] || statutConfig.annule).color, borderRadius: "20px", padding: "4px 12px", display: "inline-flex" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: (statutConfig[modal.statut] || statutConfig.annule).color, boxShadow: `0 0 6px ${(statutConfig[modal.statut] || statutConfig.annule).color}60` }} />
                {(statutConfig[modal.statut] || statutConfig.annule).label}
              </span>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoRow label="Organisateur" value={modal.organisateur} />
                <InfoRow label="Email" value={modal.email} />
                {modal.telephone && <InfoRow label="Téléphone" value={modal.telephone} />}
                <InfoRow label="Catégorie" value={v(modal.categorie)} />
                <InfoRow label="Lieu" value={v(modal.lieu)} />
                <InfoRow label="Ville" value={v(modal.ville)} />
                <InfoRow label="Date début" value={modal.date} />
                <InfoRow label="Capacité" value={modal.capacite != null ? `${modal.capacite} places` : "—"} />
              </div>
              {modal.description && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>Description</p>
                  <p style={{ color: "#475569", fontSize: "0.875rem", lineHeight: 1.5 }}>{modal.description}</p>
                </div>
              )}
              {modalTickets && modalTickets.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: "#64748B" }}><Ticket size={14} /> Catégories de tickets ({modalTickets.length})</p>
                  <div className="overflow-hidden rounded-lg border" style={{ borderColor: "#E8EEF4" }}>
                    <table className="w-full" style={{ fontSize: "0.8rem", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: "#F8FAFC" }}>
                        <th className="p-2 text-left font-medium" style={{ color: "#64748B" }}>Nom</th>
                        <th className="p-2 text-right font-medium" style={{ color: "#64748B" }}>Places</th>
                        <th className="p-2 text-right font-medium" style={{ color: "#64748B" }}>Prix</th>
                      </tr></thead>
                      <tbody>{modalTickets.map((t) => (
                        <tr key={t.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td className="p-2" style={{ color: "#1a1a1a" }}>{t.nom}</td>
                          <td className="p-2 text-right" style={{ color: "#64748B" }}>{t.places_disponibles}/{t.capacite}</td>
                          <td className="p-2 text-right" style={{ color: "#64748B" }}>{parseInt(t.prix).toLocaleString()} F</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {modal.affiche_url && !modal.affiche_url.startsWith("blob:") && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: "#64748B" }}>Affiche</p>
                  <img src={normalizeImageUrl(modal.affiche_url)} alt="Affiche événement"
                    className="w-full rounded-lg" style={{ maxHeight: 250, objectFit: "contain", background: "#F8FAFC" }} />
                </div>
              )}
              {modal.commentaire_admin && (
                <div className="p-3 rounded-lg mb-4"
                  style={{ background: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule" ? "rgba(21,128,61,0.06)" : "rgba(21,128,61,0.06)", border: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule" ? "1px solid rgba(21,128,61,0.2)" : "1px solid rgba(21,128,61,0.2)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule" ? "#15803D" : "#15803D" }}>
                    Commentaire
                  </p>
                  <p style={{ color: "#475569", fontSize: "0.85rem" }}>{modal.commentaire_admin}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium" style={{ color: "#64748B" }}>{label}</p>
    <p className="text-sm" style={{ color: "#334155" }}>{value}</p>
  </div>
);

export default AdminEvenements;
