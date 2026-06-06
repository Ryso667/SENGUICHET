import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenements, adminDetailEvenement, adminAccepterEvenement, adminRefuserEvenement, adminSuspendreEvenement } from "../../services/eventService";
import { Check, X, Ticket } from "../../components/Icons";
import { normalizeImageUrl } from "../../utils/normalizeUrl";

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
      setModal(ev);
    }
  };

  const closeModal = () => {
    setModal(null);
    setModalTickets(null);
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
    <div className="min-h-screen bg-[#0D1B2A] flex">
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
                                style={{ background: pendingConfirm && confirmAction === "accepter" ? "rgba(0,229,160,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,160,0.3)", color: "var(--success)" }}>
                                {pendingConfirm && confirmAction === "accepter" ? <><Check size={16} /> Confirmer</> : "Accepter"}
                              </button>
                              <button onClick={() => { if (pendingConfirm && confirmAction === "refuser") handleAction(e.id, "refuser"); else { setConfirmId(e.id); setConfirmAction("refuser"); } }}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                style={{ background: pendingConfirm && confirmAction === "refuser" ? "rgba(255,77,109,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,77,109,0.3)", color: "var(--error)" }}>
                                {pendingConfirm && confirmAction === "refuser" ? <><Check size={16} /> Confirmer</> : "Refuser"}
                              </button>
                            </>
                          )}
                          {e.statut === "actif" && (
                            <button onClick={() => { if (pendingConfirm && confirmAction === "suspendre") handleAction(e.id, "suspendre"); else { setConfirmId(e.id); setConfirmAction("suspendre"); } }}
                              className="px-3 py-1.5 rounded-lg text-xs transition-all"
                              style={{ background: pendingConfirm && confirmAction === "suspendre" ? "rgba(255,77,109,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,77,109,0.3)", color: "var(--error)" }}>
                              {pendingConfirm && confirmAction === "suspendre" ? <><Check size={16} /> Confirmer</> : "Suspendre"}
                            </button>
                          )}
                          {e.statut === "suspendu" && (
                            <button onClick={() => { if (pendingConfirm && confirmAction === "reactiver") handleAction(e.id, "reactiver"); else { setConfirmId(e.id); setConfirmAction("reactiver"); } }}
                              className="px-3 py-1.5 rounded-lg text-xs transition-all"
                              style={{ background: pendingConfirm && confirmAction === "reactiver" ? "rgba(0,229,160,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,160,0.3)", color: "var(--success)" }}>
                              {pendingConfirm && confirmAction === "reactiver" ? <><Check size={16} /> Confirmer</> : "Réactiver"}
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

      {/* Modal détail événement (même style que le modal demande) */}
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
            <button onClick={closeModal} style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "none", border: "none", color: "var(--text-secondary)",
              fontSize: "1.25rem", cursor: "pointer",
            }}><X size={18} /></button>

            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
              {modal.nom}
            </h2>
            <span className={`badge ${(statutConfig[modal.statut] || statutConfig.annule).cls}`} style={{ display: "inline-block", marginBottom: "1.5rem" }}>
              {(statutConfig[modal.statut] || statutConfig.annule).label}
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <InfoRow label="Organisateur" value={modal.organisateur} />
              <InfoRow label="Email" value={modal.email} />
              {modal.telephone && <InfoRow label="Téléphone" value={modal.telephone} />}
              <InfoRow label="Catégorie" value={v(modal.categorie)} />
              <InfoRow label="Lieu" value={v(modal.lieu)} />
              <InfoRow label="Ville" value={v(modal.ville)} />
              <InfoRow label="Date début" value={modal.date} />
              <InfoRow label="Capacité" value={modal.capacite != null ? `${modal.capacite} places` : "—"} />
            </div>

            {/* Description */}
            {modal.description && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.5 }}>{modal.description}</p>
              </div>
            )}

            {/* Catégories de tickets sous forme de tableau (comme le modal demande) */}
            {modalTickets && modalTickets.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}><Ticket size={14} /> Catégories de tickets ({modalTickets.length})</p>
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
                      {modalTickets.map((t) => (
                        <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "0.5rem 0.75rem", color: "#F1F5F9" }}>{t.nom}</td>
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>
                            {t.places_disponibles}/{t.capacite}
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>
                            {parseInt(t.prix).toLocaleString()} F
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Affiche */}
            {modal.affiche_url && !modal.affiche_url.startsWith("blob:") && (
              <div style={{ marginBottom: "1rem" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Affiche</p>
                <img src={normalizeImageUrl(modal.affiche_url)} alt="Affiche événement"
                  style={{ width: "100%", maxHeight: 250, objectFit: "contain", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}
                />
              </div>
            )}

            {/* Commentaire admin */}
            {modal.commentaire_admin && (
              <div style={{
                padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem",
                background: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule"
                  ? "rgba(255,77,109,0.08)" : "rgba(0,229,160,0.08)",
                border: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule"
                  ? "1px solid rgba(255,77,109,0.2)" : "1px solid rgba(0,229,160,0.2)",
              }}>
                <p className="text-xs font-medium mb-1" style={{
                  color: modal.statut === "refuse" || modal.statut === "suspendu" || modal.statut === "annule"
                    ? "var(--error)" : "var(--success)"
                }}>
                  Commentaire
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{modal.commentaire_admin}</p>
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
