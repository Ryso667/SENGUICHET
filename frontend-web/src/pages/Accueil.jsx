import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { soumettreDemande } from "../services/partnerService";
import Navbar from "../components/Navbar";

// ─────────────────────────────────────────
// Sections statiques
// ─────────────────────────────────────────

const steps = [
  {
    num: "1",
    title: "Faites une demande",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    desc: "Remplissez notre formulaire de demande de partenariat avec vos informations et votre projet d'événement.",
  },
  {
    num: "2",
    title: "On analyse votre dossier",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    desc: "Notre équipe étudie votre demande et vous contacte sous 48h pour discuter des modalités.",
  },
  {
    num: "3",
    title: "Signature du contrat",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
    desc: "Nous vous envoyons le contrat de partenariat. Une fois signé, votre espace est créé.",
  },
  {
    num: "4",
    title: "Suivez vos ventes",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    desc: "Accédez à votre tableau de bord et suivez vos ventes et statistiques en temps réel.",
  },
];

const avantages = [
  {
    title: "Zéro gestion technique",
    desc: "Vous n'avez rien à configurer. Notre équipe s'occupe de tout.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    title: "Paiements sécurisés",
    desc: "Wave, Orange Money, Free Money, Visa et Mastercard acceptés.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "QR codes anti-fraude",
    desc: "Chaque billet est unique et infalsifiable grâce à notre technologie Smart Ticket.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" /><rect x="7" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" />
      </svg>
    ),
  },
  {
    title: "Suivi en temps réel",
    desc: "Consultez vos ventes, revenus et statistiques à tout moment depuis votre dashboard.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: "Support dédié",
    desc: "Une équipe disponible pour vous accompagner avant, pendant et après votre événement.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    title: "Contrôle à l'entrée",
    desc: "Application de scan fournie à vos contrôleurs, fonctionne même sans connexion internet.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
];

const paiements = [
  { name: "Wave", logo: new URL("../assets/payments/wave-logo.jpg", import.meta.url).href, color: "#1DC9F4", bg: "rgba(29,201,244,0.12)" },
  { name: "Orange Money", logo: new URL("../assets/payments/Orange money.jpg", import.meta.url).href, color: "#FF6600", bg: "rgba(255,102,0,0.12)" },
  { name: "Free Money", logo: new URL("../assets/payments/free-Money-logo.jpg", import.meta.url).href, color: "#00A651", bg: "rgba(0,166,81,0.12)" },
  { name: "Visa", logo: new URL("../assets/payments/visa-logo.jpg", import.meta.url).href, color: "#1A1F71", bg: "rgba(26,31,113,0.12)" },
  { name: "Mastercard", logo: new URL("../assets/payments/mastercard.jpg", import.meta.url).href, color: "#EB001B", bg: "rgba(235,0,27,0.12)" },
];

const statsData = [
  { label: "Événements organisés", value: 500, suffix: "+" },
  { label: "Billets vendus", value: 12000, suffix: "+" },
  { label: "Organisateurs partenaires", value: 50, suffix: "+" },
  { label: "Moyens de paiement", value: 5, suffix: "" },
];

const temoignages = [
  {
    initials: "MD",
    name: "Moussa Diallo",
    role: "Organisateur de concerts, Dakar",
    text: "SENGUICHET a simplifié toute la gestion de ma billetterie. Je me concentre sur mon événement, eux gèrent le reste.",
    gradient: "linear-gradient(135deg, #00C8FF, #0077FF)",
  },
  {
    initials: "FN",
    name: "Fatou Ndiaye",
    role: "Promotrice événementielle, Thiès",
    text: "Le suivi en temps réel est incroyable. Je vois mes ventes monter en direct depuis mon téléphone.",
    gradient: "linear-gradient(135deg, #0077FF, #00E5A0)",
  },
  {
    initials: "IS",
    name: "Ibrahima Sarr",
    role: "Directeur de festival, Saint-Louis",
    text: "Zéro fraude depuis qu'on utilise les QR codes SENGUICHET. Nos contrôleurs adorent l'application.",
    gradient: "linear-gradient(135deg, #00E5A0, #00C8FF)",
  },
];

// ─────────────────────────────────────────
// Hook compteur animé (IntersectionObserver)
// ─────────────────────────────────────────

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || started) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return [count, ref];
}

