import React from "react";
import { useNavigate } from "react-router-dom";

const ClockSvg = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ animation: "spin 4s linear infinite" }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    <circle cx="32" cy="32" r="28" stroke="url(#cg)" strokeWidth="3" fill="none" />
    <path d="M32 16v16l12 6" stroke="url(#cg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="32" r="4" fill="url(#cg)" />
    <defs><linearGradient id="cg" x1="0" y1="0" x2="64" y2="64"><stop stopColor="#6366F1" /><stop offset="1" stopColor="#FB923C" /></linearGradient></defs>
  </svg>
);

const steps = [
  { label: "Demande soumise", icon: "✓", done: true },
  { label: "En cours de validation", icon: "⏳", done: false, active: true },
  { label: "Compte activé", icon: "○", done: false },
];

const EnAttenteValidation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex items-center justify-center px-4 py-8 relative">
      <div className="orb-indigo" />
      <div className="orb-accent" />

      <div className="w-full max-w-lg" style={{ animation: "fadeInUp 0.4s ease-out" }}>
        <div className="glass-card p-10 sm:p-12 text-center">
          <div className="flex justify-center mb-6">
            <ClockSvg />
          </div>

          <h1 className="text-2xl font-bold gradient-text mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
            Demande soumise avec succès !
          </h1>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Votre demande est en cours de traitement.
          </p>

          <div className="p-4 rounded-xl text-sm text-left flex items-start gap-3 mb-8" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(255,255,255,0.8)" }}>
            <span>📱</span>
            <div>
              <p>Vous recevrez un SMS de confirmation sous 24h à votre numéro <strong style={{ color: "#fff" }}>+221XXXXXXXXX</strong>.</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-10 max-w-sm mx-auto">
            {steps.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                    background: s.done ? "rgba(34,197,94,0.2)" : s.active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    border: `2px solid ${s.done ? "#22C55E" : s.active ? "#6366F1" : "rgba(255,255,255,0.15)"}`,
                    color: s.done ? "#22C55E" : s.active ? "#6366F1" : "rgba(255,255,255,0.3)",
                    animation: s.active ? "pulse 2s infinite" : "none",
                  }}>
                    {s.icon}
                  </span>
                  <span className="text-xs max-w-[80px] text-center" style={{ color: s.done ? "rgba(255,255,255,0.6)" : s.active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px mx-2 mt-[-24px]" style={{ background: s.done ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <button onClick={() => navigate("/")} className="btn-ghost btn-md">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnAttenteValidation;
