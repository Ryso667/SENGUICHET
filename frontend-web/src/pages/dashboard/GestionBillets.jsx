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
    <div className="p-8 w-full max-w-sm text-center rounded-2xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto mb-4">
        <rect x="10" y="10" width="40" height="40" fill="#1a1a2e" />
        <rect x="60" y="10" width="10" height="10" fill="#1a1a2e" />
        <rect x="80" y="10" width="10" height="10" fill="#1a1a2e" />
        <rect x="100" y="10" width="10" height="10" fill="#1a1a2e" />
        <rect x="120" y="10" width="40" height="40" fill="#1a1a2e" />
        <rect x="10" y="60" width="10" height="10" fill="#1a1a2e" />
        <rect x="30" y="60" width="20" height="10" fill="#1a1a2e" />
        <rect x="80" y="60" width="30" height="10" fill="#1a1a2e" />
        <rect x="120" y="60" width="10" height="10" fill="#1a1a2e" />
        <rect x="140" y="60" width="20" height="10" fill="#1a1a2e" />
        <rect x="170" y="60" width="20" height="40" fill="#1a1a2e" />
        <rect x="10" y="80" width="10" height="20" fill="#1a1a2e" />
        <rect x="30" y="80" width="20" height="20" fill="#1a1a2e" />
        <rect x="100" y="80" width="30" height="20" fill="#1a1a2e" />
        <rect x="140" y="80" width="20" height="20" fill="#1a1a2e" />
        <rect x="10" y="110" width="10" height="20" fill="#1a1a2e" />
        <rect x="40" y="110" width="10" height="20" fill="#1a1a2e" />
        <rect x="60" y="110" width="30" height="20" fill="#1a1a2e" />
        <rect x="100" y="110" width="10" height="20" fill="#1a1a2e" />
        <rect x="120" y="110" width="10" height="20" fill="#1a1a2e" />
        <rect x="150" y="110" width="10" height="10" fill="#1a1a2e" />
        <rect x="170" y="110" width="20" height="20" fill="#1a1a2e" />
        <rect x="10" y="140" width="20" height="10" fill="#1a1a2e" />
        <rect x="40" y="140" width="20" height="10" fill="#1a1a2e" />
        <rect x="80" y="140" width="20" height="10" fill="#1a1a2e" />
        <rect x="140" y="140" width="40" height="10" fill="#1a1a2e" />
        <rect x="10" y="160" width="40" height="30" fill="#1a1a2e" />
        <rect x="60" y="160" width="30" height="10" fill="#1a1a2e" />
        <rect x="100" y="160" width="10" height="30" fill="#1a1a2e" />
        <rect x="120" y="160" width="40" height="30" fill="#1a1a2e" />
        <rect x="30" y="30" width="10" height="10" fill="#15803D" />
        <rect x="130" y="30" width="10" height="10" fill="#15803D" />
        <rect x="170" y="20" width="10" height="10" fill="#15803D" />
        <rect x="100" y="70" width="10" height="10" fill="#16A34A" />
        <rect x="170" y="50" width="10" height="10" fill="#15803D" />
      </svg>
      <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "Outfit, sans-serif" }}>{ticket.id}</p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{ticket.telephone} • {ticket.type}</p>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{ticket.prix}</p>
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
        {[
          { value: String(totalVendus), label: "Billets vendus" },
          { value: String(totalDisponibles - totalVendus), label: "Disponibles" },
          { value: `${revenus.toLocaleString()} F`, label: "Revenus total" },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl text-center" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-accent)", marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["N° Billet", "Téléphone", "Type", "Prix", "Date achat", "Statut", "QR"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--color-text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>{t.id}</td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>{t.telephone}</td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>{t.type}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{t.prix}</td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>{t.date}</td>
                  <td className="px-4 py-3"><span className={`badge ${badgeClass[t.statut]}`}>{t.statut}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setQrTicket(t)} className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:scale-95" style={{ background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.25)", color: "var(--color-accent)" }}>
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
