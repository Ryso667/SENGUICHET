// Fichier : AboutPage.jsx
// Rôle : Page "À propos" — Hero animé, Mission, Chiffres, Équipe, CTA

import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IconHeart, IconShieldCheck, IconBolt, IconTicket, IconArrowRight } from "../lib/tabler-icons";

const team = [
  { initials: "AM", name: "Amadou Mbaye", role: "Fondateur & CEO", bio: "Passionné d'événementiel depuis 10 ans, Amadou a créé SENGUICHET pour digitaliser la billetterie au Sénégal." },
  { initials: "FK", name: "Fatou Koné", role: "Responsable Événements", bio: "Elle coordonne chaque événement avec les organisateurs partenaires pour garantir une expérience irréprochable." },
  { initials: "OD", name: "Ousmane Diallo", role: "Directeur Technique", bio: "Développeur full-stack, il assure la fiabilité et la sécurité de la plateforme au quotidien." },
  { initials: "AS", name: "Aïssatou Sarr", role: "Chargée de Communication", bio: "Elle gère la visibilité de SENGUICHET et la promotion des événements sur les réseaux sociaux." },
];

const stats = [
  { value: 340, label: "Événements gérés" },
  { value: 12000, label: "Billets vendus" },
  { value: 80, label: "Organisateurs partenaires" },
  { value: 3, label: "Années d'expérience" },
];

const valeurs = [
  { icon: IconHeart, title: "Proximité", text: "Une équipe locale qui connaît la culture sénégalaise et ses événements." },
  { icon: IconShieldCheck, title: "Confiance", text: "Paiements sécurisés via Wave, Orange Money et carte bancaire." },
  { icon: IconBolt, title: "Simplicité", text: "De la demande à la vente de billets, tout se fait en quelques heures." },
];

const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const increment = Math.max(1, Math.floor(target / 60));
        const stepTime = duration / 60;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
            observer.disconnect();
          } else {
            setCount(current);
          }
        }, stepTime);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [target, duration]);

  return [count, ref];
};

const useMagneticEffect = (ref, strength = 3) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength / 20}px, ${y * strength / 20}px)`;
    };
    const onLeave = () => { el.style.transform = "translate(0,0)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [ref, strength]);
};

const useTiltEffect = (ref, maxDeg = 4) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * maxDeg;
      const tiltY = (x - 0.5) * maxDeg;
      el.style.transform = `perspective(600px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
    };
    const onLeave = () => { el.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [ref, maxDeg]);
};

const StatCard = ({ num, suffix = "", label }) => {
  const [count, ref] = useCountUp(num);
  return (
    <div ref={ref}>
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="text-center"
      >
        <div className="text-4xl md:text-5xl font-extrabold text-white leading-none mb-1">
          {count}{suffix}
        </div>
        <div className="text-sm md:text-base text-white/70">{label}</div>
      </motion.div>
    </div>
  );
};

