import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { connexionOrganisateur, connexionAdmin, connexionPartenaire } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import AlertMessage from "../../components/AlertMessage";
import logo from "../../assets/logo.jpg";
import { Check } from "../../components/Icons";

const ConnexionOrganisateur = () => {
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
        return;
      }
    } catch (_) {}

    try {
      const result = await connexionOrganisateur({ email: data.email, motDePasse: data.motDePasse });
      if (result.token && result.user) {
        login(result.user, result.token);
        navigate("/dashboard");
        return;
      }
      if (result.message?.includes("EN_ATTENTE")) {
        setAlert({ message: "Compte en attente de validation", type: "warning" });
        setIsLoading(false);
        return;
      }
    } catch (_) {}

    try {
      const result = await connexionPartenaire({ email: data.email, motDePasse: data.motDePasse });
      if (result.token && result.user) {
        login(result.user, result.token);
        navigate("/dashboard");
        return;
      }
      setAlert({ message: "Email ou mot de passe incorrect", type: "error" });
    } catch (err) {
      setAlert({ message: err.message || "Email ou mot de passe incorrect", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <div className="hidden lg:flex w-[40%] relative overflow-hidden items-center justify-center">
        <img src="/images/event-2.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.25) blur(3px)", transform: "scale(1.08)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A]/90 via-[#0D1B2A]/50 to-transparent" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(0,200,255,0.15) 0%, transparent 70%)" }} />
        <div className="relative z-10 text-center px-8 max-w-sm" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <img src={logo} alt="SENGUICHET" style={{ height: 90, width: "auto", display: "block", margin: "0 auto 16px" }} />
          <p className="text-sm mb-8" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Connectez-vous à votre espace SenGuichet.</p>
          <div className="space-y-3 text-left mx-auto max-w-[220px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {["Sécurisé", "Rapide", "Professionnel"].map((item, i) => (
              <p key={item} className="text-white/60 text-sm flex items-center gap-3" style={{ animation: `slideInLeft 0.4s ease-out ${0.3 + i * 0.15}s both` }}><Check size={14} style={{ flexShrink: 0 }} /> {item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto">
        <div className="orb-indigo" />
        <div className="orb-accent" />

        <div className="w-full max-w-[440px]" style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <div className="lg:hidden text-center mb-6">
            <img src={logo} alt="SENGUICHET" style={{ height: 50, width: "auto", display: "block", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Billetterie en ligne tout événement</p>
          </div>

          <div className="glass-card p-8 sm:p-10">
            <div className="text-center mb-6" style={{ marginTop: "-0.5rem" }}>
              <img src={logo} alt="SENGUICHET" style={{ height: 80, width: "auto", display: "block", margin: "0 auto" }} />
              <p className="text-sm mt-2" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Billetterie en ligne tout événement</p>
            </div>
            {alert && <div className="mb-4"><AlertMessage message={alert.message} type={alert.type} dismissible /></div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ animation: "fadeInUp 0.3s ease-out 0.15s both" }}>
                <InputField label="Email" name="email" type="email" icon="✉️" placeholder="exemple@email.com" register={register} errors={errors} rules={{ required: "Email requis", pattern: { value: /^\S+@\S+$/i, message: "Email invalide" } }} />
              </div>

              <div style={{ animation: "fadeInUp 0.3s ease-out 0.23s both" }}>
                <InputField label="Mot de passe" name="motDePasse" type={showPwd ? "text" : "password"} icon="🔒" placeholder="Votre mot de passe" register={register} errors={errors} rules={{ required: "Mot de passe requis" }} />
                <div className="flex items-center justify-between mt-[-4px] mb-2">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <input type="checkbox" className="sr-only" />
                    <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] border" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Se souvenir de moi</span>
                  </label>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <button type="button" className="text-xs hover:underline" style={{ color: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mot de passe oublié ?</button>
              </div>

              <div style={{ animation: "fadeInUp 0.3s ease-out 0.31s both" }}>
                <Button type="submit" isLoading={isLoading}>Se connecter</Button>
              </div>
            </form>

            <p className="text-center mt-6 text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnexionOrganisateur;
