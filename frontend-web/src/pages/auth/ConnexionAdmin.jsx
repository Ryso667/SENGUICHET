import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { connexionAdmin } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import AlertMessage from "../../components/AlertMessage";

const ConnexionAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAlert(null);
    try {
      const result = await connexionAdmin({ email: data.email, motDePasse: data.motDePasse });
      if (result.token && result.user) {
        login(result.user, result.token);
        navigate("/admin/dashboard");
      } else {
        setAlert({ message: result.message || "Email ou mot de passe incorrect", type: "error" });
      }
    } catch (err) {
      setAlert({ message: err.message || "Email ou mot de passe incorrect", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <div className="hidden lg:flex w-[40%] relative overflow-hidden items-center justify-center">
        <img src="/images/event-1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.25) blur(3px)", transform: "scale(1.08)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0B1A]/90 via-[#0A0B1A]/50 to-transparent" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(251,146,60,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 text-center px-8 max-w-sm" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #FB923C, #EF4444)", boxShadow: "0 8px 30px rgba(251,146,60,0.3)" }}>
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, background: "linear-gradient(135deg, #FB923C, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SenGuichet</p>
          <p className="text-white/80 text-sm mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Espace d'administration de la plateforme SenGuichet.</p>
          <div className="space-y-3 text-left mx-auto max-w-[220px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {["Sécurisé", "Rapide", "Professionnel"].map((item, i) => (
              <p key={item} className="text-white/60 text-sm flex items-center gap-3" style={{ animation: `slideInLeft 0.4s ease-out ${0.3 + i * 0.15}s both` }}><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>✓</span> {item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto">
        <div className="orb-indigo" style={{ opacity: 0.35 }} />
        <div className="orb-accent" style={{ opacity: 0.3 }} />

        <div className="w-full max-w-[440px]" style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <div className="lg:hidden text-center mb-6">
            <p className="text-3xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SenGuichet</p>
          </div>

          <div className="glass-card p-8 sm:p-10 relative">
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FB923C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Administration
            </span>

            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, background: "linear-gradient(135deg, #FB923C, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Accès Administrateur
            </h1>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Espace réservé à l'équipe SenGuichet</p>

            {alert && <div className="mb-4"><AlertMessage message={alert.message} type={alert.type} dismissible /></div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ animation: "fadeInUp 0.3s ease-out 0.15s both" }}>
                <InputField label="Email" name="email" type="email" icon="✉️" placeholder="admin@senguichet.sn" register={register} errors={errors} rules={{ required: "Email requis", pattern: { value: /^\S+@\S+$/i, message: "Email invalide" } }} />
              </div>

              <div style={{ animation: "fadeInUp 0.3s ease-out 0.23s both" }}>
                <InputField label="Mot de passe" name="motDePasse" type={showPwd ? "text" : "password"} icon="🔒" placeholder="Votre mot de passe" register={register} errors={errors} rules={{ required: "Mot de passe requis" }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-xs mt-[-4px] mb-2 block ml-auto" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="mt-6" style={{ animation: "fadeInUp 0.3s ease-out 0.31s both" }}>
                <Button type="submit" isLoading={isLoading}>Accéder au panel</Button>
              </div>
            </form>

            <p className="text-center mt-6 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Link to="/connexion" className="hover:underline" style={{ color: "rgba(255,255,255,0.4)" }}>← Retour connexion organisateur</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnexionAdmin;
