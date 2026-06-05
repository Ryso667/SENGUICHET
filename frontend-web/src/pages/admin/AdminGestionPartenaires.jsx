import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import { listerDemandes, creerIdentifiantsPartenaire, listerIdentifiants, reinitialiserMotDePasse } from "../../services/partnerService";
import { X, Check } from "../../components/Icons";

const AdminGestionPartenaires = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("creer");
  const [acceptees, setAcceptees] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [acc, comptesData] = await Promise.all([
        listerDemandes("ACCEPTEE"),
        listerIdentifiants(),
      ]);
      setAcceptees(acc);
      setComptes(comptesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { logout(); navigate("/connexion"); };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!selected || !form.email || !form.mot_de_passe) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await creerIdentifiantsPartenaire({
        demande_id: selected.id,
        email: form.email,
        mot_de_passe: form.mot_de_passe,
      });
      setSuccess(`Identifiants créés pour ${result.email}`);
      setForm({ email: "", mot_de_passe: "" });
      setSelected(null);
      fetchData();
      setTab("comptes");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!resetModal || !newPassword) return;
    setResetting(true);
    try {
      await reinitialiserMotDePasse(resetModal.id, { nouveau_mot_de_passe: newPassword });
      setSuccess("Mot de passe réinitialisé !");
      setResetModal(null);
      setNewPassword("");
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  const demandesSansIdentifiants = acceptees.filter(
    (d) => !comptes.some((c) => c.demande_id === d.id)
  );

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />

      <div className="flex-1 lg:ml-[260px] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(10,11,26,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Gestion des partenaires</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <button onClick={handleLogout} className="lg:hidden px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--error)" }}>
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-28">
          {/* Notifications */}
          {success && (
            <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", color: "#00E5A0" }}>
              <Check size={16} className="font-semibold" /> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", color: "#FF4D6D" }}>
              <X size={16} className="font-semibold" /> {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab("creer")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: tab === "creer" ? "linear-gradient(135deg, #00C8FF, #0077FF)" : "rgba(255,255,255,0.06)", color: tab === "creer" ? "#fff" : "rgba(255,255,255,0.6)", border: tab === "creer" ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
              Créer des identifiants
            </button>
            <button onClick={() => setTab("comptes")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: tab === "comptes" ? "linear-gradient(135deg, #00C8FF, #0077FF)" : "rgba(255,255,255,0.06)", color: tab === "comptes" ? "#fff" : "rgba(255,255,255,0.6)", border: tab === "comptes" ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
              Comptes existants ({comptes.length})
            </button>
          </div>

          {/* Tab : Créer des identifiants */}
          {tab === "creer" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liste des demandes acceptées */}
              <div>
                <h2 className="text-sm font-semibold mb-3" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Demandes acceptées sans identifiants
                </h2>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-2 border-transparent border-t-[#00C8FF] rounded-full animate-spin" />
                  </div>
                ) : demandesSansIdentifiants.length === 0 ? (
                  <div className="glass-card p-8 text-center">
                    <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Toutes les demandes acceptées ont déjà des identifiants.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {demandesSansIdentifiants.map((d) => (
                      <button key={d.id} onClick={() => { setSelected(d); setForm({ email: d.email || "", mot_de_passe: "" }); setError(null); }}
                        className="w-full glass-card p-4 text-left transition-all"
                        style={{ borderColor: selected?.id === d.id ? "rgba(0,200,255,0.5)" : "rgba(255,255,255,0.06)", borderWidth: selected?.id === d.id ? "2px" : "1px" }}>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{d.organisation}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{d.nom} — {d.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulaire de création */}
              <div>
                {selected ? (
                  <form onSubmit={handleCreer} className="glass-card p-6 space-y-4">
                    <h3 className="text-base font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Identifiants pour {selected.organisation}
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Email de connexion
                      </label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-premium w-full" placeholder="partenaire@exemple.com" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Mot de passe
                      </label>
                      <input type="text" required minLength={6} value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                        className="input-premium w-full" placeholder="Minimum 6 caractères" />
                    </div>

                    <button type="submit" disabled={submitting}
                      className="btn-primary w-full" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
                      {submitting ? "Création..." : "Créer les identifiants"}
                    </button>

                    <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Un email sera envoyé au partenaire avec ses identifiants.
                    </p>
                  </form>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Sélectionnez une demande acceptée pour créer ses identifiants.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab : Comptes existants */}
          {tab === "comptes" && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-2 border-transparent border-t-[#00C8FF] rounded-full animate-spin" />
                </div>
              ) : comptes.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Aucun compte partenaire créé pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comptes.map((c) => (
                    <div key={c.id} className="glass-card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {c.nom_organisation}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: c.statut === "ACTIF" ? "rgba(0,229,160,0.15)" : "rgba(255,179,71,0.15)", color: c.statut === "ACTIF" ? "#00E5A0" : "#FFB347" }}>
                              {c.statut === "ACTIF" ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span>{c.email}</span>
                            {c.telephone && <span>{c.telephone}</span>}
                            <span>Créé le {c.date_creation}</span>
                          </div>
                        </div>
                        <button onClick={() => { setResetModal(c); setNewPassword(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                          style={{ background: "rgba(255,179,71,0.15)", border: "1px solid rgba(255,179,71,0.3)", color: "#FFB347" }}>
                          Réinitialiser mot de passe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal réinitialisation mot de passe */}
        {resetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { if (!resetting) setResetModal(null); }}>
            <div className="w-full max-w-md glass-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                Réinitialiser le mot de passe
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {resetModal.nom_organisation} — {resetModal.email}
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Nouveau mot de passe
                </label>
                <input type="text" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="input-premium w-full" placeholder="Minimum 6 caractères" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setResetModal(null)} disabled={resetting}
                  className="btn-outline flex-1" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Annuler
                </button>
                <button onClick={handleReset} disabled={resetting || newPassword.length < 6}
                  className="btn-primary flex-1" style={{ padding: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: resetting ? 0.7 : 1, cursor: resetting ? "not-allowed" : "pointer" }}>
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

export default AdminGestionPartenaires;
