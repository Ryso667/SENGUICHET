import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Ticket, Download } from "lucide-react";
import TicketQR from "../../components/TicketQR";
import API_URL from "../../config/api";

const formatDateLong = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return isoString; }
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  } catch { return isoString; }
};

const formatHeure = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch { return isoString; }
};

export default function BilletDetail() {
  const { uuid } = useParams();
  const [billet, setBillet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const statut = (billet.statut || "").toLowerCase();
  const isUsed = statut === "utilise";
  const isExpired = statut === "expire";
  const showWatermark = isUsed || isExpired;
  const watermarkLabel = isExpired ? "EXPIRÉ" : "UTILISÉ";
  const watermarkColor = isExpired ? "#FF4D6D" : "#66BB6A";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F0F4F8" }}>
      <div className="w-full max-w-sm">
        {/* Carte ticket */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#FFFFFF", position: "relative" }}>

          {/* ===== HEADER ===== */}
          <div style={{ background: "#065F46", padding: "28px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: 70, background: "rgba(6,95,70,0.3)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, background: "rgba(245,158,11,0.12)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <img src="/images/logo.png" alt="S" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.7)" }}>SENGUICHET</span>
            </div>
            <div style={{ height: 1, background: "#F59E0B", opacity: 0.5, margin: "0 0 16px" }} />
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.3, margin: 0 }}>
              {(billet.evenement_titre || billet.evenement_nom || "Événement").toUpperCase()}
            </h1>
            <div style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", borderRadius: 999, padding: "4px 14px", marginTop: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#F59E0B" }}>
                {(billet.categorie_nom || "STANDARD").toUpperCase()}
              </span>
            </div>
          </div>

          {/* ===== PERFORATION HAUTE ===== */}
          <div style={{ height: 24, position: "relative", background: "linear-gradient(to bottom, #065F46, #F9F6EE)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", left: 22, right: 22, borderTop: "2px dashed rgba(6,95,70,0.2)" }} />
            <div style={{ position: "absolute", left: -12, top: "50%", marginTop: -12, width: 24, height: 24, borderRadius: 12, background: "#F0F4F8", zIndex: 2 }} />
            <div style={{ position: "absolute", right: -12, top: "50%", marginTop: -12, width: 24, height: 24, borderRadius: 12, background: "#F0F4F8", zIndex: 2 }} />
          </div>

          {/* ===== CORPS ===== */}
          <div style={{ background: "#F9F6EE", padding: "24px 24px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#6EE7B7", margin: "0 0 4px" }}>DATE</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                  {formatDate(billet.date_debut)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#6EE7B7", margin: "0 0 4px" }}>HEURE</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                  {formatHeure(billet.date_debut)}
                </p>
              </div>
            </div>
            {billet.evenement_lieu && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#6EE7B7", margin: "0 0 4px" }}>LIEU</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6EE7B7", letterSpacing: 0.5, margin: 0 }}>
                  {billet.evenement_lieu.toUpperCase()}
                </p>
              </div>
            )}
            <div style={{ height: 1, background: "rgba(17,24,39,0.08)", margin: "18px 0" }} />
            <p style={{ fontSize: 9, color: "#6EE7B7", letterSpacing: 2, textAlign: "center", margin: "0 0 6px" }}>
              REF · {billet.numero}
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <TicketQR qrPayload={billet.qr_data || billet.payload_signature || "{}"} />
            </div>
          </div>

          {/* ===== PERFORATION BASSE ===== */}
          <div style={{ height: 24, position: "relative", background: "linear-gradient(to bottom, #F9F6EE, #F0EAD6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", left: 22, right: 22, borderTop: "2px dashed rgba(6,95,70,0.2)" }} />
            <div style={{ position: "absolute", left: -12, top: "50%", marginTop: -12, width: 24, height: 24, borderRadius: 12, background: "#F0F4F8", zIndex: 2 }} />
            <div style={{ position: "absolute", right: -12, top: "50%", marginTop: -12, width: 24, height: 24, borderRadius: 12, background: "#F0F4F8", zIndex: 2 }} />
          </div>

          {/* ===== FOOTER ===== */}
          <div style={{ background: "#F0EAD6", padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}>
            <div style={{ background: "#065F46", borderRadius: 999, padding: "6px 24px" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: "#F59E0B" }}>
                {(billet.categorie_nom || "STANDARD").toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: -0.5, margin: 0 }}>
              {billet.prix_paye?.toLocaleString("fr-FR") || "0"} CFA
            </p>
            <p style={{ fontSize: 9, color: "#6EE7B7", fontStyle: "italic", margin: 0 }}>
              Entrée unique et non transférable
            </p>
            <p style={{ fontSize: 8, color: "rgba(17,24,39,0.25)", letterSpacing: 3, alignSelf: "flex-end", margin: "4px 0 0" }}>
              SENGUICHET
            </p>
          </div>

          {/* Watermark */}
          {showWatermark && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 5 }}>
              <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: 8, opacity: 0.12, transform: "rotate(-30deg)", color: watermarkColor }}>
                {watermarkLabel}
              </span>
            </div>
          )}
        </div>

        {/* Bouton télécharger */}
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
