import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { detailEvenement, modifierEvenement } from "../../services/eventService";

const CATEGORIES = ["Concert", "Festival", "Soirée", "Sport", "Conférence", "Théâtre", "Autre"];
const VILLES = ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Autre"];

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
    if (visible) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }
  }, [visible, onClose]);
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl"
      style={{ background: "rgba(34,197,94,0.12)", backdropFilter: "blur(20px)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E", fontFamily: "'Plus Jakarta Sans', sans-serif", animation: "fadeInUp 0.3s ease", minWidth: "280px" }}
    >
      <span className="text-lg">✓</span>
      <span className="text-sm font-medium" style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} className="text-lg leading-none" style={{ background: "none", border: "none", color: "rgba(34,197,94,0.5)", cursor: "pointer", padding: 0 }}>×</button>
    </div>
  );
};

const badgeConfig = {
  active: { cls: "badge-active", label: "Actif" },
  en_attente: { cls: "badge-pending", label: "En attente" },
  refuse: { cls: "badge-sold-out", label: "Refusé" },
  suspendu: { cls: "badge-sold-out", label: "Suspendu" },
  annule: { cls: "badge-sold-out", label: "Annulé" },
};

const ModifierEvenement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [eventStatut, setEventStatut] = useState("actif");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    affichePreview: null,
  });

  const [ticketTypes, setTicketTypes] = useState([]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addTicket = () => setTicketTypes((prev) => [...prev, { id: Date.now(), nom: "", prix: "", quantite: "", description: "" }]);
  const removeTicket = (id) => { if (ticketTypes.length > 1) setTicketTypes((prev) => prev.filter((t) => t.id !== id)); };
  const updateTicket = (id, field, value) => setTicketTypes((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const showToast = (msg) => { setToastMessage(msg); setToastVisible(true); };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await detailEvenement(id);
        const ev = data.evenement;
        const dateStr = ev.date_debut ? ev.date_debut.substring(0, 10) : "";
        const timeStr = ev.date_debut ? ev.date_debut.substring(11, 16) : "";
        setEventStatut(ev.statut);
        setForm({
          nom: ev.titre,
          categorie: ev.categorie || "",
          description: ev.description,
          dateDebut: dateStr,
          dateFin: ev.date_fin ? ev.date_fin.substring(0, 10) : "",
          heureDebut: timeStr,
          lieu: ev.lieu,
          ville: ev.ville || "",
          capacite: String(ev.capacite_totale),
          affichePreview: null,
        });
        setTicketTypes(
          (data.tickets || []).map((t) => ({
            id: t.id,
            nom: t.nom,
            prix: String(t.prix),
            quantite: String(t.capacite),
            description: t.description || "",
          }))
        );
      } catch (err) {
        showToast(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

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
      await modifierEvenement(id, payload);
      setSubmitting(false);
      showToast("Événement modifié avec succès !");
      setTimeout(() => navigate("/dashboard/evenements"), 500);
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || "Erreur lors de la modification");
    }
  };

  const labelStyle = { color: "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif" };
  const fieldStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <DashboardLayout title="Modifier l'événement">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 sm:p-8 mb-6" style={{ animation: "fadeInUp 0.4s ease" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Informations générales</h2>
            <span className={`badge ${(badgeConfig[eventStatut] || badgeConfig.active).cls}`}>
              {(badgeConfig[eventStatut] || badgeConfig.active).label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label style={labelStyle}>Nom de l'événement</label>
              <input className="input-premium" value={form.nom} onChange={set("nom")} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <CategorySelect value={form.categorie} onChange={(v) => setForm((p) => ({ ...p, categorie: v }))} options={CATEGORIES} label="Catégorie" />
            </div>
            <div>
              <label style={labelStyle}>Ville</label>
              <CategorySelect value={form.ville} onChange={(v) => setForm((p) => ({ ...p, ville: v }))} options={VILLES} label="Ville" />
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea className="input-premium resize-none" rows={4} value={form.description} onChange={set("description")} style={fieldStyle} maxLength={2000} />
              <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.3)" }}>{form.description.length}/2000</p>
            </div>
            <div>
              <label style={labelStyle}>Date de début</label>
              <input type="date" className="input-premium" value={form.dateDebut} onChange={set("dateDebut")} style={fieldStyle} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "rgba(255,255,255,0.45)" }}>Date de fin <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
              <input type="date" className="input-premium" value={form.dateFin} onChange={set("dateFin")} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Heure de début</label>
              <input type="time" className="input-premium" value={form.heureDebut} onChange={set("heureDebut")} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Capacité totale</label>
              <input type="number" min="1" className="input-premium" value={form.capacite} onChange={set("capacite")} style={fieldStyle} />
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Lieu / Venue</label>
              <input className="input-premium" value={form.lieu} onChange={set("lieu")} style={fieldStyle} />
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Affiche</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all overflow-hidden"
                style={{ border: `2px dashed ${form.affichePreview ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.12)"}`, background: form.affichePreview ? "transparent" : "rgba(255,255,255,0.03)", minHeight: "180px" }}
              >
                {form.affichePreview ? (
                  <>
                    <img src={form.affichePreview} alt="Aperçu" className="w-full h-full object-cover rounded-xl" style={{ maxHeight: "240px" }} />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, affiche: null, affichePreview: null })); }} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(0,0,0,0.6)", color: "#EF4444", border: "none", cursor: "pointer" }}>✕</button>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>📁</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cliquez pour changer l'affiche</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>JPG, PNG • Max 5 Mo</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((p) => ({ ...p, affiche: f, affichePreview: URL.createObjectURL(f) })); }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 mb-6" style={{ animation: "fadeInUp 0.4s ease" }}>
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Types de billets</h2>
          {ticketTypes.map((ticket, idx) => (
            <div key={ticket.id} className="glass-card p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Billet #{idx + 1}</span>
                {ticketTypes.length > 1 && (
                  <button onClick={() => removeTicket(ticket.id)} className="btn-danger btn-sm" style={{ width: "auto", padding: "4px 12px", fontSize: "12px" }}>✕ Supprimer</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <label style={labelStyle}>Nom du type</label>
                  <input className="input-premium" value={ticket.nom} onChange={(e) => updateTicket(ticket.id, "nom", e.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Prix (FCFA)</label>
                  <input type="number" min="0" className="input-premium" value={ticket.prix} onChange={(e) => updateTicket(ticket.id, "prix", e.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Quantité disponible</label>
                  <input type="number" min="1" className="input-premium" value={ticket.quantite} onChange={(e) => updateTicket(ticket.id, "quantite", e.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: "rgba(255,255,255,0.45)" }}>Description <span style={{ color: "rgba(255,255,255,0.25)" }}>(optionnel)</span></label>
                  <input className="input-premium" value={ticket.description} onChange={(e) => updateTicket(ticket.id, "description", e.target.value)} style={fieldStyle} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addTicket} className="btn-ghost btn-sm" style={{ width: "auto", padding: "10px 24px", marginTop: 4 }}>+ Ajouter un type de billet</button>
        </div>



        <div className="flex justify-between">
          <button onClick={() => navigate("/dashboard/evenements")} className="btn-ghost btn-md" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }}>
            ← Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-md" style={{ width: "auto", paddingLeft: 36, paddingRight: 36 }}>
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </DashboardLayout>
  );
};

export default ModifierEvenement;
