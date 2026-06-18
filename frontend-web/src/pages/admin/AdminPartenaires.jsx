import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import { listerDemandes, traiterDemande, statsDemandes } from "../../services/partnerService";
import { X, Check, Loader2, ChevronDown, ExternalLink, MessageSquare } from "lucide-react";

const STATUT_COLORS = {
  EN_ATTENTE: { bg: "rgba(21,128,61,0.1)", text: "#15803D" },
  EN_COURS: { bg: "rgba(21,128,61,0.1)", text: "#15803D" },
  ACCEPTEE: { bg: "rgba(21,128,61,0.1)", text: "#15803D" },
  REFUSEE: { bg: "rgba(21,128,61,0.1)", text: "#15803D" },
};

const STATUT_LABELS = { EN_ATTENTE: "En attente", EN_COURS: "En cours", ACCEPTEE: "Acceptée", REFUSEE: "Refusée" };
const TYPE_LABELS = { concert: "Concert", soiree: "Soirée / Club", conference: "Conférence / Séminaire", sport: "Sport / Compétition", festival: "Festival", theatre: "Théâtre / Culturel", entreprise: "Événement d'entreprise", autre: "Autre" };

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } }),
};

const AdminPartenaires = () => {
  const [demandes, setDemandes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [noteAdmin, setNoteAdmin] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([listerDemandes(filter || undefined), statsDemandes()]);
      setDemandes(d); setStats(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleTraiter = async (statut) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await traiterDemande(selected.id, { statut, note_admin: noteAdmin || undefined });
      setModalAction(null); setSelected(null); setNoteAdmin("");
      fetchData();
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Demandes de partenariat</h1>
              <p className="text-xs mt-0.5 capitalize" style={{ color: "#94a3b8" }}>{today}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-28">
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", value: stats.total, color: "#15803D" },
                { label: "En attente", value: stats.en_attente, color: "#15803D" },
                { label: "En cours", value: stats.en_cours, color: "#15803D" },
                { label: "Acceptées", value: stats.acceptees, color: "#15803D" },
              ].map((s, i) => (
                <motion.div key={s.label} custom={i} variants={fadeUp} initial="initial" animate="animate"
                  whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                  className="rounded-2xl p-4 border cursor-default"
                  style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                  <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{s.label}</p>
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {["", "EN_ATTENTE", "EN_COURS", "ACCEPTEE", "REFUSEE"].map((s) => (
              <motion.button key={s} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setFilter(s)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: filter === s ? "#15803D" : "transparent",
                  color: filter === s ? "#fff" : "#64748B",
                  border: filter === s ? "none" : "1px solid #E8EEF4",
                }}>
                {s ? STATUT_LABELS[s] : "Toutes"}
              </motion.button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: "#94a3b8" }} />
            </div>
          ) : demandes.length === 0 ? (
            <div className="admin-empty-state" style={{ borderRadius: "16px", background: "#FFFFFF", border: "1px solid #E8EEF4" }}>
              <h3>Aucune demande</h3>
              <p>Aucune demande de partenariat pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {demandes.map((d, i) => (
                  <motion.div key={d.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                    layout whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                    className="rounded-2xl p-5 transition-all cursor-pointer border"
                    style={{ background: "#FFFFFF", borderColor: selected?.id === d.id ? "#15803D" : "#E8EEF4", borderWidth: selected?.id === d.id ? "2px" : "1px" }}
                    onClick={() => setSelected(selected?.id === d.id ? null : d)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{d.organisation}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                            style={{ background: STATUT_COLORS[d.statut]?.bg, color: STATUT_COLORS[d.statut]?.text }}>
                            {STATUT_LABELS[d.statut]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "#64748B" }}>
                          <span>{d.nom}</span><span>{d.email}</span><span>{d.telephone}</span><span>{d.date}</span>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: selected?.id === d.id ? 180 : 0 }}>
                        <ChevronDown size={16} style={{ color: "#94a3b8" }} />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {selected?.id === d.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          className="overflow-hidden">
                          <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: "#E8EEF4" }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Type d'événement</p>
                                <p className="font-medium" style={{ color: "#1a1a1a" }}>{TYPE_LABELS[d.type_evenement] || d.type_evenement}</p>
                              </div>
                              <div>
                                <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Fréquence</p>
                                <p className="font-medium" style={{ color: "#1a1a1a" }}>{d.nb_evenements || "Non spécifié"}</p>
                              </div>
                              {d.site_web && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Site web</p>
                                  <p className="font-medium"><a href={d.site_web} target="_blank" rel="noopener noreferrer" style={{ color: "#15803D" }}>{d.site_web} <ExternalLink size={12} /></a></p>
                                </div>
                              )}
                              <div className="sm:col-span-2">
                                <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Description</p>
                                <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{d.description}</p>
                              </div>
                              {d.note_admin && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs mb-0.5" style={{ color: "#64748B" }}>Note interne</p>
                                  <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(21,128,61,0.04)", border: "1px solid rgba(21,128,61,0.1)" }}>
                                    <p style={{ color: "#1a1a1a" }}>{d.note_admin}</p>
                                    {d.traite_par && <p className="text-xs mt-1" style={{ color: "#64748B" }}>— {d.traite_par}</p>}
                                  </div>
                                </div>
                              )}
                            </div>
                            {d.statut !== "ACCEPTEE" && d.statut !== "REFUSEE" && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {d.statut === "EN_ATTENTE" && (
                                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={(e) => { e.stopPropagation(); setModalAction("EN_COURS"); setNoteAdmin(""); }}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                    style={{ background: "rgba(21,128,61,0.1)", color: "#15803D", border: "1px solid rgba(21,128,61,0.3)" }}>
                                    Prendre en charge
                                  </motion.button>
                                )}
                                {d.statut === "EN_COURS" && (
                                  <>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                      onClick={(e) => { e.stopPropagation(); setModalAction("ACCEPTEE"); }}
                                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                      style={{ background: "rgba(21,128,61,0.1)", color: "#15803D", border: "1px solid rgba(21,128,61,0.3)" }}>
                                      <Check size={14} /> Accepter
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                      onClick={(e) => { e.stopPropagation(); setModalAction("REFUSEE"); }}
                                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                      style={{ background: "rgba(21,128,61,0.1)", color: "#15803D", border: "1px solid rgba(21,128,61,0.3)" }}>
                                      <X size={14} /> Refuser
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            )}
                            {d.statut === "ACCEPTEE" && (
                              <div className="flex items-center gap-2 text-xs" style={{ color: "#15803D" }}>
                                <Check size={14} /> Traitée le {d.date_traitement ? new Date(d.date_traitement).toLocaleDateString("fr-FR") : "—"}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <AnimatePresence>
          {modalAction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
              onClick={() => { if (!updating) setModalAction(null); }}>
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-4 border shadow-xl"
                style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
                onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
                  {modalAction === "EN_COURS" ? "Prendre en charge" : modalAction === "ACCEPTEE" ? "Accepter la demande" : "Refuser la demande"}
                </h3>
                <p className="text-sm" style={{ color: "#64748B" }}>{selected?.organisation} — {selected?.nom}</p>
                {modalAction !== "EN_COURS" && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>
                      Note {modalAction === "REFUSEE" ? "(obligatoire)" : "(optionnelle)"}
                    </label>
                    <textarea value={noteAdmin} onChange={(e) => setNoteAdmin(e.target.value)}
                      rows={3} placeholder="Écrivez un message personnalisé..."
                      className="w-full px-4 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a", resize: "vertical", minHeight: "80px" }} />
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setModalAction(null)} disabled={updating}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ border: "1px solid #E8EEF4", color: "#64748B" }}>
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleTraiter(modalAction)}
                    disabled={updating || (modalAction === "REFUSEE" && !noteAdmin.trim())}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ background: updating || (modalAction === "REFUSEE" && !noteAdmin.trim()) ? "#94a3b8" : "#15803D", cursor: updating || (modalAction === "REFUSEE" && !noteAdmin.trim()) ? "not-allowed" : "pointer" }}>
                    {updating ? "Traitement..." : "Confirmer"}
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

export default AdminPartenaires;
