import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { listerMesDemandes, soumettreDemandeEvenement } from "../../services/eventService";
import { useAuth } from "../../context/AuthContext";
import { FileText, Inbox, Check, Calendar, Edit, X, Send, Loader } from "../../components/Icons";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dsozpl9vh";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "senguichet_affiches";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Échec de l'upload de l'affiche");
  const data = await res.json();
  return data.secure_url;
};

const DEMANDE_TYPES = [
  { value: "CREATION", label: "Créer un nouvel événement" },
  { value: "MODIFICATION", label: "Modifier un événement" },
  { value: "SUPPRESSION", label: "Supprimer un événement" },
];

const statutConfig = {
  soumis: { cls: "badge-pending", label: "Soumis" },
  en_analyse: { cls: "badge-pending", label: "En analyse" },
  approuve: { cls: "badge-active", label: "Approuvé" },
  refuse: { cls: "badge-cancelled", label: "Refusé" },
};

const TYPE_LABELS = {
  CREATION: "Création",
  MODIFICATION: "Modification",
  SUPPRESSION: "Suppression",
};

const MesDemandes = () => {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "detail"
  const [viewingDemande, setViewingDemande] = useState(null);
  const [sending, setSending] = useState(false);
  const [demandeSent, setDemandeSent] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [typeAction, setTypeAction] = useState("CREATION");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [capacite, setCapacite] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([{ nom: "", places: "", prix: "" }]);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [affichePreview, setAffichePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const data = await listerMesDemandes();
      setDemandes(data);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    setCategories([...categories, { nom: "", places: "", prix: "" }]);
  };

  const removeCategory = (index) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index, field, value) => {
    const updated = categories.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    setCategories(updated);
  };

  const openNewDemande = (type) => {
    setModalMode("create");
    setViewingDemande(null);
    setTypeAction(type || "CREATION");
    setTitre("");
    setDescription("");
    setLieu("");
    setDateDebut("");
    setDateFin("");
    setCapacite("");
    setMessage("");
    setCategories([{ nom: "", places: "", prix: "" }]);
    setUploading(false);
    setCloudinaryUrl(null);
    setAffichePreview(null);
    setDemandeSent(false);
    setError("");
    setModalOpen(true);
  };

  const openDetail = (demande) => {
    setModalMode("detail");
    setViewingDemande(demande);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const payload = { type_action: typeAction, description: message };
      if (typeAction === "CREATION") {
        payload.titre = titre;
        payload.description = `${description}\n\n${message}`;
        payload.lieu = lieu;
        payload.date_debut = dateDebut;
        payload.date_fin = dateFin || null;
        payload.capacite = parseInt(capacite) || 0;
        if (cloudinaryUrl) payload.affiche_url = cloudinaryUrl;
        payload.categories_tickets = categories
          .filter((c) => c.nom.trim() && c.places && c.prix)
          .map((c) => ({
            nom: c.nom.trim(),
            places: parseInt(c.places) || 0,
            prix: parseInt(c.prix) || 0,
          }));
      } else {
        payload.titre = titre;
      }
      await soumettreDemandeEvenement(payload);
      setDemandeSent(true);
      fetchDemandes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title={<><FileText size={20} /> Mes demandes</>}>
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><FileText size={24} /> Mes demandes</h1>
          <button onClick={() => openNewDemande("CREATION")} className="btn-primary btn-md sm:w-auto w-full">
            <Calendar size={16} /> Nouvelle demande
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}><Loader size={16} /> Chargement...</p>
          </div>
        ) : demandes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Inbox size={48} style={{ opacity: 0.3 }} />
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "white" }}>Aucune demande</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Vous n'avez encore fait aucune demande. Utilisez le bouton ci-dessus pour créer votre première demande.
            </p>
            <button onClick={() => openNewDemande("CREATION")} className="btn-primary"><Calendar size={16} /> Créer une demande</button>
          </div>
        ) : (
          <div className="space-y-3">
            {demandes.map((d, i) => {
              const cfg = statutConfig[d.statut] || statutConfig.soumis;
              return (
                <div
                  key={d.id}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.08}s both` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {TYPE_LABELS[d.type_action] || d.type_action}
                      </h3>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span>{new Date(d.date_soumission).toLocaleDateString("fr-FR")}</span>
                      {d.titre && <span>· {d.titre}</span>}
                    </div>
                    {d.commentaire_admin && d.statut !== "soumis" && d.statut !== "en_analyse" && (
                      <p className="text-xs mt-1 italic" style={{ color: d.statut === "approuve" ? "var(--success)" : "var(--error)" }}>
                        {d.commentaire_admin}
                      </p>
                    )}
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                    style={{ border: "1px solid rgba(0,200,255,0.3)", color: "var(--primary)", background: "transparent" }}
                    onMouseEnter={(el) => el.currentTarget.style.background = "rgba(0,200,255,0.1)"}
                    onMouseLeave={(el) => el.currentTarget.style.background = "transparent"}
                    onClick={() => openDetail(d)}
                  >
                    Détails
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-xl rounded-2xl p-6 sm:p-8" style={{ background: "#152232", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
            {modalMode === "detail" && viewingDemande ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                    <FileText size={16} /> Détail de la demande
                  </h3>
                  <button onClick={() => setModalOpen(false)} className="text-xl" style={{ color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${(statutConfig[viewingDemande.statut] || statutConfig.soumis).cls}`}>
                      {(statutConfig[viewingDemande.statut] || statutConfig.soumis).label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,200,255,0.1)", color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {TYPE_LABELS[viewingDemande.type_action] || viewingDemande.type_action}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Soumise le {new Date(viewingDemande.date_soumission).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                    {viewingDemande.date_traitement && ` · Traitée le ${new Date(viewingDemande.date_traitement).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`}
                  </p>

                  {viewingDemande.affiche_url && (
                    <div className="rounded-xl overflow-hidden">
                      <img src={viewingDemande.affiche_url} alt="Affiche" className="w-full object-cover" style={{ maxHeight: "200px" }} />
                    </div>
                  )}

                  {viewingDemande.titre && (
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Événement</p>
                      <p className="text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{viewingDemande.titre}</p>
                    </div>
                  )}

                  {viewingDemande.description && (
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Description</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "pre-wrap" }}>{viewingDemande.description}</p>
                    </div>
                  )}

                  {viewingDemande.lieu && (
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Lieu</p>
                      <p className="text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{viewingDemande.lieu}</p>
                    </div>
                  )}

                  {viewingDemande.date_debut && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Date début</p>
                        <p className="text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{new Date(viewingDemande.date_debut).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {viewingDemande.date_fin && (
                        <div>
                          <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Date fin</p>
                          <p className="text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{new Date(viewingDemande.date_fin).toLocaleDateString("fr-FR")}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {viewingDemande.capacite > 0 && (
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Capacité</p>
                      <p className="text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{viewingDemande.capacite} places</p>
                    </div>
                  )}

                  {viewingDemande.commentaire_admin && viewingDemande.statut !== "soumis" && viewingDemande.statut !== "en_analyse" && (
                    <div className="p-3 rounded-xl" style={{ background: viewingDemande.statut === "approuve" ? "rgba(0,229,160,0.08)" : "rgba(255,77,109,0.08)", border: `1px solid ${viewingDemande.statut === "approuve" ? "rgba(0,229,160,0.2)" : "rgba(255,77,109,0.2)"}` }}>
                      <p className="text-[10px] font-medium mb-1" style={{ color: viewingDemande.statut === "approuve" ? "var(--success)" : "var(--error)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {viewingDemande.statut === "approuve" ? "Commentaire" : "Motif du refus"}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{viewingDemande.commentaire_admin}</p>
                    </div>
                  )}
                </div>
              </>
            ) : demandeSent ? (
              <div className="text-center py-6">
                <Check size={40} style={{ color: "var(--success)" }} />
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Demande soumise</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Votre demande a été transmise à l'équipe SenGuichet. Vous recevrez une réponse par email.
                </p>
                <button onClick={() => setModalOpen(false)} className="btn-primary mt-6">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {typeAction === "CREATION" ? <><Calendar size={16} /> Nouvel événement</> : typeAction === "MODIFICATION" ? <><Edit size={16} /> Modifier</> : <><X size={16} /> Supprimer</>}
                  </h3>
                  <button onClick={() => setModalOpen(false)} className="text-xl" style={{ color: "rgba(255,255,255,0.4)" }}><X size={18} /></button>
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--error)" }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Type de demande <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <select
                      required value={typeAction} onChange={(e) => setTypeAction(e.target.value)}
                      className="input-premium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {DEMANDE_TYPES.map((t) => (
                        <option key={t.value} value={t.value} style={{ color: "#1a1a2e" }}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {typeAction === "CREATION" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Titre de l'événement <span style={{ color: "var(--error)" }}>*</span>
                        </label>
                        <input required value={titre} onChange={(e) => setTitre(e.target.value)} className="input-premium" placeholder="Ex: Concert de Dakar" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Description <span style={{ color: "var(--error)" }}>*</span>
                        </label>
                        <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="input-premium" placeholder="Décrivez votre événement..." style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "vertical" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Lieu <span style={{ color: "var(--error)" }}>*</span>
                        </label>
                        <input required value={lieu} onChange={(e) => setLieu(e.target.value)} className="input-premium" placeholder="Ex: Place de l'Indépendance" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Date début <span style={{ color: "var(--error)" }}>*</span>
                          </label>
                          <input required type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input-premium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Date fin
                          </label>
                          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input-premium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Capacité <span style={{ color: "var(--error)" }}>*</span>
                        </label>
                        <input required type="number" min="1" value={capacite} onChange={(e) => setCapacite(e.target.value)} className="input-premium" placeholder="Ex: 500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Affiche de l'événement
                        </label>
                        <div
                          onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                          className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all"
                          style={{
                            border: `2px dashed ${uploading ? "rgba(255,183,71,0.4)" : affichePreview ? "rgba(0,200,255,0.4)" : "rgba(255,255,255,0.12)"}`,
                            background: affichePreview ? "transparent" : "rgba(255,255,255,0.03)",
                            minHeight: "140px",
                          }}
                          onMouseEnter={(e) => { if (!affichePreview && !uploading) e.currentTarget.style.borderColor = "rgba(0,200,255,0.4)"; }}
                          onMouseLeave={(e) => { if (!affichePreview && !uploading) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                        >
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader size={24} />
                              <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upload en cours...</p>
                            </div>
                          ) : affichePreview ? (
                            <div className="relative w-full">
                              <img src={affichePreview} alt="Aperçu" className="w-full object-cover rounded-xl" style={{ maxHeight: "200px" }} />
                              <button type="button" onClick={(e) => { e.stopPropagation(); setCloudinaryUrl(null); setAffichePreview(null); }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                style={{ background: "rgba(0,0,0,0.6)", color: "var(--error)", border: "none", cursor: "pointer" }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                              </svg>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cliquez pour ajouter une affiche</p>
                            </>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploading(true);
                            setAffichePreview(URL.createObjectURL(f));
                            try {
                              const url = await uploadToCloudinary(f);
                              setCloudinaryUrl(url);
                            } catch (err) {
                              setAffichePreview(null);
                              setError("Erreur upload affiche");
                            } finally {
                              setUploading(false);
                            }
                          }}
                        />
                      </div>

                      <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <Calendar size={16} /> Catégories de tickets <span style={{ color: "var(--error)" }}>*</span>
                          </label>
                          <button type="button" onClick={addCategory} className="text-xs px-3 py-1 rounded-lg transition-all"
                            style={{ background: "rgba(0,200,255,0.1)", color: "var(--primary)", border: "1px solid rgba(0,200,255,0.2)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,200,255,0.2)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,200,255,0.1)"; }}
                          >
                            + Ajouter
                          </button>
                        </div>
                        {categories.map((cat, i) => (
                          <div key={i} className="flex items-start gap-2 mb-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <input value={cat.nom} onChange={(e) => updateCategory(i, "nom", e.target.value)}
                                className="input-premium text-xs" placeholder="Nom (ex: VIP)" required
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                              <input type="number" min="1" value={cat.places} onChange={(e) => updateCategory(i, "places", e.target.value)}
                                className="input-premium text-xs" placeholder="Places" required
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                              <input type="number" min="0" value={cat.prix} onChange={(e) => updateCategory(i, "prix", e.target.value)}
                                className="input-premium text-xs" placeholder="Prix FCFA" required
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                            </div>
                            <button type="button" onClick={() => removeCategory(i)}
                              className="text-xs px-2 py-1 rounded-lg transition-all mt-0.5"
                              style={{ background: "rgba(255,77,109,0.1)", color: "var(--error)", border: "1px solid rgba(255,77,109,0.2)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.2)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.1)"; }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Ajoutez au moins une catégorie avec son nombre de places et son prix.
                        </p>
                      </div>
                    </>
                  )}

                  {typeAction !== "CREATION" && (
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Titre / Événement concerné
                      </label>
                      <input value={titre} onChange={(e) => setTitre(e.target.value)} className="input-premium" placeholder="Nom de l'événement concerné" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Message détaillé <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="input-premium"
                      placeholder={typeAction === "CREATION" ? "Informations complémentaires..." : "Décrivez les changements souhaités..."}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "vertical" }}
                    />
                  </div>

                  <button type="submit" disabled={sending} className="btn-primary w-full">
                    {sending ? <><Loader size={16} /> Envoi...</> : <><Send size={16} /> Envoyer la demande</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MesDemandes;
