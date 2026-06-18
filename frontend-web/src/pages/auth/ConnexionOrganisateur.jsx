import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import {
  connexionOrganisateur,
  connexionAdmin,
  connexionPartenaire,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Check, Shield, Lock, Sparkle } from "../../components/Icons";

const ConnexionOrganisateur = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAlert(null);
    try {
      const result = await connexionAdmin({
        email: data.email,
        motDePasse: data.motDePasse,
      });
      if (result.token && result.user) {
        login(result.user, result.token);
        navigate("/admin/dashboard");
        return;
      }
    } catch (_) {}

    try {
      const result = await connexionOrganisateur({
        email: data.email,
        motDePasse: data.motDePasse,
      });
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
      const result = await connexionPartenaire({
        email: data.email,
        motDePasse: data.motDePasse,
      });
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #EAF4EE 0%, #FAFAFA 50%, #FAFAFA 100%)" }}
    >
      {/* Cercles flottants décoratifs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 300,
            height: 300,
            background: "radial-gradient(circle, #15803D 0%, transparent 70%)",
            top: "-5%",
            right: "-5%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 200,
            height: 200,
            background: "radial-gradient(circle, #22C55E 0%, transparent 70%)",
            bottom: "10%",
            left: "-3%",
            animation: "float 8s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 150,
            height: 150,
            background: "radial-gradient(circle, #15803D 0%, transparent 70%)",
            top: "40%",
            left: "60%",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="min-h-screen flex relative z-10">
        {/* Panneau gauche desktop */}
        <div className="hidden lg:flex w-[40%] relative overflow-hidden items-center justify-center">
          <img
            src="/images/event-2.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.3) blur(2px)", transform: "scale(1.05)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#15803D]/85 via-[#15803D]/50 to-transparent" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(34,197,94,0.2) 0%, transparent 70%)" }} />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 text-center px-8 max-w-sm"
          >
            <img
              src="/images/logo.png"
              alt="SENGUICHET"
              className="h-20 w-auto mx-auto mb-4 drop-shadow-lg"
            />
            <p className="text-sm mb-8 text-white/70">
              Connectez-vous à votre espace SenGuichet.
            </p>
            <div className="space-y-3 text-left mx-auto max-w-[220px]">
              {[
                { icon: Shield, text: "Sécurisé" },
                { icon: Sparkle, text: "Rapide" },
                { icon: Lock, text: "Professionnel" },
              ].map((item, i) => (
                <motion.p
                  key={item.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="text-white/70 text-sm flex items-center gap-3"
                >
                  <item.icon size={16} style={{ color: "#86EFAC", flexShrink: 0 }} />
                  {item.text}
                </motion.p>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Panneau droit — formulaire */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[440px]"
          >
            {/* Logo mobile */}
            <motion.div variants={itemVariants} className="lg:hidden text-center mb-6">
              <img
                src="/images/logo.png"
                alt="SENGUICHET"
                className="h-36 w-auto mx-auto mb-2"
              />
              <p className="text-sm text-[#6B7280]">
                Billetterie en ligne tout événement
              </p>
            </motion.div>

            {/* Carte */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[#E2E8F0] p-8 sm:p-10"
            >
              {/* Logo dans carte (desktop) */}
              <div className="hidden lg:block text-center mb-6">
                <img
                  src="/images/logo.png"
                  alt="SENGUICHET"
                  className="h-40 w-auto mx-auto mb-1"
                />
                <p className="text-sm text-[#6B7280]">
                  Billetterie en ligne tout événement
                </p>
              </div>

              {alert && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5"
                >
                  <div
                    className="flex items-start gap-3 p-3 rounded-xl text-sm"
                    style={{
                      background:
                        alert.type === "success"
                          ? "#F0FDF4"
                          : alert.type === "warning"
                          ? "#FFFBEB"
                          : "#FEF2F2",
                      border:
                        alert.type === "success"
                          ? "1px solid #BBF7D0"
                          : alert.type === "warning"
                          ? "1px solid #FDE68A"
                          : "1px solid #FECACA",
                      color:
                        alert.type === "success"
                          ? "#166534"
                          : alert.type === "warning"
                          ? "#92400E"
                          : "#991B1B",
                    }}
                  >
                    {alert.type === "success" ? (
                      <Check size={16} className="mt-0.5 shrink-0" />
                    ) : alert.type === "warning" ? (
                      <span className="text-base shrink-0">⚡</span>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="mt-0.5 shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                    <span>{alert.message}</span>
                    <button
                      onClick={() => setAlert(null)}
                      className="ml-auto text-current opacity-50 hover:opacity-100 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <motion.div variants={itemVariants} className="mb-4">
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    {...register("email", {
                      required: "Email requis",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Email invalide",
                      },
                    })}
                    className="w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#111827] placeholder-[#9CA3AF] transition-all outline-none"
                    style={{
                      borderColor: errors.email ? "#DC2626" : "#E5E7EB",
                      boxShadow: errors.email ? "0 0 0 3px rgba(220,38,38,0.1)" : "none",
                    }}
                    onFocus={(e) => {
                      if (!errors.email) e.target.style.borderColor = "#15803D";
                      if (!errors.email)
                        e.target.style.boxShadow = "0 0 0 3px rgba(21,128,61,0.1)";
                    }}
                    onBlur={(e) => {
                      if (!errors.email) e.target.style.borderColor = "#E5E7EB";
                      if (!errors.email) e.target.style.boxShadow = "none";
                    }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
                  )}
                </motion.div>

                {/* Mot de passe */}
                <motion.div variants={itemVariants} className="mb-2">
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Votre mot de passe"
                      {...register("motDePasse", { required: "Mot de passe requis" })}
                      className="w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#111827] placeholder-[#9CA3AF] transition-all outline-none pr-10"
                      style={{
                        borderColor: errors.motDePasse ? "#DC2626" : "#E5E7EB",
                        boxShadow: errors.motDePasse
                          ? "0 0 0 3px rgba(220,38,38,0.1)"
                          : "none",
                      }}
                      onFocus={(e) => {
                        if (!errors.motDePasse)
                          e.target.style.borderColor = "#15803D";
                        if (!errors.motDePasse)
                          e.target.style.boxShadow =
                            "0 0 0 3px rgba(21,128,61,0.1)";
                      }}
                      onBlur={(e) => {
                        if (!errors.motDePasse)
                          e.target.style.borderColor = "#E5E7EB";
                        if (!errors.motDePasse)
                          e.target.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                      tabIndex={-1}
                    >
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {errors.motDePasse && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {errors.motDePasse.message}
                    </p>
                  )}
                </motion.div>

                {/* Options */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between mt-2 mb-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="sr-only" />
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[8px] border transition-colors"
                      style={{ borderColor: "#D1D5DB" }}
                    >
                    </span>
                    <span className="text-xs text-[#6B7280]">Se souvenir de moi</span>
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[#15803D] hover:text-[#166534] font-medium transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </motion.div>

                {/* Bouton */}
                <motion.div variants={itemVariants}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isLoading
                        ? "#15803D"
                        : "linear-gradient(135deg, #15803D 0%, #166534 100%)",
                      boxShadow: isLoading
                        ? "none"
                        : "0 4px 16px rgba(21,128,61,0.3)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 8px 24px rgba(21,128,61,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 16px rgba(21,128,61,0.3)";
                      }
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            opacity="0.25"
                          />
                          <path
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            fill="currentColor"
                            opacity="0.75"
                          />
                        </svg>
                        Connexion...
                      </span>
                    ) : (
                      "Se connecter"
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Lien inscription */}
              <motion.p
                variants={itemVariants}
                className="text-center mt-6 text-sm text-[#6B7280]"
              >
                Pas encore de compte ?{" "}
                <Link
                  to="/inscription"
                  className="font-semibold text-[#15803D] hover:text-[#166534] transition-colors"
                >
                  S'inscrire
                </Link>
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConnexionOrganisateur;
