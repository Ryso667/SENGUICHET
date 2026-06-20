import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4 relative">


      <div className="text-center" style={{ animation: "fadeInUp 0.4s ease-out" }}>
        <p className="text-[8rem] sm:text-[10rem] font-bold text-accent leading-none mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>
          403
        </p>
        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
          Accès refusé
        </h1>
        <p className="text-sm mb-10 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Vous n'avez pas les permissions pour accéder à cette page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-md">
            ← Retour
          </button>
          <button onClick={() => navigate("/connexion")} className="btn-primary btn-md">
            Se reconnecter
          </button>
        </div>
      </div>
    </div></motion.div>
  );
};

export default Unauthorized;
