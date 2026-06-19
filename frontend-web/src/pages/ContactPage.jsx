import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IconMail, IconMapPin, IconPhone, IconSend, IconBrandInstagram, IconBrandX, IconBrandFacebook } from "../lib/tabler-icons";
import { soumettreDemande } from "../services/partnerService";

const STEP_LABELS = ["Coordonnées", "Projet", "Confirmation"];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

const infos = [
  { icon: IconMail, label: "Email", value: "contact@senguichet.sn", href: "mailto:contact@senguichet.sn" },
  { icon: IconPhone, label: "Téléphone", value: "+221 78 123 45 67", href: "tel:+221781234567" },
  { icon: IconMapPin, label: "Adresse", value: "Dakar, Sénégal", href: null },
];

const socials = [
  { icon: IconBrandInstagram, href: "#", label: "Instagram" },
  { icon: IconBrandX, href: "#", label: "X (Twitter)" },
  { icon: IconBrandFacebook, href: "#", label: "Facebook" },
];

export default function ContactPage() {
  const navigate = useNavigate();

  const savedStep = (() => {
    try { const v = sessionStorage.getItem("contact_form_step"); return v ? parseInt(v, 10) : 1; } catch { return 1; }
  })();
  const savedTouched = (() => {
    try { const v = sessionStorage.getItem("contact_form_touched"); return v ? JSON.parse(v) : {}; } catch { return {}; }
  })();
  const savedData = (() => {
    try {
      const v = sessionStorage.getItem("contact_form_data");
      if (!v) return null;
      const d = JSON.parse(v);
      if (d?.telephone) d.telephone = d.telephone.replace(/\D/g, "");
      return d;
    } catch { return null; }
  })();

  const [formData, setFormData] = useState(
    savedData || {
      nom: "", organisation: "", telephone: "", email: "",
      typeEvenement: "", nbEvenements: "", siteWeb: "",
      description: "", accepteRGPD: false,
    }
  );
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formStep, setFormStep] = useState(savedStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(savedTouched);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { sessionStorage.setItem("contact_form_data", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem("contact_form_step", String(formStep)); }, [formStep]);
  useEffect(() => { sessionStorage.setItem("contact_form_touched", JSON.stringify(touched)); }, [touched]);

  const validateField = (name, value) => {
    const v = typeof value === "string" ? value.trim() : value;
    switch (name) {
      case "nom": return v.length < 2 ? "Minimum 2 caractères" : "";
      case "organisation": return v.length < 2 ? "Minimum 2 caractères" : "";
      case "telephone": {
        const digits = v.replace(/\D/g, "");
        return digits.length < 9 ? "Format: +221 XX XXX XX XX" : "";
      }
      case "email": return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Email invalide" : "";
      case "typeEvenement": return !v ? "Sélectionnez un type" : "";
      case "nbEvenements": return !v ? "Sélectionnez une option" : "";
      case "description": return v.length < 20 ? `Minimum 20 caractères (${v.length}/20)` : "";
      case "accepteRGPD": return !value ? "Vous devez accepter" : "";
      default: return "";
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
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (touched[name]) {
      const err = validateField(name, val);
      setFormErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, formData[name]);
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
      await soumettreDemande({
        nom: formData.nom,
        organisation: formData.organisation,
        telephone: formData.telephone,
        email: formData.email,
        typeEvenement: formData.typeEvenement,
        nbEvenements: formData.nbEvenements,
        siteWeb: formData.siteWeb,
        description: formData.description,
      });
      setFormSubmitted(true);
      sessionStorage.removeItem("contact_form_data");
      sessionStorage.removeItem("contact_form_step");
      sessionStorage.removeItem("contact_form_touched");
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, submit: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectLabel = (name, val) => {
    if (!val) return "-";
    const select = document.querySelector(`select[name="${name}"]`);
    if (select) {
      const opt = select.querySelector(`option[value="${val}"]`);
      if (opt) return opt.textContent;
    }
    return val;
  };

  return (
    <main>
      {/* HERO */}
      <section className="hero-gradient relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-white/30 -top-20 -left-20" />
          <div className="absolute w-48 h-48 rounded-full bg-white/20 top-1/3 -right-10" />
          <div className="absolute w-36 h-36 rounded-full bg-white/25 bottom-10 left-1/4" />
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,32 C360,0 1080,60 1440,32 L1440,60 L0,60 Z" fill="#FAFAFA" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.p
            {...fadeInUp}
            className="text-sm font-semibold mb-2"
            style={{ color: "#15803D" }}
          >
            Contact
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: "#111827" }}
          >
            Parlons de votre projet
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "#6B7280" }}
          >
            Une question, un partenariat, une suggestion ? Notre équipe est là pour vous répondre.
          </motion.p>
        </div>
      </section>

      {/* SECTION CONTACT + FORMULAIRE PARTENARIAT */}
      <section className="py-16 md:py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* INFOS */}
          <div className="lg:col-span-1 space-y-6">
            {infos.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: "#FAFAFA", border: "1px solid #E5E7EB" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(21,128,61,0.1)" }}
                  >
                    <item.icon size={20} style={{ color: "#15803D" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium hover:underline" style={{ color: "#111827" }}>{item.value}</a>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: "#111827" }}>{item.value}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl p-6"
              style={{ background: "#FAFAFA", border: "1px solid #E5E7EB" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>Réseaux sociaux</p>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}
                    aria-label={s.label}
                  >
                    <s.icon size={18} />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* FORMULAIRE PARTENARIAT */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: "#EAF4EE", border: "1px solid rgba(21,128,61,0.15)" }}
            >
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(21,128,61,0.1)" }}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(21,128,61,0.15)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="6"
                        strokeDasharray="226" strokeDashoffset="226"
                        style={{ animation: "successCircle 0.8s ease-out 0.2s forwards" }}
                      />
                      <polyline points="26,42 36,52 54,32" fill="none" stroke="#22C55E" strokeWidth="4"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{ animation: "successCheck 0.5s ease-out 0.6s forwards" }}
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#111827" }}>Demande envoyée !</h3>
                  <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                    Notre équipe étudie votre demande et vous contacte sous 48h.
                  </p>
                  <button
                    onClick={() => { setFormSubmitted(false); setFormStep(1); }}
                    className="text-sm font-semibold px-6 py-2.5 rounded-full text-white transition-colors"
                    style={{ background: "#15803D" }}
                  >
                    Envoyer une autre demande
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit}>
                  {/* Stepper */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                      <React.Fragment key={s}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                            style={{
                              background: formStep >= s ? "#15803D" : "#fff",
                              color: formStep >= s ? "#fff" : "#15803D",
                              border: formStep < s ? "1px solid #15803D" : "none",
                            }}
                          >
                            {formStep > s ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : s}
                          </div>
                          <span className="text-xs hidden sm:inline transition-colors"
                            style={{ color: formStep >= s ? "#15803D" : "#9CA3AF" }}>
                            {STEP_LABELS[s - 1]}
                          </span>
                        </div>
                        {s < 3 && (
                          <div className="w-8 sm:w-16 h-px transition-colors"
                            style={{ background: formStep > s ? "#15803D" : "#D1D5DB" }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Step 1 — Coordonnées */}
                  {formStep === 1 && (
                    <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                      <Field label="Nom complet" name="nom" required value={formData.nom} onChange={handleFormChange} onBlur={handleBlur} error={touched.nom && formErrors.nom} placeholder="Votre nom et prénom" />
                      <Field label="Organisation / Société" name="organisation" required value={formData.organisation} onChange={handleFormChange} onBlur={handleBlur} error={touched.organisation && formErrors.organisation} placeholder="Nom de votre organisation" />
                      <Field label="Email professionnel" name="email" type="email" required value={formData.email} onChange={handleFormChange} onBlur={handleBlur} error={touched.email && formErrors.email} placeholder="votre@email.com" icon="email" autoComplete="email" />
                      <Field label="Téléphone" name="telephone" type="tel" required value={formData.telephone} onChange={handleFormChange} onBlur={handleBlur} error={touched.telephone && formErrors.telephone} placeholder="+221 XX XXX XX XX" icon="phone" autoComplete="tel" />
                      <div className="flex justify-end pt-4">
                        <button type="button" onClick={nextStep}
                          className="px-10 py-3.5 bg-[#15803D] text-white font-semibold rounded-full hover:bg-[#22C55E] transition-all inline-flex items-center gap-2">
                          Étape suivante
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Projet */}
                  {formStep === 2 && (
                    <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                      <SelectField label="Type d'événements organisés" name="typeEvenement" required value={formData.typeEvenement} onChange={handleFormChange} onBlur={handleBlur} error={touched.typeEvenement && formErrors.typeEvenement}
                        options={[
                          { value: "", label: "Sélectionnez un type" },
                          { value: "concert", label: "Concert" },
                          { value: "soiree", label: "Soirée / Club" },
                          { value: "conference", label: "Conférence / Séminaire" },
                          { value: "sport", label: "Sport / Compétition" },
                          { value: "festival", label: "Festival" },
                          { value: "theatre", label: "Théâtre / Culturel" },
                          { value: "entreprise", label: "Événement d'entreprise" },
                          { value: "autre", label: "Autre" },
                        ]}
                      />
                      <SelectField label="Nombre d'événements par an" name="nbEvenements" required value={formData.nbEvenements} onChange={handleFormChange} onBlur={handleBlur} error={touched.nbEvenements && formErrors.nbEvenements}
                        options={[
                          { value: "", label: "Sélectionnez une fréquence" },
                          { value: "1-3", label: "1 à 3 événements / an" },
                          { value: "4-6", label: "4 à 6 événements / an" },
                          { value: "7-12", label: "7 à 12 événements / an" },
                          { value: "12+", label: "Plus de 12 événements / an" },
                        ]}
                      />
                      <Field label="Site web / Réseaux sociaux" name="siteWeb" type="url" value={formData.siteWeb} onChange={handleFormChange} placeholder="https://" optional />
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                          Description de votre projet <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="description" rows={4} value={formData.description} onChange={handleFormChange}
                          placeholder="Décrivez votre projet d'événement, vos attentes et vos besoins..."
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all resize-none"
                          style={{
                            borderColor: touched.description && formErrors.description ? "#EF4444" : "#D1D5DB",
                            color: "#111827",
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "#15803D"; }}
                          onBlur={(e) => { handleBlur(e); if (!touched.description && !formErrors.description) e.currentTarget.style.borderColor = "#D1D5DB"; }}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {touched.description && formErrors.description
                            ? <p className="text-xs" style={{ color: "#EF4444" }}>{formErrors.description}</p>
                            : <span />}
                          <span className="text-xs" style={{ color: formData.description.length < 20 ? "#EF4444" : "#9CA3AF" }}>
                            {formData.description.length} / 20 min
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={prevStep}
                          className="px-8 py-3.5 border-2 border-[#15803D] text-[#15803D] font-semibold rounded-full hover:bg-[#15803D] hover:text-white transition-all inline-flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                          </svg>
                          Retour
                        </button>
                        <button type="button" onClick={nextStep}
                          className="px-10 py-3.5 bg-[#15803D] text-white font-semibold rounded-full hover:bg-[#22C55E] transition-all inline-flex items-center gap-2">
                          Étape suivante
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Confirmation */}
                  {formStep === 3 && (
                    <div className="space-y-5" style={{ animation: "fadeInUp 0.35s ease-out" }}>
                      <div className="p-4 sm:p-5 rounded-xl" style={{ background: "rgba(21,128,61,0.05)", border: "1px solid rgba(21,128,61,0.15)" }}>
                        <h4 className="text-sm font-bold mb-3" style={{ color: "#15803D" }}>
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
                              <span style={{ color: "#6B7280" }}>{r.label}</span>
                              <span className="font-medium" style={{ color: "#111827" }}>{r.val}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2" style={{ borderColor: "rgba(21,128,61,0.15)" }}>
                            <div className="flex justify-between">
                              <span style={{ color: "#6B7280" }}>Type d'événement</span>
                              <span className="font-medium" style={{ color: "#111827" }}>
                                {getSelectLabel("typeEvenement", formData.typeEvenement)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "#6B7280" }}>Fréquence</span>
                              <span className="font-medium" style={{ color: "#111827" }}>
                                {getSelectLabel("nbEvenements", formData.nbEvenements)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input type="checkbox" name="accepteRGPD" checked={formData.accepteRGPD} onChange={handleFormChange} className="sr-only" />
                            <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                              style={{
                                borderColor: formData.accepteRGPD ? "#15803D" : "#9CA3AF",
                                background: formData.accepteRGPD ? "#15803D" : "transparent",
                              }}
                            >
                              {formData.accepteRGPD && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151" }}>
                            J'accepte que SENGUICHET collecte et traite mes données personnelles pour traiter ma demande.
                            <span className="block text-xs mt-0.5" style={{ color: "#6B7280" }}>
                              Conformément à notre <a href="/confidentialite" className="underline" style={{ color: "#15803D" }}>politique de confidentialité</a>.
                            </span>
                          </span>
                        </label>
                        {touched.accepteRGPD && formErrors.accepteRGPD && (
                          <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{formErrors.accepteRGPD}</p>
                        )}
                      </div>

                      {formErrors.submit && (
                        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#DC2626" }}>
                          {formErrors.submit}
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <button type="button" onClick={prevStep}
                          className="px-8 py-3.5 border-2 border-[#15803D] text-[#15803D] font-semibold rounded-full hover:bg-[#15803D] hover:text-white transition-all inline-flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                          </svg>
                          Retour
                        </button>
                        <button type="submit" disabled={isSubmitting}
                          className="px-10 py-3.5 bg-[#15803D] text-white font-semibold rounded-full hover:bg-[#22C55E] transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                              Envoi en cours...
                            </span>
                          ) : (
                            <>
                              Envoyer ma demande
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

const Field = ({ label, name, type = "text", required, value, onChange, onBlur, error, placeholder, icon, autoComplete, optional }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && <span className="ml-1.5 text-xs" style={{ color: "#9CA3AF" }}>(optionnel)</span>}
    </label>
    <div className="relative">
      {icon === "email" && (
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      )}
      {icon === "phone" && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">🇸🇳</span>
      )}
      <input
        type={type} name={name} value={value} onChange={onChange}
        onBlur={(e) => { onBlur?.(e); if (!error) e.currentTarget.style.borderColor = "#E5E7EB"; }}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
        style={{
          borderColor: error ? "#EF4444" : "#E5E7EB",
          color: "#111827",
          paddingLeft: icon ? "42px" : "16px",
          paddingRight: icon === "phone" ? "74px" : "16px",
        }}
        onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#15803D"; }}
      />
    </div>
    {error && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{error}</p>}
  </div>
);

const SelectField = ({ label, name, required, value, onChange, onBlur, error, options }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      name={name} value={value} onChange={onChange}
      onBlur={(e) => { onBlur?.(e); if (!error) e.currentTarget.style.borderColor = "#E5E7EB"; }}
      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all appearance-none bg-white"
      style={{
        borderColor: error ? "#EF4444" : "#E5E7EB",
        color: value ? "#111827" : "#9CA3AF",
      }}
      onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#15803D"; }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ color: opt.value ? "#111827" : "#9CA3AF" }}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{error}</p>}
  </div>
);
