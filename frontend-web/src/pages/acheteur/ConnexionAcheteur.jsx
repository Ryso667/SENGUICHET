import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConnexionAcheteur() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connecterAcheteurOTP, isAuthenticated } = useAuth();

  const [etape, setEtape] = useState(1);
  const [email, setEmail] = useState(() => localStorage.getItem("@senguichet_acheteur_email_suggestion") || "");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [succesEmail, setSuccesEmail] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from || "/acheteur/accueil", { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const envoyerCode = async () => {
    if (!EMAIL_REGEX.test(email)) { setError("Email invalide"); return; }
    setLoading(true); setError(null);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${BASE_URL}/api/auth/acheteur/envoyer-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de l'envoi");
      setSuccesEmail(true);
      setCooldown(60);
      setTimeout(() => { setEtape(2); setSuccesEmail(false); }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifierCode = async () => {
    if (code.length !== 6) { setError("Code à 6 chiffres"); return; }
    setLoading(true); setError(null);
    try {
      await connecterAcheteurOTP(email, code);
    } catch (err) {
      setError("Identifiant ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl shadow-xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E8EEF4" }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,128,61,0.1)" }}>
              {etape === 1 ? <Mail size={28} style={{ color: "#15803D" }} /> : <Lock size={28} style={{ color: "#15803D" }} />}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
              {etape === 1 ? "Connexion" : "Vérification"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              {etape === 1
                ? "Reçois un code par email pour te connecter"
                : `Un code à 6 chiffres a été envoyé à ${email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {etape === 1 ? (
              <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#334155" }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm border transition-all"
                    style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a" }}
                    onKeyDown={e => e.key === "Enter" && envoyerCode()} />
                </div>
                {succesEmail ? (
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#15803D" }}>
                    <CheckCircle size={18} /> Code envoyé !
                  </div>
                ) : (
                  <button onClick={envoyerCode} disabled={loading || !email}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: loading ? "#94a3b8" : "#15803D", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    {loading ? "Envoi..." : "Envoyer le code"}
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#334155" }}>Code à 6 chiffres</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl text-sm border transition-all text-center text-2xl tracking-widest"
                    style={{ borderColor: "#E8EEF4", background: "#F8FAFC", color: "#1a1a1a", letterSpacing: "0.5em" }}
                    onKeyDown={e => e.key === "Enter" && verifierCode()} />
                </div>
                <button onClick={verifierCode} disabled={loading || code.length !== 6}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mb-3"
                  style={{ background: loading ? "#94a3b8" : "#15803D", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {loading ? "Vérification..." : "Confirmer"}
                </button>
                <button onClick={() => { if (cooldown === 0) { setCode(""); envoyerCode(); } }}
                  disabled={cooldown > 0}
                  className="w-full text-sm font-medium transition-all"
                  style={{ color: cooldown > 0 ? "#94a3b8" : "#15803D", background: "none", border: "none", cursor: cooldown > 0 ? "not-allowed" : "pointer" }}>
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code"}
                </button>
                <button onClick={() => { setEtape(1); setError(null); }}
                  className="w-full text-sm mt-2 flex items-center justify-center gap-1"
                  style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={14} /> Modifier l'email
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm mt-4 text-center font-medium" style={{ color: "#EF4444" }}>
              {error}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
