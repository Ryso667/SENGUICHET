import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { inscriptionOrganisateur } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import AlertMessage from "../../components/AlertMessage";

const strengthConfig = [
  { label: "Faible", color: "#EF4444", segments: 1 },
  { label: "Moyen", color: "#F59E0B", segments: 2 },
  { label: "Fort", color: "#22C55E", segments: 3 },
  { label: "Très fort", color: "#22C55E", segments: 4 },
];

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const fields = [
  { label: "Nom complet", name: "nom", type: "text", icon: "👤", placeholder: "Votre nom", rules: { required: "Nom requis", minLength: { value: 2, message: "Minimum 2 caractères" } } },
  { label: "Téléphone", name: "telephone", type: "tel", icon: "📱", placeholder: "+221XXXXXXXXX", rules: { required: "Téléphone requis", pattern: { value: /^\+221[0-9]{9}$/, message: "Format requis : +221XXXXXXXXX" } } },
  { label: "Email", name: "email", type: "email", icon: "✉️", placeholder: "exemple@email.com", rules: { required: "Email requis", pattern: { value: /^\S+@\S+$/i, message: "Email invalide" } } },
];

const InscriptionOrganisateur = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register, handleSubmit, getValues, watch, formState: { errors } } = useForm();

  const password = watch("motDePasse", "");
  const strength = getPasswordStrength(password);
  const strengthInfo = strengthConfig[Math.min(strength, 3)] || strengthConfig[0];

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAlert(null);
    try {
      const result = await inscriptionOrganisateur({
        nom: data.nom, telephone: data.telephone, email: data.email, motDePasse: data.motDePasse,
      });
      if (result.token && result.user) {
        login(result.user, result.token);
        navigate("/dashboard");
      } else {
        setAlert({ message: result.message || "Erreur lors de l'inscription", type: "error" });
      }
    } catch (err) {
      setAlert({ message: err.message || "Erreur lors de l'inscription", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <div className="hidden lg:flex w-[40%] relative overflow-hidden items-center justify-center">
        <img src="/images/event-3.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.25) blur(3px)", transform: "scale(1.08)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0B1A]/90 via-[#0A0B1A]/50 to-transparent" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(251,146,60,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 text-center px-8 max-w-sm" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--gradient)", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}>
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SenGuichet</p>
          <p className="text-white/80 text-sm mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rejoignez la billetterie qui connecte les événements sénégalais.</p>
          <div className="space-y-3 text-left mx-auto max-w-[220px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {["Sécurisé", "Rapide", "Professionnel"].map((item, i) => (
              <p key={item} className="text-white/60 text-sm flex items-center gap-3" style={{ animation: `slideInLeft 0.4s ease-out ${0.3 + i * 0.15}s both` }}><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>✓</span> {item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto">
        <div className="orb-indigo" />

        <div className="orb-accent" />
        <div className="w-full max-w-[440px]" style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <div className="lg:hidden text-center mb-6">
            <p className="text-3xl font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SenGuichet</p>
          </div>

          <div className="glass-card p-8 sm:p-10">
            <h1 className="text-2xl font-bold gradient-text mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Créer votre compte</h1>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Créez votre compte et commencez à organiser</p>

            {alert && <div className="mb-4"><AlertMessage message={alert.message} type={alert.type} dismissible /></div>}

            <form onSubmit={handleSubmit(onSubmit)}>
              {fields.map((f, i) => (
                <div key={f.name} style={{ animation: `fadeInUp 0.3s ease-out ${0.15 + i * 0.08}s both` }}>
                  <InputField label={f.label} name={f.name} type={f.type} icon={f.icon} placeholder={f.placeholder} register={register} errors={errors} rules={f.rules} />
                </div>
              ))}

              <div style={{ animation: "fadeInUp 0.3s ease-out 0.39s both" }}>
                <InputField label="Mot de passe" name="motDePasse" type={showPwd ? "text" : "password"} icon="🔒" placeholder="Minimum 8 caractères" register={register} errors={errors} rules={{ required: "Mot de passe requis", minLength: { value: 8, message: "Minimum 8 caractères" } }} />
                <div className="flex items-center gap-2 mb-4 mt-[-8px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {password && (
                    <>
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((s) => (
                          <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: s <= strength ? strengthInfo.color : "rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
                    </>
                  )}
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ animation: "fadeInUp 0.3s ease-out 0.47s both" }}>
                <InputField label="Confirmer le mot de passe" name="confirmerMotDePasse" type={showConfirm ? "text" : "password"} icon="🔒" placeholder="Répétez le mot de passe" register={register} errors={errors} rules={{ required: "Confirmation requise", validate: (v) => v === getValues("motDePasse") || "Les mots de passe ne correspondent pas" }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-xs mt-[-8px] mb-2 block ml-auto" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="mt-6" style={{ animation: "fadeInUp 0.3s ease-out 0.55s both" }}>
                <Button type="submit" isLoading={isLoading}>Créer mon compte</Button>
              </div>
            </form>

            <p className="text-center mt-6 text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Déjà un compte ?{" "}
              <Link to="/connexion" className="font-medium hover:underline" style={{ color: "#6366F1" }}>Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionOrganisateur;
