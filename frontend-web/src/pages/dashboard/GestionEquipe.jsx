import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { Check, Clipboard } from "../../components/Icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const getToken = () => localStorage.getItem("jwt_token");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const GestionEquipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(null);
  const [controleurs, setControleurs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    charger();
  }, [id]);

  async function charger() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/evenements/${id}/equipe`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setCode(data.code_controleur || null);
      setControleurs(data.controleurs || []);
    } catch {
      setCode(null);
      setControleurs([]);
    }
    setLoading(false);
  }

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout title="Mon équipe">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">← Retour</button>
      </div>

      <div className="glass-card p-6 mb-6">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Code d'accès contrôleurs
        </p>
        <p className="text-2xl sm:text-3xl font-bold gradient-text text-center mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>
          {loading ? "..." : code || "Aucun code défini"}
        </p>
        {code && (
          <div className="flex justify-center gap-3">
            <button onClick={handleCopy} className="btn-primary btn-sm" style={{ width: "auto", minWidth: 120 }}>
              {copied ? <><Check size={16} /> Copié !</> : <><Clipboard size={16} /> Copier</>}
            </button>
          </div>
        )}
        <p className="text-xs text-center mt-4" style={{ color: "var(--text-secondary)", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          {code
            ? "Partagez ce code avec vos contrôleurs. Ils l'utilisent pour accéder à l'app mobile de scan."
            : "Aucun code d'accès n'a encore été défini pour cet événement. Contactez l'administrateur."}
        </p>
      </div>

      <h3 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Contrôleurs affectés</h3>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Chargement...</p>
      ) : controleurs.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Aucun contrôleur affecté à cet événement.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nom", "Téléphone", "Zone", "Scans effectués"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {controleurs.map((c, i) => (
                  <tr key={c.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.nom || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.telephone}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{c.zone || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.scans_effectues || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestionEquipe;
