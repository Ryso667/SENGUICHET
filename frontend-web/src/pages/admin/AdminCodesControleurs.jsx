import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import {
  adminListerCodesControleur,
  adminRegenererCodes,
  adminDesactiverCodes,
} from "../../services/controleurService";
import { ArrowLeft, Clipboard, Check, X, Loader } from "../../components/Icons";

const AdminCodesControleurs = () => {
  const { evenementId } = useParams();
  const navigate = useNavigate();
  const [evenement, setEvenement] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDesactModal, setShowDesactModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCodes = useCallback(async () => {
    try {
      const data = await adminListerCodesControleur(evenementId);
      setEvenement(data.evenement);
      setCodes(data.codes);
    } catch (err) {
      console.error("Erreur chargement codes:", err);
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [evenementId]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const copyCode = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast("Erreur de copie", "error");
    }
  };

  const handleRegenerer = async () => {
    setActionLoading(true);
    try {
      const data = await adminRegenererCodes(evenementId);
      setCodes(data.codes);
      setShowRegenModal(false);
      showToast("5 nouveaux codes générés avec succès");
    } catch (err) {
      showToast(err.message || "Erreur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesactiver = async () => {
    setActionLoading(true);
    try {
      await adminDesactiverCodes(evenementId);
      setCodes((prev) => prev.map((c) => ({ ...c, statut: "INACTIF" })));
      setShowDesactModal(false);
      showToast("Tous les codes ont été désactivés");
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
            Codes contrôleurs
          </h1>
          {evenement && (
            <p className="text-sm mt-1" style={{ color: "#00C8FF" }}>
              {evenement.titre}
            </p>
          )}
        </div>

        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(0,200,255,0.08)", borderLeft: "4px solid #00C8FF" }}>
          <p className="text-sm" style={{ color: "#A0B4C8" }}>
            Ces codes permettent aux contrôleurs d'accéder au scanner de cet événement. Chaque code est unique et personnel.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} style={{ color: "#00C8FF" }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {codes.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-xl p-5 relative transition-all"
                  style={{
                    background: "#152232",
                    border: "1px solid rgba(0,200,255,0.15)",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#A0B4C8" }}>
                      Contrôleur N°{c.index_controleur + 1}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: c.statut === "ACTIF" ? "rgba(0,229,160,0.15)" : "rgba(107,114,128,0.15)",
                        color: c.statut === "ACTIF" ? "#00E5A0" : "#6B7280",
                      }}
                    >
                      {c.statut}
                    </span>
                  </div>

                  <p className="text-center" style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#00C8FF",
                    letterSpacing: "8px",
                    fontFamily: "monospace",
                    margin: "12px 0",
                  }}>
                    {c.code}
                  </p>

                  <div className="flex justify-end">
                    <button
                      onClick={() => copyCode(c.code, i)}
                      className="p-2 rounded-lg transition-all"
                      style={{ color: copiedIndex === i ? "#00E5A0" : "#A0B4C8" }}
                    >
                      {copiedIndex === i ? <Check size={18} /> : <Clipboard size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRegenModal(true)}
              className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all mb-3"
              style={{
                background: "linear-gradient(135deg, #00C8FF, #0077FF)",
              }}
            >
              🔄 Régénérer les codes
            </button>

            <div className="text-center">
              <button
                onClick={() => setShowDesactModal(true)}
                className="text-sm transition-all"
                style={{ color: "#FF4D6D" }}
              >
                Désactiver tous les codes
              </button>
            </div>
          </>
        )}

        <Modal
          show={showRegenModal}
          onClose={() => setShowRegenModal(false)}
          onConfirm={handleRegenerer}
          title="Régénérer les codes ?"
          message="Les 5 codes actuels seront immédiatement désactivés. Les contrôleurs qui utilisent ces codes perdront leur accès."
          confirmLabel="Confirmer"
        />

        <Modal
          show={showDesactModal}
          onClose={() => setShowDesactModal(false)}
          onConfirm={handleDesactiver}
          title="Désactiver tous les codes ?"
          message="Tous les codes seront désactivés. Les contrôleurs ne pourront plus accéder au scanner de cet événement."
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
