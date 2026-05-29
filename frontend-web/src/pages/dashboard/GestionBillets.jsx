import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

const mockEvent = { nom: "Concert Thiossane Live", statut: "ACTIF" };

const mockTickets = [
  { id: "TKT-2026-001", telephone: "+221 77 123 45 67", type: "Standard", prix: "10 000 F", date: "15/05/2026", statut: "VALIDE" },
  { id: "TKT-2026-002", telephone: "+221 78 234 56 78", type: "VIP", prix: "25 000 F", date: "15/05/2026", statut: "VALIDE" },
  { id: "TKT-2026-003", telephone: "+221 76 345 67 89", type: "Standard", prix: "10 000 F", date: "16/05/2026", statut: "UTILISÉ" },
  { id: "TKT-2026-004", telephone: "+221 70 456 78 90", type: "Gold", prix: "50 000 F", date: "16/05/2026", statut: "VALIDE" },
  { id: "TKT-2026-005", telephone: "+221 77 567 89 01", type: "Standard", prix: "10 000 F", date: "17/05/2026", statut: "ANNULÉ" },
  { id: "TKT-2026-006", telephone: "+221 78 678 90 12", type: "VIP", prix: "25 000 F", date: "18/05/2026", statut: "UTILISÉ" },
  { id: "TKT-2026-007", telephone: "+221 76 789 01 23", type: "Standard", prix: "10 000 F", date: "19/05/2026", statut: "VALIDE" },
  { id: "TKT-2026-008", telephone: "+221 70 890 12 34", type: "Gold", prix: "50 000 F", date: "20/05/2026", statut: "VALIDE" },
];

const badgeClass = {
  VALIDE: "badge-active",
  UTILISÉ: "badge-sold-out",
  ANNULÉ: "badge-cancelled",
};

const QRModal = ({ ticket, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <div className="glass-card p-8 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto mb-4">
        <rect x="10" y="10" width="40" height="40" fill="white" />
        <rect x="60" y="10" width="10" height="10" fill="white" />
        <rect x="80" y="10" width="10" height="10" fill="white" />
        <rect x="100" y="10" width="10" height="10" fill="white" />
        <rect x="120" y="10" width="40" height="40" fill="white" />
        <rect x="10" y="60" width="10" height="10" fill="white" />
        <rect x="30" y="60" width="20" height="10" fill="white" />
        <rect x="80" y="60" width="30" height="10" fill="white" />
        <rect x="120" y="60" width="10" height="10" fill="white" />
        <rect x="140" y="60" width="20" height="10" fill="white" />
        <rect x="170" y="60" width="20" height="40" fill="white" />
        <rect x="10" y="80" width="10" height="20" fill="white" />
        <rect x="30" y="80" width="20" height="20" fill="white" />
        <rect x="100" y="80" width="30" height="20" fill="white" />
        <rect x="140" y="80" width="20" height="20" fill="white" />
        <rect x="10" y="110" width="10" height="20" fill="white" />
        <rect x="40" y="110" width="10" height="20" fill="white" />
        <rect x="60" y="110" width="30" height="20" fill="white" />
        <rect x="100" y="110" width="10" height="20" fill="white" />
        <rect x="120" y="110" width="10" height="20" fill="white" />
        <rect x="150" y="110" width="10" height="10" fill="white" />
        <rect x="170" y="110" width="20" height="20" fill="white" />
        <rect x="10" y="140" width="20" height="10" fill="white" />
        <rect x="40" y="140" width="20" height="10" fill="white" />
        <rect x="80" y="140" width="20" height="10" fill="white" />
        <rect x="140" y="140" width="40" height="10" fill="white" />
        <rect x="10" y="160" width="40" height="30" fill="white" />
        <rect x="60" y="160" width="30" height="10" fill="white" />
        <rect x="100" y="160" width="10" height="30" fill="white" />
        <rect x="120" y="160" width="40" height="30" fill="white" />
        <rect x="30" y="30" width="10" height="10" fill="#6366F1" />
        <rect x="130" y="30" width="10" height="10" fill="#6366F1" />
        <rect x="170" y="20" width="10" height="10" fill="#6366F1" />
        <rect x="100" y="70" width="10" height="10" fill="#FB923C" />
        <rect x="170" y="50" width="10" height="10" fill="#6366F1" />
      </svg>
      <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{ticket.id}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{ticket.telephone} • {ticket.type}</p>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{ticket.prix}</p>
      <div className="flex justify-center mt-3">
        <span className={`badge ${badgeClass[ticket.statut]}`}>{ticket.statut}</span>
      </div>
      <button onClick={onClose} className="btn-ghost btn-sm btn-full mt-4">Fermer</button>
    </div>
  </div>
);

const GestionBillets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qrTicket, setQrTicket] = useState(null);

  const totalVendus = mockTickets.filter((t) => t.statut !== "ANNULÉ").length;
  const totalDisponibles = 500;
  const revenus = mockTickets.reduce((acc, t) => {
    if (t.statut === "ANNULÉ") return acc;
    return acc + parseInt(t.prix.replace(/\s/g, ""));
  }, 0);

  return (
    <DashboardLayout title={`Billets - ${mockEvent.nom}`}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">← Retour</button>
        <span className={`badge ${mockEvent.statut === "ACTIF" ? "badge-active" : "badge-pending"}`}>{mockEvent.statut}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card"><span className="stat-value">{totalVendus}</span><span className="stat-label">Billets vendus</span></div>
        <div className="stat-card"><span className="stat-value">{totalDisponibles - totalVendus}</span><span className="stat-label">Disponibles</span></div>
        <div className="stat-card"><span className="stat-value">{revenus.toLocaleString()} F</span><span className="stat-label">Revenus total</span></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["N° Billet", "Téléphone", "Type", "Prix", "Date achat", "Statut", "QR"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{t.id}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{t.telephone}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{t.type}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{t.prix}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{t.date}</td>
                  <td className="px-4 py-3"><span className={`badge ${badgeClass[t.statut]}`}>{t.statut}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setQrTicket(t)} className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:scale-95" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818CF8" }}>
                      👁 QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qrTicket && <QRModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}
    </DashboardLayout>
  );
};

export default GestionBillets;
