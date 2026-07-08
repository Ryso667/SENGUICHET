import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerDemandes, adminDetailDemande, adminTraiterDemande, adminCreerEvenementDepuisDemande } from "../../services/eventService";
import { FileText, X, Check, Loader2, Calendar, XCircle, Inbox } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { normalizeImageUrl } from "../../utils/normalizeUrl";

const statutConfig = {
  soumis: { label: "Soumis", color: "#f59e0b" },
  en_analyse: { label: "Analyse", color: "#15803D" },
  approuve: { label: "Approuvé", color: "#15803D" },
  refuse: { label: "Refusé", color: "#15803D" },
};

const TYPE_LABELS = { CREATION: "Création", MODIFICATION: "Modification", SUPPRESSION: "Suppression" };
const TYPE_CLASSES = { CREATION: { color: "#15803D" }, MODIFICATION: { color: "#15803D" }, SUPPRESSION: { color: "#15803D" } };

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } }),
};

const AdminGestionDemandes = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const addToast = useToast();

  useEffect(() => { fetchDemandes(); }, [filterStatut, filterType]);

  const fetchDemandes = async () => {
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterType) params.type = filterType;
      const data = await adminListerDemandes(params);
      setDemandes(data);
    } catch (err) { console.error("Erreur chargement demandes:", err); addToast("Impossible de charger les demandes.", "error"); }
    finally { setLoading(false); }
  };

  const openModal = async (d) => {
    setCommentaire(""); setActionLoading(false);
    try { const detail = await adminDetailDemande(d.id); setModal(detail); }
    catch (err) { setModal(d); }
  };

  const handleTraiter = async (action) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await adminTraiterDemande(modal.id, action, commentaire);
      setModal((prev) => ({ ...prev, statut: action, commentaire_admin: commentaire }));
      fetchDemandes();
    } catch (err) { console.error("Erreur traitement:", err); addToast("Erreur lors du traitement de la demande.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleCreateEvent = async () => {
    if (!modal) return;
    setCreatingEvent(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      await adminCreerEvenementDepuisDemande(modal.id, controller.signal);
      clearTimeout(timeout);
      setEventCreated(true);
      setModal((prev) => ({ ...prev, evenement_id: "créé" }));
      addToast("Événement créé avec succès ! ✅", "success");
      fetchDemandes();
      setTimeout(() => setModal(null), 1500);
    } catch (err) {
      const msg = err.name === "AbortError"
        ? "La requête a expiré. Vérifie que le backend est accessible."
        : err.message || "Erreur lors de la création de l'événement";
      addToast(msg, "error");
      console.error("Erreur création événement:", err);
    } finally {
      setCreatingEvent(false);
    }
  };

  const filtered = demandes;
  const todayDemandes = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Pages / Demandes</p>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Demandes événements</h1>
            </div>
            <p className="text-xs capitalize" style={{ color: "#94a3b8" }}>{todayDemandes}</p>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border cursor-pointer"
              style={{ borderColor: "#E8EEF4", color: "#15803D", background: "#FFFFFF" }}>
              <option value="">Tous statuts</option>
              <option value="soumis">Soumis</option>
              <option value="en_analyse">En analyse</option>
              <option value="approuve">Approuvé</option>
              <option value="refuse">Refusé</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium border cursor-pointer"
              style={{ borderColor: "#E8EEF4", color: "#15803D", background: "#FFFFFF" }}>
              <option value="">Tous types</option>
              <option value="CREATION">Création</option>
              <option value="MODIFICATION">Modification</option>
              <option value="SUPPRESSION">Suppression</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl p-6 border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F8FAFC" }}>
                  <div className="flex-1">
                    <div className="admin-skeleton mb-1.5" style={{ height: 12, width: "40%" }} />
                    <div className="admin-skeleton" style={{ height: 10, width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-state" style={{ borderRadius: "16px", background: "#FFFFFF", border: "1px solid #E8EEF4" }}>
            <Inbox size={48} />
            <h3>Aucune demande</h3>
            <p>Aucune demande d'événement trouvée avec les filtres actuels.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((d, i) => {
                const cfg = statutConfig[d.statut] || statutConfig.soumis;
                const typeCls = TYPE_CLASSES[d.type_action] || TYPE_CLASSES.CREATION;
                return (
                  <motion.div key={d.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                    whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                    className="rounded-2xl p-5 cursor-pointer transition-all border"
                    style={{ background: "#FFFFFF", borderLeft: `3px solid ${typeCls.color}`, borderColor: "#E8EEF4" }}
                    onClick={() => openModal(d)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: typeCls.color }}>{TYPE_LABELS[d.type_action] || d.type_action}</span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold"
                            style={{ background: `${cfg.color}12`, color: cfg.color, borderRadius: "20px", padding: "2px 10px", display: "inline-flex" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{d.titre || "Sans titre"}</p>
                        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: "#64748B" }}>
                          <span>{d.organisateur_nom}</span>
                          <span>·</span>
                          <span>{new Date(d.date_soumission).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      {d.statut === "soumis" && (
                        <span className="w-2 h-2 rounded-full" style={{ background: "#15803D", boxShadow: "0 0 8px rgba(21,128,61,0.6)", animation: "pulse 2s infinite" }} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        </main>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="rounded-2xl border shadow-xl p-6 sm:p-8 relative"
              style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto", background: "#FFFFFF", borderColor: "#E8EEF4" }}
              onClick={(e) => e.stopPropagation()}>
              <motion.button whileHover={{ rotate: 90 }} onClick={() => setModal(null)} className="absolute top-4 right-4 p-1" style={{ color: "#94a3b8" }}>
                <X size={18} />
              </motion.button>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#1a1a1a" }}>{TYPE_LABELS[modal.type_action] || modal.type_action}</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold mb-6"
                style={{ background: `${(statutConfig[modal.statut] || statutConfig.soumis).color}12`, color: (statutConfig[modal.statut] || statutConfig.soumis).color, borderRadius: "20px", padding: "4px 12px", display: "inline-flex" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: (statutConfig[modal.statut] || statutConfig.soumis).color }} />
                {(statutConfig[modal.statut] || statutConfig.soumis).label}
              </span>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoRow label="Organisateur" value={modal.organisateur_nom} />
                <InfoRow label="Email" value={modal.organisateur_email} />
                {modal.organisateur_telephone && <InfoRow label="Téléphone" value={modal.organisateur_telephone} />}
                {modal.evenement_nom && <InfoRow label="Événement lié" value={modal.evenement_nom} />}
                <InfoRow label="Soumis le" value={new Date(modal.date_soumission).toLocaleDateString("fr-FR")} />
                {modal.date_traitement && <InfoRow label="Traité le" value={new Date(modal.date_traitement).toLocaleDateString("fr-FR")} />}
              </div>
              {modal.titre && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}><Calendar size={14} /> Titre / Événement</p>
                  <p style={{ color: "#475569", fontSize: "0.875rem" }}>{modal.titre}</p>
                </div>
              )}
              {modal.description && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>Description</p>
                  <p style={{ color: "#475569", fontSize: "0.875rem", lineHeight: 1.5 }}>{modal.description}</p>
                </div>
              )}
              {modal.lieu && (
                <div className="mb-4 flex gap-4">
                  <InfoRow label="Lieu" value={modal.lieu} />
                  <InfoRow label="Capacité" value={modal.capacite ? `${modal.capacite} places` : "—"} />
                </div>
              )}
              {modal.date_debut && <div className="mb-4"><InfoRow label="Date début" value={new Date(modal.date_debut).toLocaleDateString("fr-FR")} /></div>}

              {(() => {
                const payload = typeof modal.payload === "string" ? (() => { try { return JSON.parse(modal.payload); } catch { return null; } })() : modal.payload;
                if (!payload) return null;
                const cats = payload.categories_tickets || payload.categories || [];
                return (
                  <>
                    {cats.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium mb-2" style={{ color: "#64748B" }}>Catégories de tickets</p>
                        <div className="overflow-hidden rounded-lg border" style={{ borderColor: "#E8EEF4" }}>
                          <table className="w-full" style={{ fontSize: "0.8rem", borderCollapse: "collapse" }}>
                            <thead><tr style={{ background: "#F8FAFC" }}>
                              <th className="p-2 text-left font-medium" style={{ color: "#64748B" }}>Nom</th>
                              <th className="p-2 text-right font-medium" style={{ color: "#64748B" }}>Places</th>
                              <th className="p-2 text-right font-medium" style={{ color: "#64748B" }}>Prix</th>
                            </tr></thead>
                            <tbody>{cats.map((cat, i) => (
                              <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                                <td className="p-2" style={{ color: "#1a1a1a" }}>{cat.nom}</td>
                                <td className="p-2 text-right" style={{ color: "#64748B" }}>{cat.places}</td>
                                <td className="p-2 text-right" style={{ color: "#64748B" }}>{cat.prix?.toLocaleString()} F</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {modal.affiche_url && !modal.affiche_url.startsWith("blob:") && (
                      <div className="mb-4">
                        <p className="text-xs font-medium mb-2" style={{ color: "#64748B" }}>Affiche</p>
                        <img src={normalizeImageUrl(modal.affiche_url)} alt="Affiche" className="w-full rounded-lg" style={{ maxHeight: 250, objectFit: "contain", background: "#F8FAFC" }} />
                      </div>
                    )}
                  </>
                );
              })()}

              {modal.commentaire_admin && modal.statut !== "soumis" && modal.statut !== "en_analyse" && (
                <div className="p-3 rounded-lg mb-4"
                  style={{ background: modal.statut === "approuve" ? "rgba(21,128,61,0.06)" : "rgba(21,128,61,0.06)", border: modal.statut === "approuve" ? "1px solid rgba(21,128,61,0.2)" : "1px solid rgba(21,128,61,0.2)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#15803D" }}>
                    {modal.statut === "approuve" ? <><Check size={14} /> Commentaire</> : <><XCircle size={14} /> Motif du refus</>}
                  </p>
                  <p style={{ color: "#475569", fontSize: "0.85rem" }}>{modal.commentaire_admin}</p>
                </div>
              )}

              {(modal.statut === "soumis" || modal.statut === "en_analyse") && (
                <div style={{ borderTop: "1px solid #E8EEF4", paddingTop: "1rem" }}>
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Commentaire (optionnel)</label>
                    <textarea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Ajouter un message pour l'organisateur..."
                      className="w-full px-4 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a", resize: "vertical" }} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleTraiter("refuse")} disabled={actionLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D", cursor: actionLoading ? "not-allowed" : "pointer" }}>
                      {actionLoading ? "Traitement..." : <><XCircle size={16} /> Refuser</>}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleTraiter("approuve")} disabled={actionLoading}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D", cursor: actionLoading ? "not-allowed" : "pointer" }}>
                      {actionLoading ? "Traitement..." : <><Check size={16} /> Approuver</>}
                    </motion.button>
                  </div>
                </div>
              )}

              {modal.statut === "approuve" && modal.type_action === "CREATION" && !modal.evenement_id && !eventCreated && (
                <div style={{ borderTop: "1px solid #E8EEF4", paddingTop: "1rem", textAlign: "center" }}>
                  <p className="text-sm mb-4" style={{ color: "#64748B" }}>Demande approuvée. Prêt à créer l'événement ?</p>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleCreateEvent} disabled={creatingEvent}
                    className="px-6 py-3 rounded-lg text-sm font-semibold text-white"
                    style={{ background: creatingEvent ? "#94a3b8" : "#15803D", border: "none", cursor: creatingEvent ? "not-allowed" : "pointer" }}>
                    {creatingEvent ? "Création..." : <><Check size={16} /> Créer l'événement</>}
                  </motion.button>
                </div>
              )}

              {eventCreated && (
                <div style={{ borderTop: "1px solid #E8EEF4", paddingTop: "1rem", textAlign: "center" }}>
                  <p className="text-sm font-medium" style={{ color: "#15803D" }}><Check size={16} /> Événement créé avec succès !</p>
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
    <p className="text-sm" style={{ color: "#334155" }}>{value || "—"}</p>
  </div>
);

export default AdminGestionDemandes;
