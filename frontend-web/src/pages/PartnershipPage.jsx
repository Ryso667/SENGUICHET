// Fichier : PartnershipPage.jsx
// Rôle : Formulaire de demande de partenariat 3 étapes (stepper)
// Source : Adapté de l'ancien Accueil.jsx avec les couleurs de la charte graphique actuelle

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { soumettreDemande } from "../services/partnerService";

const STEP_LABELS = ["Coordonnées", "Projet", "Confirmation"];

const PartnershipPage = () => {
  const navigate = useNavigate();

  // Restaure l'état depuis sessionStorage (tolérant aux données corrompues)
  const savedStep = (() => {
    try { const v = sessionStorage.getItem("partenaire_form_step"); return v ? parseInt(v, 10) : 1; } catch { return 1; }
  })();
  const savedTouched = (() => {
    try { const v = sessionStorage.getItem("partenaire_form_touched"); return v ? JSON.parse(v) : {}; } catch { return {}; }
  })();
  const savedData = (() => {
    try {
      const v = sessionStorage.getItem("partenaire_form_data");
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

  useEffect(() => { sessionStorage.setItem("partenaire_form_data", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem("partenaire_form_step", String(formStep)); }, [formStep]);
  useEffect(() => { sessionStorage.setItem("partenaire_form_touched", JSON.stringify(touched)); }, [touched]);

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
      sessionStorage.removeItem("partenaire_form_data");
      sessionStorage.removeItem("partenaire_form_step");
      sessionStorage.removeItem("partenaire_form_touched");
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, submit: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper pour le récapitulatif (lecture du label select)
  const getSelectLabel = (name, val) => {
    if (!val) return "-";
    const select = document.querySelector(`select[name="${name}"]`);
    if (select) {
      const opt = select.querySelector(`option[value="${val}"]`);
      if (opt) return opt.textContent;
    }
    return val;
  };

  /* ─── État succès ─── */
  if (formSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[70vh] flex items-center justify-center px-4"
        style={{ background: "#FAFAFA" }}
      >
        <div className="text-center max-w-md">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <svg className="w-full h-full" viewBox="0 0 80 80">
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
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>
            Votre demande a bien été envoyée !
          </h1>
          <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
            Demande reçue ! Notre équipe l'étudie, vous contacte sous 48h, et si nous trouvons un accord, nous créons vos identifiants organisateur.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-10"
            style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Un accusé de réception vous a été envoyé par email
          </div>
          <button onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm bg-[#15803D] text-white hover:bg-[#22C55E] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Retour à l'accueil
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen" style={{ background: "#FAFAFA" }}
    >
      {/* Header */}
      <section className="py-12 md:py-16 px-4" style={{ background: "#EAF4EE" }}>
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[2px] mb-4"
            style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}>
            Devenir partenaire
          </span>
          <h1 className="text-[32px] md:text-[40px] font-extrabold leading-tight mb-3" style={{ color: "#111827" }}>
            Devenez partenaire <span style={{ color: "#15803D" }}>SENGUICHET</span>
          </h1>
          <p className="text-sm md:text-base" style={{ color: "#6B7280" }}>
            Remplissez ce formulaire. Notre équipe étudie votre demande, vous contacte sous 48h, et si nous trouvons un accord, nous créons vos identifiants organisateur pour lancer vos événements.
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="py-10 md:py-16 px-4" style={{ background: "#FAFAFA" }}>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleFormSubmit} className="rounded-2xl shadow-sm p-6 sm:p-10" style={{ background: "#EAF4EE", border: "1px solid rgba(21,128,61,0.15)" }}>

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
                <Field
                  label="Nom complet" name="nom" required
                  value={formData.nom} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.nom && formErrors.nom}
                  placeholder="Votre nom et prénom"
                />
                <Field
                  label="Organisation / Société" name="organisation" required
                  value={formData.organisation} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.organisation && formErrors.organisation}
                  placeholder="Nom de votre organisation"
                />
                <Field
                  label="Email professionnel" name="email" type="email" required
                  value={formData.email} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.email && formErrors.email}
                  placeholder="votre@email.com" icon="email"
                  autoComplete="email"
                />
                <Field
                  label="Téléphone" name="telephone" type="tel" required
                  value={formData.telephone} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.telephone && formErrors.telephone}
                  placeholder="+221 XX XXX XX XX" icon="phone"
                  autoComplete="tel"
                />
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
                <SelectField
                  label="Type d'événements organisés" name="typeEvenement" required
                  value={formData.typeEvenement} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.typeEvenement && formErrors.typeEvenement}
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
                <SelectField
                  label="Nombre d'événements par an" name="nbEvenements" required
                  value={formData.nbEvenements} onChange={handleFormChange} onBlur={handleBlur}
                  error={touched.nbEvenements && formErrors.nbEvenements}
                  options={[
                    { value: "", label: "Sélectionnez une fréquence" },
                    { value: "1-3", label: "1 à 3 événements / an" },
                    { value: "4-6", label: "4 à 6 événements / an" },
                    { value: "7-12", label: "7 à 12 événements / an" },
                    { value: "12+", label: "Plus de 12 événements / an" },
                  ]}
                />
                <Field
                  label="Site web / Réseaux sociaux" name="siteWeb" type="url"
                  value={formData.siteWeb} onChange={handleFormChange}
                  placeholder="https://" optional
                />
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                    Description de votre projet <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleFormChange}
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
                {/* Récapitulatif */}
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

                {/* RGPD */}
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

                {/* Erreur submit */}
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
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-3.5 bg-[#15803D] text-white font-semibold rounded-full hover:bg-[#22C55E] transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
        </div>
      </section>
    </motion.div>
  );
};

/* Champ texte */
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
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={(e) => { onBlur?.(e); if (!error) e.currentTarget.style.borderColor = "#E5E7EB"; }}
        placeholder={placeholder}
        autoComplete={autoComplete}
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

/* Champ select */
const SelectField = ({ label, name, required, value, onChange, onBlur, error, options }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
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

export default PartnershipPage;
