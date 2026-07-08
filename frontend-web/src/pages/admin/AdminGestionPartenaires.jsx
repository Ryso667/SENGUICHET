import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { listerDemandes, creerIdentifiantsPartenaire, listerIdentifiants, reinitialiserMotDePasse } from "../../services/partnerService";
import { useToast } from "../../context/ToastContext";
import { X, Check, Loader2, LogOut } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } }),
};

const AdminGestionPartenaires = () => {
  const { logout } = useAuth();
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
  const addToast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [acc, comptesData] = await Promise.all([listerDemandes("ACCEPTEE"), listerIdentifiants()]);
      setAcceptees(acc); setComptes(comptesData);
    } catch (err) { console.error(err); addToast("Impossible de charger les données.", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { logout(); navigate("/connexion"); };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!selected || !form.email || !form.mot_de_passe) return;
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const result = await creerIdentifiantsPartenaire({ demande_id: selected.id, email: form.email, mot_de_passe: form.mot_de_passe });
      setSuccess(`Identifiants créés pour ${result.email}`);
      setForm({ email: "", mot_de_passe: "" }); setSelected(null);
      fetchData(); setTab("comptes");
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleReset = async () => {
    if (!resetModal || !newPassword) return;
    setResetting(true);
    try {
      await reinitialiserMotDePasse(resetModal.id, { nouveau_mot_de_passe: newPassword });
      setSuccess("Mot de passe réinitialisé !");
      setResetModal(null); setNewPassword("");
      fetchData();
    } catch (err) { setError(err.message); }
    finally { setResetting(false); }
  };

  const demandesSansIdentifiants = acceptees.filter((d) => !comptes.some((c) => c.demande_id === d.id));

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>
                Gestion des partenaires
              </h1>
              <p className="text-xs mt-0.5 capitalize" style={{ color: "#94a3b8" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleLogout} className="lg:hidden px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.2)", color: "#15803D" }}>
              <LogOut size={14} /> Déconnexion
            </motion.button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 pb-28">
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                <Check size={16} /> {success}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                <X size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 mb-6">
            {["creer", "comptes"].map((t) => (
              <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setTab(t)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: tab === t ? "#15803D" : "transparent", color: tab === t ? "#fff" : "#64748B", border: tab === t ? "none" : "1px solid #E8EEF4" }}>
                {t === "creer" ? "Créer des identifiants" : `Comptes existants (${comptes.length})`}
              </motion.button>
            ))}
          </div>

          {tab === "creer" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-semibold mb-3" style={{ color: "#64748B" }}>Demandes acceptées sans identifiants</h2>
                {loading ? (
                  <div className="text-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#94a3b8" }} /></div>
                ) : demandesSansIdentifiants.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Toutes les demandes acceptées ont déjà des identifiants.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {demandesSansIdentifiants.map((d, i) => (
                        <motion.button key={d.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                          whileHover={{ y: -1 }}
                          onClick={() => { setSelected(d); setForm({ email: d.email || "", mot_de_passe: "" }); setError(null); }}
                          className="w-full rounded-2xl p-4 text-left transition-all border"
                          style={{ background: "#FFFFFF", borderColor: selected?.id === d.id ? "#15803D" : "#E8EEF4", borderWidth: selected?.id === d.id ? "2px" : "1px" }}>
                          <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{d.organisation}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{d.nom} — {d.email}</p>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div>
                {selected ? (
                  <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleCreer} className="rounded-2xl p-6 space-y-4 border"
                    style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                    <h3 className="text-base font-bold" style={{ color: "#1a1a1a" }}>Identifiants pour {selected.organisation}</h3>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Email de connexion</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                        placeholder="partenaire@exemple.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Mot de passe</label>
                      <input type="text" required minLength={6} value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                        placeholder="Minimum 6 caractères" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={submitting}
                      className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all"
                      style={{ background: submitting ? "#94a3b8" : "#15803D", cursor: submitting ? "not-allowed" : "pointer" }}>
                      {submitting ? "Création..." : "Créer les identifiants"}
                    </motion.button>
                    <p className="text-xs" style={{ color: "#64748B" }}>Un email sera envoyé au partenaire avec ses identifiants.</p>
                  </motion.form>
                ) : (
                  <div className="rounded-2xl p-8 text-center border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Sélectionnez une demande acceptée pour créer ses identifiants.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "comptes" && (
            <div>
              {loading ? (
                <div className="text-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#94a3b8" }} /></div>
              ) : comptes.length === 0 ? (
                <div className="rounded-2xl p-12 text-center border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                  <p className="text-sm" style={{ color: "#94a3b8" }}>Aucun compte partenaire créé pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {comptes.map((c, i) => (
                      <motion.div key={c.id} custom={i} variants={fadeUp} initial="initial" animate="animate"
                        whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                        className="rounded-2xl p-5 border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{c.nom_organisation}</span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1"
                                style={{ background: c.statut === "ACTIF" ? "rgba(21,128,61,0.1)" : "rgba(21,128,61,0.1)", color: c.statut === "ACTIF" ? "#15803D" : "#15803D" }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.statut === "ACTIF" ? "#15803D" : "#15803D" }} />
                                {c.statut === "ACTIF" ? "Actif" : "Inactif"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "#64748B" }}>
                              <span>{c.email}</span>
                              {c.telephone && <span>{c.telephone}</span>}
                              <span>Créé le {c.date_creation}</span>
                            </div>
                          </div>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setResetModal(c); setNewPassword(""); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                            style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", color: "#15803D" }}>
                            Réinitialiser mot de passe
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </main>

        <AnimatePresence>
          {resetModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
              onClick={() => { if (!resetting) setResetModal(null); }}>
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md rounded-2xl p-6 space-y-4 border shadow-xl"
                style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
                onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Réinitialiser le mot de passe</h3>
                <p className="text-sm" style={{ color: "#64748B" }}>{resetModal.nom_organisation} — {resetModal.email}</p>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B" }}>Nouveau mot de passe</label>
                  <input type="text" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                    placeholder="Minimum 6 caractères" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setResetModal(null)} disabled={resetting}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{ border: "1px solid #E8EEF4", color: "#64748B" }}>
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

export default AdminGestionPartenaires;
