import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerCodeControleur, adminRegenererCode, adminDesactiverCode } from "../../services/controleurService";
import { ArrowLeft, Clipboard, Check, Loader2, Shield } from "lucide-react";

const AdminCodesControleurs = () => {
  const { evenementId } = useParams();
  const navigate = useNavigate();
  const [evenement, setEvenement] = useState(null);
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDesactModal, setShowDesactModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCode = useCallback(async () => {
    try {
      const data = await adminListerCodeControleur(evenementId);
      setEvenement(data.evenement);
      setCodeData(data.code);
    } catch (err) {
      console.error("Erreur chargement code:", err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [evenementId]);

  useEffect(() => { fetchCode(); }, [fetchCode]);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast("Erreur de copie", "error"); }
  };

  const handleRegenerer = async () => {
    setActionLoading(true);
    try {
      const data = await adminRegenererCode(evenementId);
      setCodeData(data.code);
      setShowRegenModal(false);
      showToast("Nouveau code généré avec succès");
    } catch (err) { showToast(err.message || "Erreur", "error"); }
    finally { setActionLoading(false); }
  };

  const handleDesactiver = async () => {
    setActionLoading(true);
    try {
      await adminDesactiverCode(evenementId);
      setCodeData((prev) => prev ? { ...prev, statut: "INACTIF" } : prev);
      setShowDesactModal(false);
      showToast("Code désactivé avec succès");
    } catch (err) { showToast(err.message || "Erreur", "error"); }
    finally { setActionLoading(false); }
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex admin-bg">
      <AdminSidebar />
      <div className="admin-page-enter flex-1 lg:ml-[260px] flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4"
          style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Pages / Contrôleurs / Code</p>
              <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Code contrôleur</h1>
            </div>
            <p className="text-xs capitalize" style={{ color: "#94a3b8" }}>{today}</p>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8">
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate("/admin/controleurs")}
          className="flex items-center gap-2 text-sm mb-4 transition-all" style={{ color: "#64748B" }}>
          <ArrowLeft size={16} /> Retour
        </motion.button>

        {evenement && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <p className="text-sm flex items-center gap-1" style={{ color: "#15803D" }}>
              <Shield size={14} /> {evenement.titre}
            </p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl border-l-4"
          style={{ background: "rgba(21,128,61,0.06)", borderLeftColor: "#15803D" }}>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Ce code permet aux contrôleurs d'accéder au scanner de cet événement.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="admin-skeleton" style={{ height: 16, width: 200, marginBottom: 16 }} />
            <div className="admin-skeleton" style={{ height: 48, width: 240, marginBottom: 16 }} />
            <div className="admin-skeleton" style={{ height: 12, width: 80 }} />
          </div>
        ) : codeData ? (
          <div className="max-w-md mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 relative border" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Code d'accès
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: codeData.statut === "ACTIF" ? "rgba(21,128,61,0.1)" : "rgba(107,114,128,0.1)", color: codeData.statut === "ACTIF" ? "#15803D" : "#64748B" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: codeData.statut === "ACTIF" ? "#15803D" : "#64748B" }} />
                  {codeData.statut}
                </span>
              </div>
              <p className="text-center" style={{
                fontSize: "48px", fontWeight: 800, color: "#15803D",
                letterSpacing: "12px", fontFamily: "monospace", margin: "20px 0",
              }}>
                {codeData.code}
              </p>
              <div className="flex justify-center">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => copyCode(codeData.code)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.2)", color: copied ? "#15803D" : "#64748B" }}>
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copié !" : "Copier le code"}
                </motion.button>
              </div>
            </motion.div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowRegenModal(true)}
              className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all mt-6 mb-3"
              style={{ background: "#15803D" }}>
              Régénérer le code
            </motion.button>

            <div className="text-center">
              <motion.button whileHover={{ scale: 1.03 }}
                onClick={() => setShowDesactModal(true)}
                className="text-sm transition-all font-medium" style={{ color: "#15803D" }}>
                Désactiver le code
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="admin-empty-state mx-auto" style={{ maxWidth: 400, borderRadius: "16px", background: "#FFFFFF", border: "1px solid #E8EEF4" }}>
            <Shield size={48} />
            <h3>Aucun code trouvé</h3>
            <p>Ce contrôleur n'a pas encore de code. Générez-en un depuis la page des événements.</p>
          </div>
        )}
        </main>
      </div>

      <AnimatePresence>
        {showRegenModal && (
          <ConfirmModal title="Régénérer le code ?"
            message="Le code actuel sera immédiatement désactivé. Les contrôleurs qui utilisent ce code perdront leur accès."
            onConfirm={handleRegenerer} onClose={() => setShowRegenModal(false)} loading={actionLoading} />
        )}
        {showDesactModal && (
          <ConfirmModal title="Désactiver le code ?"
            message="Le code sera désactivé. Les contrôleurs ne pourront plus accéder au scanner de cet événement."
            onConfirm={handleDesactiver} onClose={() => setShowDesactModal(false)} loading={actionLoading} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 2000,
              padding: "0.75rem 1.5rem", borderRadius: "12px", fontSize: "0.875rem", fontWeight: 600,
              background: "#15803D", color: "#fff",
            }}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConfirmModal = ({ title, message, onConfirm, onClose, loading }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    onClick={() => { if (!loading) onClose(); }}>
    <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="w-full max-w-md rounded-2xl p-6 border shadow-xl" style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
      onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a1a" }}>{title}</h3>
      <p className="text-sm mb-6" style={{ color: "#64748B", lineHeight: 1.5 }}>{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ border: "1px solid #E8EEF4", color: "#64748B" }}>
          Annuler
        </button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onConfirm} disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: loading ? "#94a3b8" : "#15803D" }}>
          {loading ? "..." : "Confirmer"}
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

export default AdminCodesControleurs;
