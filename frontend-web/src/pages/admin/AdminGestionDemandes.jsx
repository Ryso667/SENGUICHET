import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerDemandes, adminDetailDemande, adminTraiterDemande, adminCreerEvenementDepuisDemande } from "../../services/eventService";
import { FileText, Calendar, Edit, X, Check, XCircle, Ticket, Inbox, Loader, Sparkle } from "../../components/Icons";

const statutConfig = {
  soumis: { cls: "badge-pending", label: "Soumis" },
  en_analyse: { cls: "badge-pending", label: "Analyse" },
  approuve: { cls: "badge-active", label: "Approuvé" },
  refuse: { cls: "badge-cancelled", label: "Refusé" },
};

const TYPE_LABELS = {
  CREATION: "Création",
  MODIFICATION: "Modification",
  SUPPRESSION: "Suppression",
};

const TYPE_CLASSES = {
  CREATION: { color: "#00C8FF" },
  MODIFICATION: { color: "#FFB347" },
  SUPPRESSION: { color: "#FF4D6D" },
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

  useEffect(() => {
    fetchDemandes();
  }, [filterStatut, filterType]);

  const fetchDemandes = async () => {
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterType) params.type = filterType;
      const data = await adminListerDemandes(params);
      setDemandes(data);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (d) => {
    setCommentaire("");
    setActionLoading(false);
    try {
      const detail = await adminDetailDemande(d.id);
      setModal(detail);
    } catch (err) {
      setModal(d);
    }
  };

  const handleTraiter = async (action) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      await adminTraiterDemande(modal.id, action, commentaire);
      setModal((prev) => ({ ...prev, statut: action, commentaire_admin: commentaire }));
      fetchDemandes();
    } catch (err) {
      console.error("Erreur traitement:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!modal) return;
    setCreatingEvent(true);
    try {
      await adminCreerEvenementDepuisDemande(modal.id);
      setEventCreated(true);
      setModal((prev) => ({ ...prev, evenement_id: "créé" }));
      fetchDemandes();
    } catch (err) {
      console.error("Erreur création événement:", err);
    } finally {
      setCreatingEvent(false);
    }
  };

  const filtered = demandes;

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
            <FileText size={24} /> Demandes événements
          </h1>
          <div className="flex gap-2">
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
              className="input-premium text-xs" style={{ width: "auto", minWidth: "120px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <option value="">Tous statuts</option>
              <option value="soumis">Soumis</option>
              <option value="en_analyse">En analyse</option>
              <option value="approuve">Approuvé</option>
              <option value="refuse">Refusé</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="input-premium text-xs" style={{ width: "auto", minWidth: "120px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <option value="">Tous types</option>
              <option value="CREATION">Création</option>
              <option value="MODIFICATION">Modification</option>
              <option value="SUPPRESSION">Suppression</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}><Loader size={16} /> Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Inbox size={48} style={{ opacity: 0.3 }} />
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "white" }}>Aucune demande</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Aucune demande d'événement trouvée avec les filtres actuels.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d, i) => {
              const cfg = statutConfig[d.statut] || statutConfig.soumis;
              const typeCls = TYPE_CLASSES[d.type_action] || TYPE_CLASSES.CREATION;
              return (
                <div key={d.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all"
                  style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both`, borderLeft: `3px solid ${typeCls.color}` }}
                  onClick={() => openModal(d)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = ""}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: typeCls.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {TYPE_LABELS[d.type_action] || d.type_action}
                      </span>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {d.titre || "Sans titre"}
                    </p>
                    <div className="flex items-center gap-3 text-xs mt-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span>{d.organisateur_nom}</span>
                      <span>·</span>
                      <span>{new Date(d.date_soumission).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  {d.statut === "soumis" && (
                    <span className="w-2 h-2 rounded-full" style={{ background: "#FFB347", boxShadow: "0 0 8px rgba(255,179,71,0.6)" }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "1rem",
        }}>
          <div className="glass-card" style={{
            maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto",
            padding: "2rem", position: "relative",
          }}>
            <button onClick={() => setModal(null)} style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "none", border: "none", color: "var(--text-secondary)",
              fontSize: "1.25rem", cursor: "pointer",
            }}><X size={18} /></button>

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
              {TYPE_LABELS[modal.type_action] || modal.type_action}
            </h2>
            <span className={`badge ${(statutConfig[modal.statut] || statutConfig.soumis).cls}`} style={{ display: "inline-block", marginBottom: "1.5rem" }}>
              {(statutConfig[modal.statut] || statutConfig.soumis).label}
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <InfoRow label="Organisateur" value={modal.organisateur_nom} />
              <InfoRow label="Email" value={modal.organisateur_email} />
              {modal.organisateur_telephone && <InfoRow label="Téléphone" value={modal.organisateur_telephone} />}
              {modal.evenement_nom && <InfoRow label="Événement lié" value={modal.evenement_nom} />}
              <InfoRow label="Soumis le" value={new Date(modal.date_soumission).toLocaleDateString("fr-FR")} />
              {modal.date_traitement && <InfoRow label="Traité le" value={new Date(modal.date_traitement).toLocaleDateString("fr-FR")} />}
            </div>

            {modal.titre && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}><Calendar size={14} /> Titre / Événement</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>{modal.titre}</p>
              </div>
            )}

            {modal.description && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.5 }}>{modal.description}</p>
              </div>
            )}

            {modal.lieu && (
              <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
                <InfoRow label="Lieu" value={modal.lieu} />
                <InfoRow label="Capacité" value={modal.capacite ? `${modal.capacite} places` : "—"} />
              </div>
            )}

            {modal.date_debut && (
              <div style={{ marginBottom: "1rem" }}>
                <InfoRow label="Date début" value={new Date(modal.date_debut).toLocaleDateString("fr-FR")} />
              </div>
            )}

            {(() => {
              const payload = typeof modal.payload === "string" ? (() => { try { return JSON.parse(modal.payload); } catch { return null; } })() : modal.payload;
              if (!payload) return null;
              const cats = payload.categories_tickets || payload.categories || [];
              return (
                <>
                  {cats.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Catégories de tickets</p>
                      <div style={{ overflow: "hidden", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>Nom</th>
                              <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "var(--text-secondary)", fontWeight: 500 }}>Places</th>
                              <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "var(--text-secondary)", fontWeight: 500 }}>Prix</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cats.map((cat, i) => (
                              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "0.5rem 0.75rem", color: "#F1F5F9" }}>{cat.nom}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{cat.places}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>{cat.prix?.toLocaleString()} F</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {modal.affiche_url && !modal.affiche_url.startsWith("blob:") && (
                    <div style={{ marginBottom: "1rem" }}>
                      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Affiche</p>
                      <img src={modal.affiche_url} alt="Affiche événement"
                        style={{ width: "100%", maxHeight: 250, objectFit: "contain", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}
                      />
                    </div>
                  )}
                </>
              );
            })()}

            {modal.commentaire_admin && modal.statut !== "soumis" && modal.statut !== "en_analyse" && (
              <div style={{
                padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem",
                background: modal.statut === "approuve" ? "rgba(0,229,160,0.08)" : "rgba(255,77,109,0.08)",
                border: modal.statut === "approuve" ? "1px solid rgba(0,229,160,0.2)" : "1px solid rgba(255,77,109,0.2)",
              }}>
                <p className="text-xs font-medium mb-1" style={{ color: modal.statut === "approuve" ? "var(--success)" : "var(--error)" }}>
                  {modal.statut === "approuve" ? <><Check size={14} /> Commentaire</> : <><XCircle size={14} /> Motif du refus</>}
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{modal.commentaire_admin}</p>
              </div>
            )}

            {(modal.statut === "soumis" || modal.statut === "en_analyse") && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Ajouter un message pour l'organisateur..."
                    style={{
                      width: "100%", padding: "0.75rem", borderRadius: "8px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#F1F5F9", fontSize: "0.875rem",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button onClick={() => handleTraiter("refuse")} disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)",
                      color: "var(--error)", cursor: actionLoading ? "not-allowed" : "pointer",
                    }}>
                    {actionLoading ? <><Loader size={16} /> Traitement...</> : <><XCircle size={16} /> Refuser</>}
                  </button>
                  <button onClick={() => handleTraiter("approuve")} disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)",
                      color: "var(--success)", cursor: actionLoading ? "not-allowed" : "pointer",
                    }}>
                    {actionLoading ? <><Loader size={16} /> Traitement...</> : <><Check size={16} /> Approuver</>}
                  </button>
                </div>
              </div>
            )}

            {modal.statut === "approuve" && modal.type_action === "CREATION" && !modal.evenement_id && !eventCreated && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", textAlign: "center" }}>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Demande approuvée. Prêt à créer l'événement ?
                </p>
                <button onClick={handleCreateEvent} disabled={creatingEvent}
                  className="px-6 py-3 rounded-lg text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #00C8FF, #0077FF)",
                    color: "#fff", border: "none", cursor: creatingEvent ? "not-allowed" : "pointer",
                    opacity: creatingEvent ? 0.7 : 1,
                  }}>
                  {creatingEvent ? <><Loader size={16} /> Création...</> : <><Check size={16} /> Créer l'événement</>}
                </button>
              </div>
            )}

            {eventCreated && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", textAlign: "center" }}>
                <p className="text-sm" style={{ color: "var(--success)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <Check size={16} /> Événement créé avec succès !
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{value || "—"}</p>
  </div>
);

export default AdminGestionDemandes;