const FadeInView = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const AboutPage = () => {
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const partenariatRef = useRef(null);
  const tiltRef = useRef(null);
  useMagneticEffect(ctaRef, 4);
  useMagneticEffect(partenariatRef, 4);
  useTiltEffect(tiltRef, 3);

  const heroWords = ["La", "billetterie", "pensée"];
  const heroWords2 = ["pour", "le", "Sénégal"];

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 : HERO
          ═══════════════════════════════════════════════════════════ */}
      <section className="hero-gradient relative overflow-hidden py-20 md:py-28 px-4 md:px-8 text-center">
        {/* Cercles flottants décoratifs */}
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/30 pointer-events-none animate-[floating_8s_ease-in-out_infinite]" aria-hidden="true" />
        <div className="absolute bottom-16 right-16 w-32 h-32 rounded-full bg-white/20 pointer-events-none animate-[floating_10s_ease-in-out_infinite_1s]" aria-hidden="true" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-[#15803D]/10 pointer-events-none animate-[floating_7s_ease-in-out_infinite_0.5s]" aria-hidden="true" />

        <div className="max-w-3xl mx-auto relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            style={{ border: "1px solid rgba(21, 128, 61, 0.4)", color: "#15803D" }}
          >
            Notre histoire
          </motion.span>

          <motion.h1
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
            style={{ color: "#111827" }}
          >
            {heroWords.map((word, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
            <br />
            {heroWords2.map((word, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}
                className="inline-block mr-[0.3em]"
                style={{ color: i === heroWords2.length - 1 ? "#15803D" : undefined }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#6B7280" }}
          >
            SENGUICHET est né d'un constat simple : les Sénégalais méritent
            une plateforme locale, simple et fiable pour vivre les meilleurs
            événements de leur pays.
          </motion.p>
        </div>
      </section>

      {/* Vague séparatrice */}
      <svg className="wave-separator" viewBox="0 0 1440 60" preserveAspectRatio="none" fill="#FAFAFA">
        <path d="M0,20 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
      </svg>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 : NOTRE MISSION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden" style={{ background: "#FAFAFA" }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#15803D]/5 pointer-events-none" aria-hidden="true" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start relative z-10">
          <div>
            <FadeInView>
              <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#15803D" }}>Notre mission</span>
            </FadeInView>
            <FadeInView delay={0.1}>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mt-3 mb-4" style={{ color: "#111827" }}>
                Connecter les Sénégalais<br />à leur culture
              </h2>
            </FadeInView>
            <FadeInView delay={0.2}>
              <p className="text-base md:text-lg leading-relaxed mb-4" style={{ color: "#6B7280" }}>
                Nous croyons que chaque événement est une opportunité de créer des souvenirs inoubliables.
                Notre mission est de rendre la billetterie accessible à tous — que vous soyez à Dakar,
                Saint-Louis ou Ziguinchor.
              </p>
            </FadeInView>
            <FadeInView delay={0.25}>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "#6B7280" }}>
                En prenant en charge la création, la promotion et la gestion des événements de A à Z,
                nous permettons aux organisateurs de se concentrer sur l'essentiel : offrir une expérience
                mémorable à leur public.
              </p>
            </FadeInView>
          </div>

          <div className="flex flex-col gap-4">
            {valeurs.map((v, i) => (
              <FadeInView key={v.title} delay={0.15 + i * 0.1} className="group">
                  <motion.div
                    whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(21,128,61,0.12)" }}
                    className="rounded-2xl p-6 transition-all cursor-default relative overflow-hidden group"
                    style={{ background: "#F0FDF4", border: "1px solid rgba(21,128,61,0.15)" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(135deg, rgba(21,128,61,0.05), transparent)" }}
                    />
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    className="mb-3"
                  >
                    <v.icon size={28} style={{ color: "#15803D" }} />
                  </motion.div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: "#111827" }}>{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{v.text}</p>
                </motion.div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 : CHIFFRES CLÉS
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 md:px-8 text-center relative overflow-hidden" style={{ background: "#15803D" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.02] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/[0.02] pointer-events-none" aria-hidden="true" />

        <div className="max-w-5xl mx-auto relative z-10">
          <FadeInView>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-12">
              SENGUICHET en chiffres
            </h2>
          </FadeInView>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((s, i) => (
              <FadeInView key={s.label} delay={i * 0.1}>
                <StatCard num={s.value} label={s.label} />
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 : L'ÉQUIPE
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 md:px-8 text-center relative overflow-hidden" style={{ background: "#FAFAFA" }}>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[#15803D]/5 pointer-events-none" aria-hidden="true" />

        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInView>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#15803D" }}>L'équipe</span>
          </FadeInView>
          <FadeInView delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-2" style={{ color: "#111827" }}>
              Des passionnés au service des événements
            </h2>
          </FadeInView>
          <FadeInView delay={0.15}>
            <p className="text-base mb-12 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
              Une équipe jeune, dynamique et ancrée dans la culture sénégalaise.
            </p>
          </FadeInView>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, i) => (
              <FadeInView key={m.name} delay={0.2 + i * 0.1}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(21,128,61,0.15)" }}
                    className="rounded-2xl p-6 transition-all cursor-default relative overflow-hidden group"
                    style={{ background: "#fff", border: "1px solid #E5E7EB" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(135deg, rgba(21,128,61,0.04), transparent)" }}
                    />
                    <div className="relative inline-block mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: "rgba(21,128,61,0.15)" }}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold relative z-10"
                        style={{ background: "#DCFCE7", color: "#15803D" }}
                      >
                        {m.initials}
                      </motion.div>
                    </div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: "#111827" }}>{m.name}</h3>
                  <p className="text-sm font-semibold mb-3" style={{ color: "#15803D" }}>{m.role}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{m.bio}</p>
                </motion.div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 : DÉVELOPPÉ PAR SDP
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 md:px-8 text-center" style={{ background: "#F8FAFC" }}>
        <FadeInView>
          <div className="max-w-2xl mx-auto">
            <img
              src="/images/logoSDP.png"
              alt="Sénégal Digital Pulse"
              className="h-16 w-auto mx-auto mb-6 opacity-80 hover:opacity-100 transition-opacity"
            />
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#111827" }}>
              Développé par <span style={{ color: "#15803D" }}>SDP</span>
            </h2>
            <p className="text-base leading-relaxed mb-6 max-w-lg mx-auto" style={{ color: "#6B7280" }}>
              SENGUICHET est une solution de{" "}
              <strong style={{ color: "#111827" }}>SDP — Sen Digital Pulse</strong>,
              un studio sénégalais spécialisé dans la création d'expériences digitales
              innovantes pour l'événementiel et les services.
            </p>
            <a
              href="https://sendigitalpulse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all"
              style={{ border: "1.5px solid #15803D", color: "#15803D" }}
              onMouseEnter={(e) => { e.target.style.background = "#15803D"; e.target.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#15803D"; }}
            >
              Découvrir SDP
              <IconArrowRight size={16} />
            </a>
          </div>
        </FadeInView>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 : CTA FINAL
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 md:px-8 text-center relative overflow-hidden" style={{ background: "#F0FDF4" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#15803D]/5 pointer-events-none" aria-hidden="true" />

        <motion.div
          ref={tiltRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto rounded-3xl p-10 md:p-14 relative z-10"
          style={{ background: "#fff", boxShadow: "0 4px 24px rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.1)" }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <IconTicket size={48} style={{ color: "#15803D", margin: "0 auto 16px" }} />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-2" style={{ color: "#111827" }}>
            Prêt à vivre ou créer<br />un événement ?
          </h2>
          <p className="text-base mb-8" style={{ color: "#6B7280" }}>Rejoignez la communauté SENGUICHET.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              ref={ctaRef}
              onClick={() => navigate("/evenements")}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(21,128,61,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm w-full sm:w-auto justify-center transition-colors"
              style={{ background: "#15803D", color: "#fff" }}
            >
              Explorer les événements
              <IconArrowRight size={18} />
            </motion.button>
            <motion.button
              ref={partenariatRef}
              onClick={() => navigate("/partenariat")}
              whileHover={{ y: -2, borderColor: "#15803D", color: "#15803D" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm w-full sm:w-auto justify-center transition-colors"
              style={{ background: "transparent", border: "2px solid #E5E7EB", color: "#111827" }}
            >
              Devenir partenaire
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
