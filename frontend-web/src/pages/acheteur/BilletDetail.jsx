import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Ticket, MapPin, Calendar, Download } from "lucide-react";
import TicketQR from "../../components/TicketQR";

const formatDateLong = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return isoString; }
};

export default function BilletDetail() {
  const { uuid } = useParams();
  const [billet, setBillet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    (async () => {
      try {
        const email = localStorage.getItem("@senguichet_acheteur_email");
        if (!email) throw new Error("Non connecté");
        const res = await fetch(`${API_URL}/api/billets/mes-billets?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur");
        const found = (Array.isArray(data) ? data : data.billets || []).find(b => b.uuid === uuid);
        if (!found) throw new Error("Billet introuvable");
        setBillet(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [uuid, API_URL]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>;
  if (error || !billet) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Ticket size={48} style={{ color: "#94a3b8" }} />
      <p style={{ color: "#64748B" }}>{error || "Billet introuvable"}</p>
      <Link to="/acheteur/mes-billets" style={{ color: "#15803D" }}>Mes billets</Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F0F4F8" }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#FFFFFF" }}>
          <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, #15803D, #166534)" }}>
            <h1 className="text-white font-bold text-xl mb-1">{billet.evenement_titre || billet.evenement_nom || "Événement"}</h1>
            <p className="text-white/70 text-sm">{billet.categorie_nom}</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#475569" }}>
              <Calendar size={14} />
              {formatDateLong(billet.date_debut)}
            </div>
            {billet.evenement_lieu && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#475569" }}>
                <MapPin size={14} /> {billet.evenement_lieu}
              </div>
            )}
            <div className="flex justify-between text-sm py-2 border-t" style={{ borderColor: "#E8EEF4", color: "#475569" }}>
              <span>Réf : {billet.numero}</span>
              <span className="font-bold" style={{ color: "#15803D" }}>{billet.prix_paye?.toLocaleString("fr-FR")} CFA</span>
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-center">
            <TicketQR qrPayload={billet.qr_data || billet.payload_signature || "{}"} />
          </div>
          <div className="px-6 pb-4 text-center" style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
            {billet.statut === "ACTIF" ? "Billet valide — à présenter à l'entrée" : `Statut : ${billet.statut}`}
          </div>
        </div>
        <button onClick={() => window.open(`${API_URL}/api/billets/${uuid}`, "_blank")}
          className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "#15803D", border: "none", cursor: "pointer" }}>
          <Download size={18} /> Télécharger le billet (PDF)
        </button>
        <Link to="/acheteur/mes-billets"
          className="flex items-center justify-center gap-1 mt-3 text-sm font-medium"
          style={{ color: "#64748B", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Retour à mes billets
        </Link>
      </div>
    </motion.div>
  );
}
