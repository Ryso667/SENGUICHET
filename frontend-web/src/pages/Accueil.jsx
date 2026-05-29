import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const steps = [
  {
    num: "01",
    title: "Soumettez votre demande",
    desc: "Créez votre compte, notre équipe valide sous 24h.",
    img: "/images/event-1.jpg",
  },
  {
    num: "02",
    title: "Créez votre événement",
    desc: "Configurez vos billets, catégories, tarifs et capacité.",
    img: "/images/event-2.jpg",
  },
  {
    num: "03",
    title: "Vendez et gérez",
    desc: "Suivez vos ventes, scannez les entrées, analysez les stats.",
    img: "/images/event-3.jpg",
  },
];

const features = [
  { icon: "🎟", title: "Création d'événements", desc: "Formulaire complet : nom, date, lieu, catégorie, capacité, affiche." },
  { icon: "📊", title: "Tableau de bord analytique", desc: "Billets vendus, revenus en temps réel, taux de remplissage, courbe des ventes." },
  { icon: "🧑‍🤝‍🧑", title: "Gestion de l'équipe", desc: "Ajoutez des contrôleurs avec un code d'accès unique par événement." },
  { icon: "📱", title: "QR codes sécurisés", desc: "Chaque billet génère un QR unique. Scan via app mobile par vos contrôleurs." },
  { icon: "❌", title: "Annulation & remboursement", desc: "Annulez un événement et déclenchez les remboursements via Wave/Orange Money." },
  { icon: "🔔", title: "Notifications SMS", desc: "Vos acheteurs reçoivent une confirmation SMS automatique." },
];

const smartTicketPoints = [
  "QR code infalsifiable",
  "Envoi SMS instantané",
  "Validation offline possible",
];

const stats = [
  { value: "500+", label: "Événements organisés" },
  { value: "12 000+", label: "Billets vendus" },
  { value: "24h", label: "Délai de validation" },
  { value: "100%", label: "Paiements sécurisés" },
];

