import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

const mockControllers = [
  { telephone: "+221 77 123 45 01", scannes: 45, derniereActivite: "Il y a 2 min", statut: "ACTIF" },
  { telephone: "+221 78 234 56 02", scannes: 32, derniereActivite: "Il y a 15 min", statut: "ACTIF" },
  { telephone: "+221 76 345 67 03", scannes: 18, derniereActivite: "Il y a 1h", statut: "ACTIF" },
  { telephone: "+221 70 456 78 04", scannes: 0, derniereActivite: "Jamais", statut: "INACTIF" },
];

const ConfirmRegenModal = ({ open, onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>🔄 Régénérer le code ?</h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Le code actuel deviendra invalide. Les contrôleurs devront utiliser le nouveau code.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost btn-sm" style={{ flex: 1 }}>Annuler</button>
          <button onClick={onConfirm} className="btn-primary btn-sm" style={{ flex: 1, background: "linear-gradient(135deg, #FB923C, #EF4444)" }}>Régénérer</button>
        </div>
      </div>
    </div>
  );
};

const GestionEquipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("4892");
  const [copied, setCopied] = useState(false);
  const [showRegen, setShowRegen] = useState(false);

  const handleCopy = async () => {
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
        <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>👥 Concert Thiossane Live</h3>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>15 Juin 2026 • Dakar Arena</p>
      </div>

      <div className="glass-card p-6 mb-6">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {/* */}Code d'accès contrôleurs
        </p>
        <p className="text-2xl sm:text-3xl font-bold gradient-text text-center mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>
          {code}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={handleCopy} className="btn-primary btn-sm" style={{ width: "auto", minWidth: 120 }}>
            {copied ? "✓ Copié !" : "📋 Copier"}
          </button>
          <button onClick={() => setShowRegen(true)} className="btn-ghost btn-sm" style={{ width: "auto" }}>🔄 Régénérer</button>
        </div>
        <p className="text-xs text-center mt-4" style={{ color: "var(--text-secondary)", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Partagez ce code avec vos contrôleurs. Ils l'utilisent pour accéder à l'app mobile de scan.
        </p>
      </div>

      <h3 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Contrôleurs actifs</h3>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Téléphone", "Billets scannés", "Dernière activité", "Statut"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockControllers.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.telephone}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{c.scannes}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{c.derniereActivite}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.statut === "ACTIF" ? "badge-active" : "badge-cancelled"}`}>{c.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmRegenModal open={showRegen} onClose={() => setShowRegen(false)} onConfirm={() => {
        const newCode = String(Math.floor(1000 + Math.random() * 9000));
        setCode(newCode);
        setCopied(false);
        setShowRegen(false);
      }} />
    </DashboardLayout>
  );
};

export default GestionEquipe;
