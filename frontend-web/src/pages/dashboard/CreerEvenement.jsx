import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { creerEvenement } from "../../services/eventService";

const CATEGORIES = ["Concert", "Festival", "Soirée", "Sport", "Conférence", "Théâtre", "Autre"];
const VILLES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Autre"];

const steps = [
  { num: 1, label: "Informations générales" },
  { num: 2, label: "Billetterie" },
  { num: 3, label: "Récapitulatif" },
];

const Stepper = ({ current }) => (
  <div className="flex items-center justify-center gap-2 sm:gap-6 mb-8">
    {steps.map((s, i) => {
      const done = current > s.num;
      const active = current === s.num;
      return (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            style={{
              background: done ? "rgba(34,197,94,0.2)" : active ? "var(--gradient)" : "rgba(255,255,255,0.08)",
              color: done ? "#22C55E" : active ? "white" : "rgba(255,255,255,0.35)",
              border: active ? "none" : `2px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {done ? "✓" : s.num}
          </div>
          <span
            className="hidden sm:inline text-sm"
            style={{
              color: active ? "#F1F5F9" : done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: active ? 600 : 400,
            }}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className="hidden sm:block w-8 md:w-16 h-px mx-1"
              style={{ background: done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)" }}
            />
          )}
        </div>
      );
    })}
  </div>
);

const CategorySelect = ({ value, onChange, options, label }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-premium appearance-none cursor-pointer"
      style={{ paddingRight: "40px" }}
    >
      <option value="" disabled style={{ background: "#0A0B1A", color: "#94A3B8" }}>{label}</option>
      {options.map((o) => (
        <option key={o} value={o} style={{ background: "#0A0B1A", color: "#F1F5F9" }}>{o}</option>
      ))}
    </select>
    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>▼</span>
  </div>
);

const Toast = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl"
      style={{
        background: "rgba(34,197,94,0.12)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(34,197,94,0.3)",
        color: "#22C55E",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: "fadeInUp 0.3s ease",
        minWidth: "280px",
      }}
    >
      <span className="text-lg">✓</span>
      <span className="text-sm font-medium" style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} className="text-lg leading-none" style={{ background: "none", border: "none", color: "rgba(34,197,94,0.5)", cursor: "pointer", padding: 0 }}>×</button>
    </div>
  );
};

const CreerEvenement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [form, setForm] = useState({
    nom: "",
    categorie: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    heureDebut: "",
    lieu: "",
    ville: "",
    capacite: "",
    affiche: null,
    affichePreview: null,
  });

  const [ticketTypes, setTicketTypes] = useState([
    { id: 1, nom: "Standard", prix: "", quantite: "", description: "" },
  ]);

  const [promosActif, setPromosActif] = useState(false);
  const [promos, setPromos] = useState({ code: "", type: "pourcentage", valeur: "", limite: "" });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setFile = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, [field]: file, [`${field}Preview`]: URL.createObjectURL(file) }));
  };

  const addTicket = () => {
    setTicketTypes((prev) => [...prev, { id: Date.now(), nom: "", prix: "", quantite: "", description: "" }]);
  };

  const removeTicket = (id) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTicket = (id, field, value) => {
    setTicketTypes((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const gotoStep = (s) => {
    setErrors({});
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.nom || form.nom.trim().length < 3) e.nom = "Minimum 3 caractères";
    if (!form.categorie) e.categorie = "Choisissez une catégorie";
    if (!form.description || form.description.trim().length < 20) e.description = "Minimum 20 caractères";
    if (!form.dateDebut) e.dateDebut = "Date requise";
    if (!form.heureDebut) e.heureDebut = "Heure requise";
    if (!form.lieu || form.lieu.trim().length < 2) e.lieu = "Lieu requis";
    if (!form.ville) e.ville = "Ville requise";
    if (!form.capacite || parseInt(form.capacite) < 1) e.capacite = "Minimum 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    const hasEmpty = ticketTypes.some((t) => !t.nom || !t.prix || !t.quantite);
    if (hasEmpty) e.tickets = "Chaque type de billet doit avoir un nom, un prix et une quantité";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) gotoStep(2);
    else if (step === 2 && validateStep2()) gotoStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        titre: form.nom,
        categorie: form.categorie,
        description: form.description,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || null,
        heureDebut: form.heureDebut,
        lieu: form.lieu,
        ville: form.ville,
        capacite: form.capacite,
        ticketTypes: ticketTypes.map((t) => ({
          nom: t.nom,
          description: t.description || null,
          prix: t.prix,
          quantite: t.quantite,
        })),
      };
      await creerEvenement(payload);
      setSubmitting(false);
      showToast("Événement créé avec succès !");
      setTimeout(() => navigate("/dashboard/evenements"), 500);
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || "Erreur lors de la création");
    }
  };

  const fieldStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const labelStyle = { color: "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <DashboardLayout title="Créer un événement">
      <Stepper current={step} />

      {step === 1 && (
        <div className="glass-card p-6 sm:p-8 max-w-3xl mx-auto" style={{ animation: "fadeInUp 0.4s ease" }}>
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Informations générales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label style={labelStyle}>Nom de l'événement</label>
              <input className={`input-premium ${errors.nom ? "error" : ""}`} placeholder="Ex: Concert Youssou N'Dour" value={form.nom} onChange={set("nom")} style={fieldStyle} />
              {errors.nom && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.nom}</p>}
            </div>

            <div>
              <label style={labelStyle}>Catégorie</label>
              <CategorySelect value={form.categorie} onChange={(v) => setForm((p) => ({ ...p, categorie: v }))} options={CATEGORIES} label="Sélectionnez une catégorie" />
              {errors.categorie && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.categorie}</p>}
            </div>

            <div>
              <label style={labelStyle}>Ville</label>
              <CategorySelect value={form.ville} onChange={(v) => setForm((p) => ({ ...p, ville: v }))} options={VILLES} label="Sélectionnez une ville" />
              {errors.ville && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.ville}</p>}
            </div>

            <div className="md:col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea
                className={`input-premium resize-none ${errors.description ? "error" : ""}`}
                rows={4}
                placeholder="Décrivez votre événement en détail..."
                value={form.description}
                onChange={set("description")}
                style={fieldStyle}
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-xs" style={{ color: "var(--error)" }}>{errors.description}</p>}
                <p className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>{form.description.length}/2000</p>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Date de début</label>
              <input type="date" className={`input-premium ${errors.dateDebut ? "error" : ""}`} value={form.dateDebut} onChange={set("dateDebut")} style={fieldStyle} />
              {errors.dateDebut && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.dateDebut}</p>}
            </div>

            <div>
              <label style={{ ...labelStyle, color: "rgba(255,255,255,0.45)" }}>Date de fin <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
              <input type="date" className="input-premium" value={form.dateFin} onChange={set("dateFin")} style={fieldStyle} />
            </div>

            <div>
              <label style={labelStyle}>Heure de début</label>
              <input type="time" className={`input-premium ${errors.heureDebut ? "error" : ""}`} value={form.heureDebut} onChange={set("heureDebut")} style={fieldStyle} />
              {errors.heureDebut && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.heureDebut}</p>}
            </div>

            <div>
              <label style={labelStyle}>Capacité totale</label>
              <input type="number" min="1" className={`input-premium ${errors.capacite ? "error" : ""}`} placeholder="Ex: 1000" value={form.capacite} onChange={set("capacite")} style={fieldStyle} />
              {errors.capacite && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.capacite}</p>}
            </div>

            <div className="md:col-span-2">
              <label style={labelStyle}>Lieu / Venue</label>
              <input className={`input-premium ${errors.lieu ? "error" : ""}`} placeholder="Ex: Palais du Peuple, Dakar" value={form.lieu} onChange={set("lieu")} style={fieldStyle} />
              {errors.lieu && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.lieu}</p>}
            </div>

            <div className="md:col-span-2">
              <label style={labelStyle}>Affiche de l'événement <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all overflow-hidden"
                style={{
                  border: `2px dashed ${form.affichePreview ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.12)"}`,
                  background: form.affichePreview ? "transparent" : "rgba(255,255,255,0.03)",
                  minHeight: "180px",
                }}
                onMouseEnter={(e) => { if (!form.affichePreview) e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                onMouseLeave={(e) => { if (!form.affichePreview) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              >
                {form.affichePreview ? (
                  <>
                    <img src={form.affichePreview} alt="Aperçu" className="w-full h-full object-cover rounded-xl" style={{ maxHeight: "240px" }} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, affiche: null, affichePreview: null })); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#EF4444", border: "none", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>📁</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Cliquez pour télécharger l'affiche
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>JPG, PNG • Max 5 Mo</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={setFile("affiche")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button onClick={handleNext} className="btn-primary btn-md" style={{ width: "auto", paddingLeft: 36, paddingRight: 36 }}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl mx-auto" style={{ animation: "fadeInUp 0.4s ease" }}>
          <div className="glass-card p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Types de billets</h2>

            {ticketTypes.map((ticket, idx) => (
              <div key={ticket.id} className="glass-card p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Billet #{idx + 1}</span>
                  {ticketTypes.length > 1 && (
                    <button onClick={() => removeTicket(ticket.id)} className="btn-danger btn-sm" style={{ width: "auto", padding: "4px 12px", fontSize: "12px" }}>
                      ✕ Supprimer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label style={labelStyle}>Nom du type</label>
                    <input className="input-premium" placeholder="Ex: VIP" value={ticket.nom} onChange={(e) => updateTicket(ticket.id, "nom", e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Prix (FCFA)</label>
                    <input type="number" min="0" className="input-premium" placeholder="Ex: 15000" value={ticket.prix} onChange={(e) => updateTicket(ticket.id, "prix", e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Quantité disponible</label>
                    <input type="number" min="1" className="input-premium" placeholder="Ex: 200" value={ticket.quantite} onChange={(e) => updateTicket(ticket.id, "quantite", e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: "rgba(255,255,255,0.45)" }}>Description <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
                    <input className="input-premium" placeholder="Ex: Accès coupe-file" value={ticket.description} onChange={(e) => updateTicket(ticket.id, "description", e.target.value)} style={fieldStyle} />
                  </div>
                </div>
              </div>
            ))}

            {errors.tickets && <p className="text-xs mt-1 mb-3" style={{ color: "var(--error)" }}>{errors.tickets}</p>}

            <button onClick={addTicket} className="btn-ghost btn-sm" style={{ width: "auto", padding: "10px 24px", marginTop: 4 }}>
              + Ajouter un type de billet
            </button>
          </div>

          <div className="glass-card p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Codes promo <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, fontSize: "14px" }}>(optionnel)</span></h2>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setPromosActif(!promosActif)}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{
                  background: promosActif ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.12)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-md"
                  style={{
                    background: promosActif ? "#6366F1" : "rgba(255,255,255,0.35)",
                    left: promosActif ? "calc(100% - 22px)" : "2px",
                    top: "2px",
                  }}
                />
              </button>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Activer les codes promo</span>
            </div>

            {promosActif && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3" style={{ animation: "fadeInUp 0.3s ease" }}>
                <div>
                  <label style={labelStyle}>Code</label>
                  <input className="input-premium" placeholder="Ex: VIP20" value={promos.code} onChange={(e) => setPromos((p) => ({ ...p, code: e.target.value }))} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type de réduction</label>
                  <CategorySelect
                    value={promos.type}
                    onChange={(v) => setPromos((p) => ({ ...p, type: v }))}
                    options={["pourcentage", "montant_fixe"]}
                    label="Type"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Valeur</label>
                  <input type="number" min="0" className="input-premium" placeholder={promos.type === "pourcentage" ? "Ex: 20" : "Ex: 5000"} value={promos.valeur} onChange={(e) => setPromos((p) => ({ ...p, valeur: e.target.value }))} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Limite d'utilisation</label>
                  <input type="number" min="1" className="input-premium" placeholder="Ex: 100" value={promos.limite} onChange={(e) => setPromos((p) => ({ ...p, limite: e.target.value }))} style={fieldStyle} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => gotoStep(1)} className="btn-ghost btn-md" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }}>
              ← Retour
            </button>
            <button onClick={handleNext} className="btn-primary btn-md" style={{ width: "auto", paddingLeft: 36, paddingRight: 36 }}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl mx-auto" style={{ animation: "fadeInUp 0.4s ease" }}>
          <div className="glass-card p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Récapitulatif</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nom</p>
                <p className="text-sm" style={{ color: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{form.nom}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Catégorie</p>
                <p className="text-sm" style={{ color: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{form.categorie}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Date</p>
                <p className="text-sm" style={{ color: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {form.dateDebut} à {form.heureDebut}{form.dateFin ? ` — ${form.dateFin}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Lieu</p>
                <p className="text-sm" style={{ color: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{form.lieu}, {form.ville}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Capacité</p>
                <p className="text-sm" style={{ color: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{form.capacite} personnes</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Types de billets</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-2 pr-4" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Type</th>
                      <th className="text-left pb-2 pr-4" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Prix</th>
                      <th className="text-left pb-2 pr-4" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Qté</th>
                      <th className="text-left pb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketTypes.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 pr-4" style={{ color: "#F1F5F9" }}>{t.nom}</td>
                        <td className="py-2 pr-4" style={{ color: "#F1F5F9" }}>{parseInt(t.prix || 0).toLocaleString()} FCFA</td>
                        <td className="py-2 pr-4" style={{ color: "#F1F5F9" }}>{t.quantite}</td>
                        <td className="py-2" style={{ color: "rgba(255,255,255,0.45)" }}>{t.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {promosActif && promos.code && (
              <div className="mb-6">
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Code promo</p>
                <p className="text-sm" style={{ color: "#818CF8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {promos.code} — {promos.type === "pourcentage" ? `${promos.valeur}%` : `${parseInt(promos.valeur || 0).toLocaleString()} FCFA`}{promos.limite ? ` (limite: ${promos.limite})` : ""}
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span style={{ color: "#F59E0B" }}>⏳</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "#F59E0B", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Votre événement sera soumis à l'administrateur</p>
                <p className="text-xs mt-1" style={{ color: "rgba(245,158,11,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Une fois validé par l'admin, les billets seront disponibles à la vente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => gotoStep(2)} className="btn-ghost btn-md" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }}>
              ← Modifier
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-md" style={{ width: "auto", paddingLeft: 36, paddingRight: 36 }}>
              {submitting ? "Soumission..." : "Soumettre l'événement"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </DashboardLayout>
  );
};

export default CreerEvenement;
