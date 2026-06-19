import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, XCircle, ArrowRight, Smartphone, Ticket } from "lucide-react";
import { acheterBillet } from "../services/billetService";
import { statutPaiement } from "../services/paiementService";

export default function PaiementModal({ open, onClose, evenementId, categories, titre }) {
  const navigate = useNavigate();
  const [telephone, setTelephone] = useState("+221 ");
  const [email, setEmail] = useState(() => localStorage.getItem("@senguichet_acheteur_email") || "");
  const [etape, setEtape] = useState("form"); // form | pending | success | failed
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [totalAchetes, setTotalAchetes] = useState(0);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setEtape("form");
      setError(null);
      setTelephone("+221 ");
      setEmail(localStorage.getItem("@senguichet_acheteur_email") || "");
      setProgress({ current: 0, total: 0 });
      setTotalAchetes(0);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [open]);

  const handlePayer = async () => {
    const tel = telephone.replace(/\s/g, "");
    if (tel.length < 9) { setError("Numéro invalide"); return; }
    setEtape("pending"); setError(null);
    setProgress({ current: 0, total: categories.length });
    let achetes = 0;

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      setProgress({ current: i + 1, total: categories.length });
      try {
        const result = await acheterBillet({
          evenementId,
          categorieTicketId: cat.id,
          telephone: tel,
          quantite: cat.quantite,
          provider: "WAVE",
          email: email || undefined,
        });
        if (result.paiement?.redirectUrl) {
          if (i === 0) window.open(result.paiement.redirectUrl, "_blank");
          let attempts = 0;
          const paid = await new Promise((resolve) => {
            pollingRef.current = setInterval(async () => {
              attempts++;
              try {
                const s = await statutPaiement(result.paiement.reference);
                if (s.statut === "SUCCESS") {
                  clearInterval(pollingRef.current);
                  resolve(true);
                } else if (s.statut === "FAILED" || attempts > 60) {
                  clearInterval(pollingRef.current);
                  resolve(false);
                }
              } catch { if (attempts > 60) { clearInterval(pollingRef.current); resolve(false); } }
            }, 3000);
          });
          if (!paid) { setEtape("failed"); setError(`Paiement échoué pour ${cat.nom}`); return; }
        }
        achetes += cat.quantite;
      } catch (err) {
        setEtape("failed");
        setError(`${err.message} — ${cat.nom}`);
        return;
      }
    }
    setTotalAchetes(achetes);
    setEtape("success");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => etape !== "pending" && onClose()}>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="rounded-2xl border shadow-xl p-6 sm:p-8 relative w-full max-w-md"
            style={{ background: "#FFFFFF", borderColor: "#E8EEF4" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 p-1" style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
              <X size={18} />
            </button>

            {etape === "form" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(21,128,61,0.1)" }}>
                    <Smartphone size={26} style={{ color: "#15803D" }} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Paiement Wave</h2>
                  <p className="text-sm mt-1" style={{ color: "#64748B" }}>{titre}</p>
                  <div className="mt-3 space-y-1 text-xs" style={{ color: "#475569" }}>
                    {categories.map(c => (
                      <div key={c.id} className="flex justify-between px-2">
                        <span>{c.nom} × {c.quantite}</span>
                        <span className="font-medium" style={{ color: "#15803D" }}>{(c.prix * c.quantite).toLocaleString("fr-FR")} CFA</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#334155" }}>
                    Numéro Wave
                  </label>
                  <input type="tel" value={telephone}
                    onChange={e => setTelephone(e.target.value.replace(/[^\d\s+]/g, "").slice(0, 18))}
                    placeholder="+221 XX XXX XX XX"
                    className="w-full px-4 py-3 rounded-xl text-sm border"
                    style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                    onKeyDown={e => e.key === "Enter" && handlePayer()} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#334155" }}>
                    Email (pour recevoir vos billets)
                  </label>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm border"
                    style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                    onKeyDown={e => e.key === "Enter" && handlePayer()} />
                </div>
                <button onClick={handlePayer}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: "#15803D", border: "none", cursor: "pointer" }}>
                  Payer avec Wave <ArrowRight size={18} />
                </button>
                {error && <p className="text-sm mt-3 text-center font-medium" style={{ color: "#EF4444" }}>{error}</p>}
              </>
            )}

            {etape === "pending" && (
              <div className="text-center py-8">
                <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "#15803D" }} />
                <p className="font-medium" style={{ color: "#1a1a1a" }}>
                  Achat {progress.current}/{progress.total}
                </p>
                <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                  {categories[progress.current - 1]?.nom} — {categories[progress.current - 1]?.quantite} billet(s)
                </p>
              </div>
            )}

            {etape === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,128,61,0.1)" }}>
                  <CheckCircle size={32} style={{ color: "#15803D" }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Achat réussi !</h2>
                <p className="text-sm mt-2 mb-4" style={{ color: "#64748B" }}>
                  {totalAchetes} billet{totalAchetes > 1 ? "s" : ""} acheté{totalAchetes > 1 ? "s" : ""} avec succès.
                </p>
                <button onClick={() => { onClose(); navigate("/acheteur/mes-billets"); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#15803D", border: "none", cursor: "pointer" }}>
                  Voir mes billets
                </button>
              </div>
            )}

            {etape === "failed" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <XCircle size={32} style={{ color: "#EF4444" }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Paiement échoué</h2>
                <p className="text-sm mt-2 mb-4" style={{ color: "#64748B" }}>{error || "Une erreur est survenue."}</p>
                <button onClick={() => setEtape("form")}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#15803D", border: "none", cursor: "pointer" }}>
                  Réessayer
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
