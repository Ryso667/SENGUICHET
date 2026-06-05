import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerOrganisateurs, reinitialiserMotDePasseOrganisateur } from "../../services/authService";
import { Lock, X, Check } from "../../components/Icons";

const badgeMap = {
  VALIDE: { class: "badge-active", label: "Actif" },
  EN_ATTENTE: { class: "badge-pending", label: "En attente" },
};

const AdminOrganisateurs = () => {
  const [orgas, setOrgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
      setResetModal(null);
      setNewPassword("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Erreur reset:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Gestion des organisateurs</h1>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)" }}>
            <Check size={18} style={{ color: "#00E5A0", flexShrink: 0 }} />
            <span style={{ color: "#00E5A0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px" }}>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Nom", "Email", "Téléphone", "Date inscription", "Événements", "Statut", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgas.map((o) => {
                    const b = badgeMap[o.statut] || badgeMap.VALIDE;
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white font-medium">{o.nom}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.email}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.telephone}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.date}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.nb_evenements}</td>
                        <td className="px-4 py-3"><span className={`badge ${b.class}`}>{b.label}</span></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setResetModal(o); setNewPassword(""); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{
                              border: "1px solid rgba(0,200,255,0.3)",
                              color: "var(--primary)",
                              background: "transparent",
                            }}
                            onMouseEnter={(el) => { el.currentTarget.style.background = "rgba(0,200,255,0.1)"; }}
                            onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}
                          >
                            <Lock size={14} /> Réinitialiser
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orgas.length === 0 && (
                <p className="text-center py-10" style={{ color: "var(--text-secondary)" }}>Aucun organisateur.</p>
              )}
            </div>
          </div>
        )}

        {resetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md glass-card p-6 sm:p-8" style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                  <Lock size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
                  Réinitialiser le mot de passe
                </h2>
                <button onClick={() => { if (!resetting) setResetModal(null); }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                ><X size={18} /></button>
              </div>

              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Nouveau mot de passe pour <strong style={{ color: "#fff" }}>{resetModal.nom}</strong> — {resetModal.email}
              </p>

              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                className="input-premium w-full mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                autoFocus
              />

              <div className="flex gap-3">
                <button onClick={() => setResetModal(null)} disabled={resetting}
                  className="btn-ghost flex-1" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: resetting ? 0.5 : 1, cursor: resetting ? "not-allowed" : "pointer" }}>
                  Annuler
                </button>
                <button onClick={handleReset} disabled={resetting || newPassword.length < 6}
                  className="btn-primary flex-1" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: (resetting || newPassword.length < 6) ? 0.7 : 1, cursor: (resetting || newPassword.length < 6) ? "not-allowed" : "pointer" }}>
                  {resetting ? "Réinitialisation..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrganisateurs;
