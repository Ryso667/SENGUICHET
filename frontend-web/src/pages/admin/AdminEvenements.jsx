import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenements, adminDetailEvenement, adminAccepterEvenement, adminRefuserEvenement, adminSuspendreEvenement } from "../../services/eventService";

const statutConfig = {
  en_attente: { cls: "badge-pending", label: "En attente" },
  actif: { cls: "badge-active", label: "Actif" },
  refuse: { cls: "badge-sold-out", label: "Refusé" },
  suspendu: { cls: "badge-sold-out", label: "Suspendu" },
  annule: { cls: "badge-sold-out", label: "Annulé" },
};

const AdminEvenements = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalTickets, setModalTickets] = useState(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [showRefuseInput, setShowRefuseInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminListerEvenements();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement events admin:", err);
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
    setShowRefuseInput(false);
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
      });
      setModalTickets(res.tickets);
    } catch (err) {
      console.error("Erreur chargement détail:", err);
      setModal(ev);
    }
  };

  const closeModal = () => {
    setModal(null);
    setModalTickets(null);
    setShowRefuseInput(false);
    setRefuseComment("");
  };

  const handleAction = async (id, action) => {
    setActionLoading(true);
    try {
      if (action === "accepter") {
        await adminAccepterEvenement(id);
        updateStatut(id, "actif");
        if (modal) closeModal();
      } else if (action === "refuser") {
        await adminRefuserEvenement(id, refuseComment);
        updateStatut(id, "refuse");
        closeModal();
      } else if (action === "suspendre") {
        await adminSuspendreEvenement(id);
        updateStatut(id, "suspendu");
      } else if (action === "reactiver") {
        await adminSuspendreEvenement(id);
        updateStatut(id, "actif");
      }
      setConfirmId(null);
      setConfirmAction(null);
    } catch (err) {
      console.error("Erreur action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const v = (val) => val != null && val !== "" ? val : "—";

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Événements</h1>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Événement", "Organisateur", "Date", "Lieu", "Statut", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const cfg = statutConfig[e.statut] || statutConfig.annule;
                    const pendingConfirm = confirmId === e.id;

                    return (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 150ms" }}
                      onMouseEnter={(el) => el.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{e.nom}</p>
                      </td>
                      <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{e.organisateur}</td>
                      <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{e.date}</td>
                      <td className="px-5 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{e.lieu}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => openModal(e)} className="px-3 py-1.5 rounded-lg text-xs transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                            Voir
                          </button>
                          {e.statut === "en_attente" && (
                            <>
                              <button onClick={() => { if (pendingConfirm && confirmAction === "accepter") handleAction(e.id, "accepter"); else { setConfirmId(e.id); setConfirmAction("accepter"); } }}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                style={{ background: pendingConfirm && confirmAction === "accepter" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}>
                                {pendingConfirm && confirmAction === "accepter" ? "✓ Confirmer" : "Accepter"}
                              </button>
                              <button onClick={() => { if (pendingConfirm && confirmAction === "refuser") handleAction(e.id, "refuser"); else { setConfirmId(e.id); setConfirmAction("refuser"); } }}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                style={{ background: pendingConfirm && confirmAction === "refuser" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                                {pendingConfirm && confirmAction === "refuser" ? "✓ Confirmer" : "Refuser"}
                              </button>
                            </>
                          )}
                          {e.statut === "actif" && (
                            <button onClick={() => { if (pendingConfirm && confirmAction === "suspendre") handleAction(e.id, "suspendre"); else { setConfirmId(e.id); setConfirmAction("suspendre"); } }}
                              className="px-3 py-1.5 rounded-lg text-xs transition-all"
                              style={{ background: pendingConfirm && confirmAction === "suspendre" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                              {pendingConfirm && confirmAction === "suspendre" ? "✓ Confirmer" : "Suspendre"}
                            </button>
                          )}
                          {e.statut === "suspendu" && (
                            <button onClick={() => { if (pendingConfirm && confirmAction === "reactiver") handleAction(e.id, "reactiver"); else { setConfirmId(e.id); setConfirmAction("reactiver"); } }}
                              className="px-3 py-1.5 rounded-lg text-xs transition-all"
                              style={{ background: pendingConfirm && confirmAction === "reactiver" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}>
                              {pendingConfirm && confirmAction === "reactiver" ? "✓ Confirmer" : "Réactiver"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal détail événement */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          padding: "1rem",
        }}>
          <div className="glass-card" style={{
            maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto",
            padding: "2rem", position: "relative",
          }}>
            <button onClick={closeModal} style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "none", border: "none", color: "var(--text-secondary)",
              fontSize: "1.25rem", cursor: "pointer",
            }}>✕</button>

            {/* Titre + statut */}
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
              {modal.nom}
            </h2>
            <span className={`badge ${(statutConfig[modal.statut] || statutConfig.annule).cls}`} style={{ display: "inline-block", marginBottom: "1.5rem" }}>
              {(statutConfig[modal.statut] || statutConfig.annule).label}
            </span>

            {/* Infos générales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <InfoRow label="Organisateur" value={modal.organisateur} />
              <InfoRow label="Email" value={modal.email} />
              <InfoRow label="Catégorie" value={v(modal.categorie)} />
              <InfoRow label="Lieu" value={v(modal.lieu)} />
              <InfoRow label="Ville" value={v(modal.ville)} />
              <InfoRow label="Date" value={modal.date} />
              <InfoRow label="Capacité" value={modal.capacite != null ? `${modal.capacite} places` : "—"} />
              {modal.statut === "refuse" && modal.commentaire_admin && (
                <InfoRow label="Commentaire refus" value={modal.commentaire_admin} style={{ gridColumn: "1 / -1", color: "#EF4444" }} />
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: "1rem" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                {modal.description || "Aucune description."}
              </p>
            </div>

            {/* Types de billets */}
            {modalTickets && modalTickets.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Types de billets ({modalTickets.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {modalTickets.map((t) => (
                    <div key={t.id} style={{
                      padding: "0.75rem 1rem", borderRadius: "8px",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{t.nom}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {t.description || "—"}
                        </p>
                      </div>
                      <div className="text-right" style={{ flexShrink: 0, marginLeft: "1rem" }}>
                        <p style={{ color: "#22C55E", fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {parseInt(t.prix).toLocaleString()} FCFA
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {t.places_disponibles}/{t.capacite} dispo.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commentaire de refus déjà affiché */}
            {modal.statut === "refuse" && modal.commentaire_admin && (
              <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#EF4444" }}>Commentaire de refus</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{modal.commentaire_admin}</p>
              </div>
            )}

            {/* Actions acceptation / refus */}
            {modal.statut === "en_attente" && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                {showRefuseInput ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <textarea placeholder="Raison du refus (obligatoire)" value={refuseComment}
                      onChange={(e) => setRefuseComment(e.target.value)} rows={3}
                      style={{
                        width: "100%", padding: "0.75rem", borderRadius: "8px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#F1F5F9", fontSize: "0.875rem",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button onClick={() => setShowRefuseInput(false)} className="px-4 py-2 rounded-lg text-sm"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                        Annuler
                      </button>
                      <button onClick={() => handleAction(modal.id, "refuser")} disabled={!refuseComment.trim() || actionLoading}
                        className="px-4 py-2 rounded-lg text-sm"
                        style={{
                          background: !refuseComment.trim() ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444",
                          cursor: !refuseComment.trim() ? "not-allowed" : "pointer",
                        }}>
                        {actionLoading ? "Refus..." : "Confirmer le refus"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button onClick={() => setShowRefuseInput(true)} className="px-4 py-2 rounded-lg text-sm"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                      Refuser
                    </button>
                    <button onClick={() => handleAction(modal.id, "accepter")} disabled={actionLoading}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}>
                      {actionLoading ? "Accepter..." : "Accepter"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, style }) => (
  <div style={style}>
    <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{value}</p>
  </div>
);

export default AdminEvenements;
