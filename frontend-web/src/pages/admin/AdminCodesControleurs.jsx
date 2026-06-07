import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import {
  adminListerCodeControleur,
  adminRegenererCode,
  adminDesactiverCode,
} from "../../services/controleurService";
import { ArrowLeft, Clipboard, Check, Loader } from "../../components/Icons";

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

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Erreur de copie", "error");
    }
  };

  const handleRegenerer = async () => {
    setActionLoading(true);
    try {
      const data = await adminRegenererCode(evenementId);
      setCodeData(data.code);
      setShowRegenModal(false);
      showToast("Nouveau code généré avec succès");
    } catch (err) {
      showToast(err.message || "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesactiver = async () => {
    setActionLoading(true);
    try {
      await adminDesactiverCode(evenementId);
      setCodeData((prev) => prev ? { ...prev, statut: "INACTIF" } : prev);
      setShowDesactModal(false);
      showToast("Code désactivé avec succès");
    } catch (err) {
      showToast(err.message || "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const Modal = ({ show, onClose, onConfirm, title, message, confirmLabel }) => {
    if (!show) return null;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "1rem",
      }}>
        <div style={{
          maxWidth: 440, width: "100%",
          padding: "2rem", borderRadius: "16px",
          background: "#152232", border: "1px solid rgba(0,200,255,0.15)",
        }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#F1F5F9", fontFamily: "Outfit, sans-serif" }}>
            {title}
          </h3>
          <p className="text-sm mb-6" style={{ color: "#A0B4C8", lineHeight: 1.5 }}>
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "transparent",
                border: "1px solid #00C8FF",
                color: "#00C8FF",
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{
                background: actionLoading ? "rgba(0,200,255,0.3)" : "linear-gradient(135deg, #00C8FF, #0077FF)",
              }}
            >
              {actionLoading ? "..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <button
          onClick={() => navigate("/admin/controleurs")}
          className="flex items-center gap-2 text-sm mb-4 transition-all"
          style={{ color: "#A0B4C8" }}
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
            Code contrôleur
          </h1>
          {evenement && (
            <p className="text-sm mt-1" style={{ color: "#00C8FF" }}>
              {evenement.titre}
            </p>
          )}
        </div>

        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(0,200,255,0.08)", borderLeft: "4px solid #00C8FF" }}>
          <p className="text-sm" style={{ color: "#A0B4C8" }}>
            Ce code permet aux contrôleurs d'accéder au scanner de cet événement. Chaque code est unique et personnel à un événement.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} style={{ color: "#00C8FF" }} />
          </div>
        ) : codeData ? (
          <div className="max-w-md mx-auto">
            <div
              className="rounded-xl p-8 relative transition-all"
              style={{
                background: "#152232",
                border: "1px solid rgba(0,200,255,0.15)",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A0B4C8" }}>
                  Code d'accès
                </span>
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    background: codeData.statut === "ACTIF" ? "rgba(0,229,160,0.15)" : "rgba(107,114,128,0.15)",
                    color: codeData.statut === "ACTIF" ? "#00E5A0" : "#6B7280",
                  }}
                >
                  {codeData.statut}
                </span>
              </div>

              <p className="text-center" style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "#00C8FF",
                letterSpacing: "12px",
                fontFamily: "monospace",
                margin: "20px 0",
              }}>
                {codeData.code}
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => copyCode(codeData.code)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: "rgba(0,200,255,0.1)",
                    border: "1px solid rgba(0,200,255,0.2)",
                    color: copied ? "#00E5A0" : "#A0B4C8",
                  }}
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copié !" : "Copier le code"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRegenModal(true)}
              className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all mt-6 mb-3"
              style={{
                background: "linear-gradient(135deg, #00C8FF, #0077FF)",
              }}
            >
              🔄 Régénérer le code
            </button>

            <div className="text-center">
              <button
                onClick={() => setShowDesactModal(true)}
                className="text-sm transition-all"
                style={{ color: "#FF4D6D" }}
              >
                Désactiver le code
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto rounded-xl p-12 text-center" style={{ background: "#152232", border: "1px solid rgba(0,200,255,0.15)" }}>
            <p style={{ color: "#A0B4C8" }}>Aucun code trouvé.</p>
          </div>
        )}

        <Modal
          show={showRegenModal}
          onClose={() => setShowRegenModal(false)}
          onConfirm={handleRegenerer}
          title="Régénérer le code ?"
          message="Le code actuel sera immédiatement désactivé. Les contrôleurs qui utilisent ce code perdront leur accès."
          confirmLabel="Confirmer"
        />

        <Modal
          show={showDesactModal}
          onClose={() => setShowDesactModal(false)}
          onConfirm={handleDesactiver}
          title="Désactiver le code ?"
          message="Le code sera désactivé. Les contrôleurs ne pourront plus accéder au scanner de cet événement."
          confirmLabel="Confirmer"
        />

        {toast && (
          <div style={{
            position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 2000,
            padding: "0.75rem 1.5rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
            background: toast.type === "error" ? "#FF4D6D" : "#00E5A0",
            color: "#0D1B2A",
            animation: "fadeIn 0.3s ease",
          }}>
            {toast.message}
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminCodesControleurs;