const Accueil = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0B1A]">
      <div className="orb-indigo" />
      <div className="orb-accent" />
      <div className="orb-3" />

      <Navbar />

      {/* SECTION 1 — HERO */}
      <section className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden" style={{ marginTop: "-73px", paddingTop: "73px" }}>
        <div className="hero-image-wrapper">
          <img src="/images/hero-bg.jpg" alt="Festival background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B1A]/80 via-[#0A0B1A]/50 to-[#0A0B1A]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(251,146,60,0.1) 0%, transparent 60%)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 sm:mb-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(99,102,241,0.4)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              animation: "pulse-glow 3s infinite",
            }}
          >
            <span>🇸🇳</span>
            <span className="gradient-text" style={{ fontWeight: 600 }}>La billetterie événementielle du Sénégal</span>
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 leading-[1.1]" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, animation: "fadeInUp 0.8s ease-out" }}>
            Gérez vos événements.
          </h1>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1]" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, animation: "fadeInUp 1s ease-out" }}>
            <span className="shimmer-text">Vendez vos billets.</span>
          </h1>

          <p className="text-base md:text-lg mb-4 max-w-xl" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Plus Jakarta Sans', sans-serif", animation: "fadeInUp 1.2s ease-out" }}>
            La plateforme tout-en-un pensée pour les organisateurs professionnels au Sénégal. Créez, vendez et analysez en temps réel.
          </p>

          <div className="flex items-center gap-4 mb-8" style={{ animation: "fadeInUp 1.25s ease-out" }}>
            {["Wave", "Orange Money", "Carte bancaire"].map((p) => (
              <span key={p} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p}</span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto" style={{ animation: "fadeInUp 1.4s ease-out" }}>
            <button onClick={() => navigate("/inscription")} className="btn-primary btn-lg sm:w-auto w-full" style={{ padding: "16px 40px" }}>
              Créer mon compte
            </button>
            <button onClick={() => navigate("/connexion")} className="btn-ghost btn-lg sm:w-auto w-full" style={{ padding: "16px 40px" }}>
              Se connecter
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8" style={{ animation: "fadeInUp 1.5s ease-out" }}>
            {["500+ événements", "12 000+ billets", "Wave & Orange Money"].map((m) => (
              <span key={m} className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✦ {m}</span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ color: "rgba(255,255,255,0.3)", animation: "float 2.5s ease-in-out infinite" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* SECTION 2 — COMMENT ÇA MARCHE */}
      <section className="py-20 sm:py-28 px-4 relative" id="how">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Comment ça marche</span>
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Organisez comme un pro <span className="gradient-text">en 3 étapes</span>
            </h2>
            <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              De l'inscription à l'analyse, tout est conçu pour les organisateurs exigeants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="img-card group" style={{ minHeight: 320, animation: `fadeInUp ${0.4 + i * 0.2}s ease-out both` }}>
                <img src={step.img} alt={step.title} className="img-card-img" />
                <div className="img-card-overlay" />
                <div className="img-card-content p-8 flex flex-col justify-end h-full min-h-[320px]">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif", background: "var(--gradient)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — FONCTIONNALITÉS */}
      <section className="py-20 sm:py-28 px-4 relative overflow-hidden" style={{ background: "#080914" }} id="features">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "rgba(99,102,241,0.05)", filter: "blur(100px)" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fonctionnalités</span>
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Une plateforme complète pensée pour les organisateurs professionnels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <div key={feat.title} className="glass-card-hover p-6 flex items-start gap-4" style={{ animation: `fadeInUp ${0.3 + i * 0.08}s ease-out both` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{ background: "rgba(99,102,241,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(99,102,241,0.2)", animation: "float 3s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — BILLET NUMÉRIQUE */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div style={{ animation: "slideInLeft 0.8s ease-out both" }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Smart Ticket</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Le billet numérique <span className="gradient-text">SenGuichet</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Chaque acheteur reçoit un billet PDF avec QR code unique, immédiatement après l'achat. Vos contrôleurs scannent à l'entrée.
            </p>
            <div className="space-y-4">
              {smartTicketPoints.map((pt) => (
                <div key={pt} className="flex items-center gap-3 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", fontSize: "12px" }}>✓</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center" style={{ animation: "slideInRight 0.8s ease-out both" }}>
            <div className="w-[280px] rounded-2xl overflow-hidden relative group" style={{ boxShadow: "0 25px 80px rgba(99,102,241,0.25)", background: "white", transform: "rotate(-2deg)", transition: "transform 400ms ease" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "rotate(0deg) scale(1.03)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "rotate(-2deg)"}
            >
              <div className="h-[140px] relative overflow-hidden">
                <img src="/images/event-1.jpg" alt="Concert" className="w-full h-full object-cover" style={{ filter: "brightness(0.6)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(251,146,60,0.4))" }} />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>Concert Thiossane Live</p>
                  <p className="text-white/70 text-[10px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>24 Mai 2026 • Dakar Arena</p>
                </div>
              </div>
              <div className="relative flex items-center justify-center" style={{ height: 1 }}>
                <div style={{ position: "absolute", left: -7, width: 14, height: 14, borderRadius: "50%", background: "#0A0B1A" }} />
                <div style={{ flex: 1, borderTop: "2px dashed rgba(0,0,0,0.08)" }} />
                <div style={{ position: "absolute", right: -7, width: 14, height: 14, borderRadius: "50%", background: "#0A0B1A" }} />
              </div>
              <div className="p-5 flex flex-col items-center gap-3">
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
                  <rect x="4" y="4" width="92" height="92" rx="4" fill="white" stroke="#6366F1" strokeWidth="0.5" />
                  {[0,1,2,3,4,5,6].map((row) =>
                    [0,1,2,3,4,5,6].map((col) => (
                      <rect key={`${row}-${col}`} x={10 + col * 11} y={10 + row * 11} width="6" height="6" rx="1" fill={Math.random() > 0.45 ? "#333" : "#eee"} />
                    ))
                  )}
                </svg>
                <p className="text-xs tracking-widest" style={{ color: "#6366F1", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
                  ID: THIO-2026-9876
                </p>
                <p className="text-[10px] font-semibold" style={{ color: "#6366F1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>SenGuichet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — STATISTIQUES */}
      <section className="py-20 sm:py-24 px-4 relative" style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, #0A0B1A 70%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              SenGuichet en <span className="gradient-text">chiffres</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className="glass-card p-6 text-center" style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.15}s both` }}>
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>{s.value}</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="py-24 px-4 relative" id="contact">
        <div className="max-w-xl mx-auto" style={{ animation: "fadeInScale 0.6s ease-out both" }}>
          <div className="glass-card p-12 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full" style={{ background: "rgba(99,102,241,0.15)", filter: "blur(40px)" }} />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full" style={{ background: "rgba(251,146,60,0.1)", filter: "blur(40px)" }} />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                Prêt à lancer votre prochain événement ?
              </h2>
              <p className="text-sm sm:text-base mb-8" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Rejoignez les organisateurs qui font confiance à SenGuichet.
              </p>
              <button onClick={() => navigate("/inscription")} className="btn-primary btn-lg" style={{ paddingLeft: 44, paddingRight: 44, animation: "pulse-glow 3s infinite" }}>
                Créer mon compte organisateur
              </button>
              <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Validation du compte sous 24h · Gratuit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060710", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <p className="text-lg font-bold gradient-text mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}>SenGuichet</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Billetterie événementielle professionnelle au Sénégal.
              </p>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Dakar, Sénégal 🇸🇳
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plateforme</p>
              <div className="space-y-2">
                <a href="#features" className="block text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fonctionnalités</a>
                <a href="#how" className="block text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Comment ça marche</a>
                <a href="#" className="block text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>FAQ</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Accès</p>
              <div className="space-y-2">
                <button onClick={() => navigate("/connexion")} className="block text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Connexion</button>
                <button onClick={() => navigate("/inscription")} className="block text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Inscription</button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-3 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contact</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                support@senguichet.sn
              </p>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              © 2026 SenGuichet — Tous droits réservés
            </p>
            <button onClick={() => navigate("/connexion")} className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Espace admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Accueil;