// ─────────────────────────────────────────
// Composant Counter animé
// ─────────────────────────────────────────

function AnimatedCounter({ value, suffix, label }) {
  const [count, ref] = useCountUp(value);

  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        opacity: count > 0 || 0,
        animation: count > 0 ? "fadeInUp 0.6s ease-out" : "none",
      }}
    >
      <div
        className="gradient-text"
        style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          fontFamily: "Outfit, sans-serif",
          lineHeight: 1.1,
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: "0.95rem",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginTop: 6,
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// Composant Avatar initiales
// ─────────────────────────────────────────

function InitialsAvatar({ initials, gradient }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "#fff",
        fontFamily: "Outfit, sans-serif",
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(0,200,255,0.35)",
      }}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────

const Accueil = () => {
  const navigate = useNavigate();

  const savedData = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("partenaire_form_data") || "null") : null;
  const savedStep = typeof window !== "undefined" ? parseInt(sessionStorage.getItem("partenaire_form_step") || "1") : 1;
  const savedTouched = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("partenaire_form_touched") || "{}") : {};

  const [formData, setFormData] = useState(savedData || {
    nom: "",
    organisation: "",
    telephone: "",
    email: "",
    typeEvenement: "",
    nbEvenements: "",
    siteWeb: "",
    description: "",
    accepteRGPD: false,
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formStep, setFormStep] = useState(savedStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(savedTouched);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { sessionStorage.setItem("partenaire_form_data", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem("partenaire_form_step", String(formStep)); }, [formStep]);
  useEffect(() => { sessionStorage.setItem("partenaire_form_touched", JSON.stringify(touched)); }, [touched]);

  const validateField = (name, value) => {
    const v = typeof value === "string" ? value.trim() : value;
    switch (name) {
      case "nom":
        return v.length < 2 ? "Minimum 2 caractères" : "";
      case "organisation":
        return v.length < 2 ? "Minimum 2 caractères" : "";
      case "telephone": {
        const digits = v.replace(/\D/g, "");
        return digits.length < 9 ? "Format: +221 XX XXX XX XX" : "";
      }
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Email invalide" : "";
      case "typeEvenement":
        return !v ? "Sélectionnez un type" : "";
      case "nbEvenements":
        return !v ? "Sélectionnez une option" : "";
      case "description":
        return v.length < 20 ? "Minimum 20 caractères (" + v.length + "/20)" : "";
      case "accepteRGPD":
        return !value ? "Vous devez accepter" : "";
      default:
        return "";
    }
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      ["nom", "organisation", "telephone", "email"].forEach((f) => {
        const err = validateField(f, formData[f]);
        if (err) errors[f] = err;
      });
    } else if (step === 2) {
      ["typeEvenement", "nbEvenements", "description"].forEach((f) => {
        const err = validateField(f, formData[f]);
        if (err) errors[f] = err;
      });
    } else if (step === 3) {
      if (!formData.accepteRGPD) errors.accepteRGPD = "Vous devez accepter";
    }
    setFormErrors(errors);
    setTouched((prev) => {
      const next = { ...prev };
      Object.keys(errors).forEach((k) => { next[k] = true; });
      return next;
    });
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    let processed = val;
    if (name === "telephone") {
      processed = val.replace(/\D/g, "").substring(0, 9);
    }

    setFormData((prev) => ({ ...prev, [name]: processed }));

    if (touched[name]) {
      const err = validateField(name, processed);
      setFormErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const formaterTelephone = (digits) => {
    let formatted = "+221 ";
    formatted += digits.substring(0, 2);
    if (digits.length > 2) formatted += " " + digits.substring(2, Math.min(5, digits.length));
    if (digits.length > 5) formatted += " " + digits.substring(5, Math.min(9, digits.length));
    return formatted;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    let value = formData[name];
    if (name === "telephone" && value) {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 3) {
        value = formaterTelephone(digits);
        setFormData((prev) => ({ ...prev, telephone: value }));
      }
    }
    const err = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: err }));
  };

  const nextStep = () => {
    if (validateStep(formStep)) setFormStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setFormStep((s) => Math.max(s - 1, 1));

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3) || !validateStep(2) || !validateStep(1)) return;
    setIsSubmitting(true);
    try {
      const telephone = formData.telephone?.replace(/\D/g, "");
      await soumettreDemande({
        nom: formData.nom,
        organisation: formData.organisation,
        telephone: telephone ? formaterTelephone(telephone) : "",
        email: formData.email,
        typeEvenement: formData.typeEvenement,
        nbEvenements: formData.nbEvenements,
        siteWeb: formData.siteWeb,
        description: formData.description,
      });
      setFormSubmitted(true);
      sessionStorage.removeItem("partenaire_form_data");
      sessionStorage.removeItem("partenaire_form_step");
      sessionStorage.removeItem("partenaire_form_touched");
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, submit: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToFormulaire = () => {
    const el = document.querySelector("#devenir-partenaire");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      <div className="orb-primary" />
      <div className="orb-accent" />
      <div className="orb-3" />

      <Navbar />

      {/* ──────── SECTION 1 — HERO ──────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ marginTop: "-73px", paddingTop: "73px" }}
      >
        {/* Image de fond avec overlay sombre */}
        <div
          className="hero-image-wrapper"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(rgba(13, 27, 42, 0.75), rgba(13, 27, 42, 0.95)),
                url(${new URL("../assets/hero-bg.jpg", import.meta.url).href})
              `,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.6)",
              transform: "scale(1.05)",
              transition: "transform 8s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
          />
          {/* Overlay radial gradient supplémentaire */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(13,27,42,0.6) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,200,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(0,119,255,0.08) 0%, transparent 60%)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 sm:mb-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0,200,255,0.4)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <span role="img" aria-label="Senegal">🇸🇳</span>
            <span className="gradient-text" style={{ fontWeight: 600 }}>La billetterie professionnelle made in Sénégal</span>
          </span>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-[1.1]"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800 }}
          >
            La billetterie professionnelle
            <br />
            <span className="shimmer-text">made in Sénégal</span>
          </h1>

          <p
            className="text-base md:text-lg mb-8 max-w-xl"
            style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            SENGUICHET gère la vente de vos billets de A à Z. Vous organisez, nous nous occupons du reste.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={scrollToFormulaire}
              className="btn-primary btn-lg sm:w-auto w-full"
              style={{ padding: "16px 40px" }}
            >
              Devenir partenaire organisateur
            </button>
            <button
              onClick={() => navigate("/connexion")}
              className="btn-ghost btn-lg sm:w-auto w-full"
              style={{ padding: "16px 40px" }}
            >
              Se connecter
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 mt-8">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Vous êtes acheteur ? Téléchargez notre application
            </p>
            <div className="flex gap-3">
              {[
                { label: "App Store", icon: <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /> },
                { label: "Play Store", icon: <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" /> },
              ].map((store) => (
                <a
                  key={store.label}
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#A0B4C8",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#FFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "#A0B4C8";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    {store.icon}
                  </svg>
                  {store.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ color: "rgba(255,255,255,0.3)", animation: "float 2.5s ease-in-out infinite" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ──────── SECTION 2 — STATS ANIMÉES ──────── */}
      <section
        className="py-16 sm:py-20 px-4 relative"
        style={{ background: "linear-gradient(180deg, #0D1B2A 0%, #080914 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            {statsData.map((s) => (
              <AnimatedCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────── SECTION 3 — COMMENT ÇA MARCHE ──────── */}
      <section className="py-20 sm:py-28 px-4 relative" id="how">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Processus
            </span>
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Comment devenir <span className="gradient-text">partenaire ?</span>
            </h2>
            <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              De votre demande à votre tableau de bord, nous vous accompagnons à chaque étape.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Ligne de connexion animée (visible sur desktop) */}
            <div
              className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0"
              style={{
                borderTop: "2px dashed rgba(0,200,255,0.25)",
                zIndex: 0,
              }}
            />
            <div
              className="hidden lg:block absolute top-16 left-[12.5%] h-0"
              style={{
                borderTop: "2px solid rgba(0,200,255,0.5)",
                zIndex: 1,
                width: "0%",
                animation: "stepLineGrow 2s ease-out 0.5s forwards",
              }}
            />

            {steps.map((step, i) => (
              <div
                key={step.num}
                className="glass-card-hover p-6 sm:p-8 text-center"
                style={{
                  animation: `fadeInUp ${0.3 + i * 0.15}s ease-out both`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: "var(--gradient)",
                    boxShadow: "0 4px 20px rgba(0,200,255,0.4)",
                    position: "relative",
                  }}
                >
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {step.num}
                  </span>
                </div>
                <div className="w-10 h-10 flex items-center justify-center mb-4" style={{ color: "#00C8FF" }}>
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── SECTION 4 — NOS AVANTAGES ──────── */}
      <section className="py-20 sm:py-28 px-4 relative" style={{ background: "#080914" }} id="avantages">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "rgba(0,200,255,0.05)", filter: "blur(100px)" }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Pourquoi nous
            </span>
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Pourquoi choisir <span className="gradient-text">SENGUICHET ?</span>
            </h2>
            <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Une plateforme complète pensée pour les organisateurs professionnels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {avantages.map((av, i) => (
              <div
                key={av.title}
                className="glass-card-hover p-6 flex items-start gap-4"
                style={{ animation: `fadeInUp ${0.3 + i * 0.08}s ease-out both` }}
              >
                {/* Icône dans cercle cyan avec opacité 15% */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(0,200,255,0.15)",
                    color: "#00C8FF",
                  }}
                >
                  {av.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
                    {av.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {av.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── SECTION 5 — TÉMOIGNAGES ──────── */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Témoignages
            </span>
          </div>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Ils nous <span className="gradient-text">font confiance</span>
            </h2>
            <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Découvrez ce que disent nos organisateurs partenaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {temoignages.map((t, i) => (
              <div
                key={t.name}
                className="glass-card-hover p-6 sm:p-8 flex flex-col"
                style={{
                  animation: `fadeInUp ${0.3 + i * 0.12}s ease-out both`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div className="flex items-center gap-4">
                  <InitialsAvatar initials={t.initials} gradient={t.gradient} />
                  <div>
                    <p className="text-sm font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {t.role}
                    </p>
                  </div>
                </div>
                {/* Guillemet décoratif */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(0,200,255,0.25)", flexShrink: 0 }}>
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor" />
                </svg>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", gap: 4, marginTop: "auto" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#00C8FF" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── SECTION 6 — MOYENS DE PAIEMENT ──────── */}
      <section className="py-16 sm:py-20 px-4 relative" style={{ background: "#080914" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Paiements
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
            Moyens de paiement <span className="gradient-text">acceptés</span>
          </h2>
          <p className="text-sm sm:text-base mb-10" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Vos acheteurs paient avec leur moyen préféré
          </p>

          <div
            className="glass-card p-8 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            style={{ minWidth: 0, width: "100%", maxWidth: "750px", margin: "0 auto" }}
          >
            {paiements.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl"
                style={{
                  background: p.bg,
                  border: `1px solid ${p.color}33`,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${p.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{ height: 28, width: "auto", objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── SECTION 7 — FORMULAIRE PARTENARIAT AMÉLIORÉ ──────── */}
      <section className="py-20 sm:py-28 px-4 relative" id="devenir-partenaire">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[3px] mb-3 gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Devenir partenaire
            </span>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
              Devenez partenaire <span className="gradient-text">SENGUICHET</span>
            </h2>
            <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Remplissez ce formulaire, notre équipe vous contacte sous 48h
            </p>
          </div>

          {formSubmitted ? (
            <div className="glass-card p-12 text-center" style={{ animation: "fadeInUp 0.5s ease-out" }}>
              <div className="relative w-20 h-20 mx-auto mb-5">
                {/* Cercle d'animation de succès */}
                <svg className="w-full h-full" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,229,160,0.15)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#00E5A0" strokeWidth="6"
                    strokeDasharray="226" strokeDashoffset="226"
                    style={{ animation: "successCircle 0.8s ease-out 0.2s forwards" }}
                  />
                  <polyline points="26,42 36,52 54,32" fill="none" stroke="#00E5A0" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: "successCheck 0.5s ease-out 0.6s forwards" }}
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                Votre demande a bien été envoyée !
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Notre équipe l'analyse et vous contacte sous 48h.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ background: "rgba(0,229,160,0.1)", color: "#00E5A0" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Un accusé de réception vous a été envoyé par email
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="glass-card p-8 sm:p-10">
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                        style={{
                          background: formStep >= s ? "linear-gradient(135deg, #00C8FF, #0077FF)" : "rgba(255,255,255,0.1)",
                          color: formStep >= s ? "#fff" : "#A0B4C8",
                          border: formStep < s ? "1px solid rgba(255,255,255,0.15)" : "none",
                        }}
                      >
                        {formStep > s ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : s}
                      </div>
                      <span className="text-xs hidden sm:inline transition-colors" style={{ color: formStep >= s ? "#00C8FF" : "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {s === 1 ? "Coordonnées" : s === 2 ? "Projet" : "Confirmation"}
                      </span>
                    </div>
                    {s < 3 && (
                      <div className="w-8 sm:w-16 h-px transition-colors" style={{ background: formStep > s ? "#00C8FF" : "rgba(255,255,255,0.1)" }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1 — Coordonnées */}
              {formStep === 1 && (
                <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Nom complet <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      placeholder="Votre nom et prénom"
                      className={"input-premium" + (touched.nom && formErrors.nom ? " input-error" : "")}
                    />
                    {touched.nom && formErrors.nom && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.nom}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Organisation / Société <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="organisation"
                      value={formData.organisation}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      placeholder="Nom de votre organisation"
                      className={"input-premium" + (touched.organisation && formErrors.organisation ? " input-error" : "")}
                    />
                    {touched.organisation && formErrors.organisation && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.organisation}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Email professionnel <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A0B4C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        placeholder="votre@email.com"
                        className={"input-premium" + (touched.email && formErrors.email ? " input-error" : "")}
                        style={{ paddingLeft: "42px" }}
                        autoComplete="email"
                      />
                    </div>
                    {touched.email && formErrors.email && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Téléphone <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        🇸🇳
                      </span>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleFormChange}
                        onBlur={handleBlur}
                        placeholder="+221 XX XXX XX XX"
                        className={"input-premium" + (touched.telephone && formErrors.telephone ? " input-error" : "")}
                        style={{ paddingLeft: "74px" }}
                        autoComplete="tel"
                      />
                    </div>
                    {touched.telephone && formErrors.telephone && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.telephone}</p>}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="button" onClick={nextStep} className="btn-primary btn-lg" style={{ padding: "14px 48px" }}>
                      Étape suivante
                      <svg className="inline ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 — Projet */}
              {formStep === 2 && (
                <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Type d'événements organisés <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <select
                      name="typeEvenement"
                      value={formData.typeEvenement}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={"input-premium" + (touched.typeEvenement && formErrors.typeEvenement ? " input-error" : "")}
                      style={{ appearance: "auto", color: "#fff" }}
                    >
                      <option value="" style={{ color: "#1a1a2e" }}>Sélectionnez un type</option>
                      <option value="concert" style={{ color: "#1a1a2e" }}>Concert</option>
                      <option value="soiree" style={{ color: "#1a1a2e" }}>Soirée / Club</option>
                      <option value="conference" style={{ color: "#1a1a2e" }}>Conférence / Séminaire</option>
                      <option value="sport" style={{ color: "#1a1a2e" }}>Sport / Compétition</option>
                      <option value="festival" style={{ color: "#1a1a2e" }}>Festival</option>
                      <option value="theatre" style={{ color: "#1a1a2e" }}>Théâtre / Culturel</option>
                      <option value="entreprise" style={{ color: "#1a1a2e" }}>Événement d'entreprise</option>
                      <option value="autre" style={{ color: "#1a1a2e" }}>Autre</option>
                    </select>
                    {touched.typeEvenement && formErrors.typeEvenement && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.typeEvenement}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Nombre d'événements par an <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <select
                      name="nbEvenements"
                      value={formData.nbEvenements}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      className={"input-premium" + (touched.nbEvenements && formErrors.nbEvenements ? " input-error" : "")}
                      style={{ appearance: "auto", color: "#fff" }}
                    >
                      <option value="" style={{ color: "#1a1a2e" }}>Sélectionnez une fréquence</option>
                      <option value="1-3" style={{ color: "#1a1a2e" }}>1 à 3 événements / an</option>
                      <option value="4-6" style={{ color: "#1a1a2e" }}>4 à 6 événements / an</option>
                      <option value="7-12" style={{ color: "#1a1a2e" }}>7 à 12 événements / an</option>
                      <option value="12+" style={{ color: "#1a1a2e" }}>Plus de 12 événements / an</option>
                    </select>
                    {touched.nbEvenements && formErrors.nbEvenements && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.nbEvenements}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Site web / Réseaux sociaux
                      <span className="ml-1.5 text-xs" style={{ color: "#5A7090" }}>(optionnel)</span>
                    </label>
                    <input
                      type="url"
                      name="siteWeb"
                      value={formData.siteWeb}
                      onChange={handleFormChange}
                      placeholder="https://"
                      className="input-premium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Description de votre projet <span style={{ color: "#FF4D6D" }}>*</span>
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleFormChange}
                      onBlur={handleBlur}
                      placeholder="Décrivez votre projet d'événement, vos attentes et vos besoins..."
                      className={"input-premium" + (touched.description && formErrors.description ? " input-error" : "")}
                      style={{ resize: "vertical", minHeight: "100px" }}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {touched.description && formErrors.description
                        ? <p className="text-xs" style={{ color: "#FF4D6D" }}>{formErrors.description}</p>
                        : <span />
                      }
                      <span className="text-xs" style={{ color: formData.description.length < 20 ? "#FF4D6D" : "#A0B4C8" }}>
                        {formData.description.length} / 20 min
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-outline btn-lg" style={{ padding: "14px 32px" }}>
                      <svg className="inline mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                      </svg>
                      Retour
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary btn-lg" style={{ padding: "14px 48px" }}>
                      Étape suivante
                      <svg className="inline ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Confirmation */}
              {formStep === 3 && (
                <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                  <div className="p-4 sm:p-5 rounded-xl" style={{ background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.12)" }}>
                    <h4 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Récapitulatif de votre demande
                    </h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "Nom", val: formData.nom },
                        { label: "Organisation", val: formData.organisation },
                        { label: "Email", val: formData.email },
                        { label: "Téléphone", val: formData.telephone },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between">
                          <span style={{ color: "#A0B4C8" }}>{r.label}</span>
                          <span className="text-white font-medium">{r.val}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="flex justify-between">
                          <span style={{ color: "#A0B4C8" }}>Type d'événement</span>
                          <span className="text-white font-medium">
                            {formData.typeEvenement ? document.querySelector(`select[name="typeEvenement"] option[value="${formData.typeEvenement}"]`)?.textContent || formData.typeEvenement : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: "#A0B4C8" }}>Fréquence</span>
                          <span className="text-white font-medium">
                            {formData.nbEvenements ? document.querySelector(`select[name="nbEvenements"] option[value="${formData.nbEvenements}"]`)?.textContent || formData.nbEvenements : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          name="accepteRGPD"
                          checked={formData.accepteRGPD}
                          onChange={handleFormChange}
                          className="sr-only"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                          style={{
                            borderColor: formData.accepteRGPD ? "#00C8FF" : "rgba(255,255,255,0.2)",
                            background: formData.accepteRGPD ? "rgba(0,200,255,0.2)" : "transparent",
                          }}
                        >
                          {formData.accepteRGPD && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed" style={{ color: "#A0B4C8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        J'accepte que SENGUICHET collecte et traite mes données personnelles pour traiter ma demande.
                        <span className="block text-xs mt-0.5" style={{ color: "#5A7090" }}>
                          Conformément à notre <a href="/confidentialite" className="underline" style={{ color: "#00C8FF" }}>politique de confidentialité</a>.
                        </span>
                      </span>
                    </label>
                    {touched.accepteRGPD && formErrors.accepteRGPD && <p className="text-xs mt-1" style={{ color: "#FF4D6D" }}>{formErrors.accepteRGPD}</p>}
                  </div>

                  {formErrors.submit && (
                    <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "#FF4D6D" }}>
                      {formErrors.submit}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-outline btn-lg" style={{ padding: "14px 32px" }}>
                      <svg className="inline mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                      </svg>
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary btn-lg"
                      style={{
                        padding: "14px 48px",
                        opacity: isSubmitting ? 0.7 : 1,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Envoi en cours...
                        </span>
                      ) : (
                        <span>
                          Envoyer ma demande
                          <svg className="inline ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      <style>{`
        @keyframes stepLineGrow {
          from { width: 0%; }
          to { width: 75%; }
        }
        @keyframes successCircle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes successCheck {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        .input-error {
          border-color: #FF4D6D !important;
          box-shadow: 0 0 0 3px rgba(255,77,109,0.15) !important;
        }
        .input-error:focus {
          box-shadow: 0 0 0 3px rgba(255,77,109,0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default Accueil;
