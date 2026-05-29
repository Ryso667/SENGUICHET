import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { detailEvenement, annulerEvenement } from "../../services/eventService";

const AnnulerEvenement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await detailEvenement(id);
        setEventName(data.evenement.titre);
        setBuyers(data.tickets?.reduce((sum, t) => sum + (t.capacite - t.places_disponibles), 0) || 0);
      } catch (err) {
        setEventName("");
        navigate("/dashboard/evenements");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const isConfirmed = confirmText === eventName;

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setSubmitting(true);
    try {
      await annulerEvenement(id);
      navigate("/dashboard/evenements");
    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Annuler l'événement">
      <div className="max-w-lg mx-auto mt-8">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            ⚠️
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#EF4444" }}>
            Annuler cet événement ?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{eventName}</p>

          <div className="p-4 rounded-xl text-sm text-left mb-6"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}>
            <p className="font-medium mb-1">⚠️ Cette action est irréversible.</p>
            <p>Les <strong>{buyers} acheteurs</strong> seront remboursés automatiquement via Wave / Orange Money sous 24-48h.</p>
          </div>

          <div className="text-left mb-6">
            <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
              Tapez le nom de l'événement pour confirmer
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={eventName || "Nom de l'événement"}
              className={`input-premium ${confirmText && !isConfirmed ? "error" : ""}`}
            />
            {confirmText && !isConfirmed && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--error)" }}>
                Le nom saisi ne correspond pas
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/dashboard/evenements")} className="btn-ghost flex-1">
              Conserver l'événement
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed || submitting}
              className="btn-danger flex-1"
              style={{ opacity: !isConfirmed || submitting ? 0.5 : 1, cursor: !isConfirmed || submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Annulation..." : "Confirmer l'annulation"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnnulerEvenement;
