import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { listerDemandes, traiterDemande, statsDemandes } from "../../services/partnerService";
import { X, Check, XCircle } from "../../components/Icons";

const STATUT_COLORS = {
  EN_ATTENTE: { bg: "rgba(255,179,71,0.15)", text: "#FFB347" },
  EN_COURS: { bg: "rgba(0,200,255,0.15)", text: "#00C8FF" },
  ACCEPTEE: { bg: "rgba(0,229,160,0.15)", text: "#00E5A0" },
  REFUSEE: { bg: "rgba(255,77,109,0.15)", text: "#FF4D6D" },
};

const STATUT_LABELS = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

const TYPE_LABELS = {
  concert: "Concert",
  soiree: "Soirée / Club",
  conference: "Conférence / Séminaire",
  sport: "Sport / Compétition",
  festival: "Festival",
  theatre: "Théâtre / Culturel",
  entreprise: "Événement d'entreprise",
  autre: "Autre",
};

const AdminPartenaires = () => {
  const navigate = useNavigate();
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
      setDemandes(d);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const handleTraiter = async (statut) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await traiterDemande(selected.id, { statut, note_admin: noteAdmin || undefined });
      setModalAction(null);
      setSelected(null);
      setNoteAdmin("");
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Demandes de partenariat 🤝</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>{today}</p>
            </div>

          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-28">
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", value: stats.total, color: "var(--accent)" },
                { label: "En attente", value: stats.en_attente, color: "#FFB347" },
                { label: "En cours", value: stats.en_cours, color: "#00C8FF" },
                { label: "Acceptées", value: stats.acceptees, color: "#00E5A0" },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4">
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
                  <p className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["", "EN_ATTENTE", "EN_COURS", "ACCEPTEE", "REFUSEE"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: filter === s ? "linear-gradient(135deg, #00C8FF, #0077FF)" : "rgba(255,255,255,0.06)",
                  color: filter === s ? "#fff" : "rgba(255,255,255,0.6)",
                  border: filter === s ? "none" : "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {s ? STATUT_LABELS[s] : "Toutes"}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-2 border-transparent border-t-[#00C8FF] rounded-full animate-spin" />
            </div>
          ) : demandes.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Aucune demande de partenariat pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {demandes.map((d) => (
                <div
                  key={d.id}
                  className={`glass-card p-5 transition-all cursor-pointer ${selected?.id === d.id ? "ring-2" : ""}`}
                  style={{
                    borderColor: selected?.id === d.id ? "rgba(0,200,255,0.5)" : "rgba(255,255,255,0.06)",
                  }}
                  onClick={() => setSelected(selected?.id === d.id ? null : d)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {d.organisation}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                          style={{ background: STATUT_COLORS[d.statut]?.bg, color: STATUT_COLORS[d.statut]?.text }}>
                          {STATUT_LABELS[d.statut]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span>{d.nom}</span>
                        <span>{d.email}</span>
                        <span>{d.telephone}</span>
                        <span>{d.date}</span>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${selected?.id === d.id ? "rotate-180" : ""}`} style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* Détail expandé */}
                  {selected?.id === d.id && (
                    <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: "rgba(255,255,255,0.06)", animation: "fadeInUp 0.25s ease-out" }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>Type d'événement</p>
                          <p className="text-white font-medium">{TYPE_LABELS[d.type_evenement] || d.type_evenement}</p>
                        </div>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>Fréquence</p>
                          <p className="text-white font-medium">{d.nb_evenements || "Non spécifié"}</p>
                        </div>
                        {d.site_web && (
                          <div className="sm:col-span-2">
                            <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>Site web</p>
                            <p className="text-white font-medium"><a href={d.site_web} target="_blank" rel="noopener noreferrer" style={{ color: "#00C8FF" }}>{d.site_web}</a></p>
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>Description</p>
                          <p className="text-sm text-white leading-relaxed">{d.description}</p>
                        </div>
                        {d.note_admin && (
                          <div className="sm:col-span-2">
                            <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>Note interne</p>
                            <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.12)" }}>
                              <p className="text-white">{d.note_admin}</p>
                              {d.traite_par && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>— {d.traite_par}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {d.statut !== "ACCEPTEE" && d.statut !== "REFUSEE" && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {d.statut === "EN_ATTENTE" && (
                            <button onClick={(e) => { e.stopPropagation(); setModalAction("EN_COURS"); setNoteAdmin(""); }}
                              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{ background: "rgba(0,200,255,0.15)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.3)" }}>
                              Prendre en charge
                            </button>
                          )}
                          {d.statut === "EN_COURS" && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setModalAction("ACCEPTEE"); }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: "rgba(0,229,160,0.15)", color: "#00E5A0", border: "1px solid rgba(0,229,160,0.3)" }}>
                                ✔ Accepter
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setModalAction("REFUSEE"); }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: "rgba(255,77,109,0.15)", color: "#FF4D6D", border: "1px solid rgba(255,77,109,0.3)" }}>
                                <XCircle size={16} /> Refuser
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {d.statut === "ACCEPTEE" && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#00E5A0" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                          Traitée le {d.date_traitement ? new Date(d.date_traitement).toLocaleDateString("fr-FR") : "—"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal traitement */}
        {modalAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { if (!updating) setModalAction(null); }}>
            <div className="w-full max-w-md glass-card p-6 sm:p-8 space-y-4"
              onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                {modalAction === "EN_COURS" ? "Prendre en charge" : modalAction === "ACCEPTEE" ? "Accepter la demande" : "Refuser la demande"}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selected?.organisation} — {selected?.nom}
              </p>
              {modalAction !== "EN_COURS" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Note pour le demandeur {modalAction === "REFUSEE" ? "(obligatoire)" : "(optionnelle)"}
                  </label>
                  <textarea
                    value={noteAdmin}
                    onChange={(e) => setNoteAdmin(e.target.value)}
                    rows={3}
                    placeholder="Écrivez un message personnalisé..."
                    className="input-premium"
                    style={{ resize: "vertical", minHeight: "80px" }}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setModalAction(null)} disabled={updating}
                  className="btn-outline flex-1" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Annuler
                </button>
                <button
                  onClick={() => handleTraiter(modalAction)}
                  disabled={updating || (modalAction === "REFUSEE" && !noteAdmin.trim())}
                  className="btn-primary flex-1"
                  style={{
                    padding: "12px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    opacity: updating ? 0.7 : 1,
                    cursor: updating ? "not-allowed" : "pointer",
                  }}
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Traitement...
                    </span>
                  ) : (
                    "Confirmer"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPartenaires;
