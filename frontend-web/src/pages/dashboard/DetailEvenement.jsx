import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { detailEvenement } from "../../services/eventService";
import { soumettreDemandeEvenement } from "../../services/eventService";
import { Ticket, Calendar, Edit, X, Send, Loader, Check } from "../../components/Icons";
import { normalizeImageUrl } from "../../utils/normalizeUrl";

const DetailEvenement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("MODIFICATION");
  const [demandeMsg, setDemandeMsg] = useState("");
  const [demandeSent, setDemandeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await detailEvenement(id);
        setEventData(data);
      } catch (err) {
        navigate("/dashboard/evenements");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const openModal = (type) => {
    setModalType(type);
    setDemandeMsg("");
    setDemandeSent(false);
    setError("");
    setModalOpen(true);
  };

  const handleSendDemande = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const ev = eventData?.evenement;
      await soumettreDemandeEvenement({
        type_action: modalType,
        evenement_id: parseInt(id),
        titre: ev?.titre || "",
        description: demandeMsg,
        payload: { message: demandeMsg },
      });
      setDemandeSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={<span style={{display:"flex",alignItems:"center",gap:"8px"}}><Ticket size={20} /> Détail événement</span>}>
        <div className="flex items-center justify-center py-20">
          <p style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}><Loader size={16} /> Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!eventData) return null;

  const ev = eventData.evenement;
  const tickets = eventData.tickets || [];
  const dateStr = ev.date_debut
    ? new Date(ev.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const timeStr = ev.date_debut
    ? new Date(ev.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";
  const totalPlaces = tickets.reduce((s, t) => s + t.capacite, 0);
  const placesVendues = tickets.reduce((s, t) => s + (t.capacite - t.places_disponibles), 0);

  return (
    <DashboardLayout title={ev.titre}>
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6 sm:p-8 mb-6" style={{ animation: "fadeInUp 0.4s ease" }}>
          {ev.affiche_url ? (
            <div className="relative w-full overflow-hidden rounded-xl mb-6" style={{ height: "360px" }}>
              <img
                src={normalizeImageUrl(ev.affiche_url)}
                alt={ev.titre}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to top, rgba(10,11,26,0.95) 0%, rgba(10,11,26,0.25) 45%, transparent 65%)"
              }} />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${ev.statut === "actif" ? "badge-active" : ev.statut === "en_attente" ? "badge-pending" : "badge-sold-out"}`}>
                    {ev.statut === "actif" ? <><Calendar size={14} /> ACTIF</> : ev.statut === "en_attente" ? <><Ticket size={14} /> ATTENTE</> : ev.statut === "suspendu" ? <><X size={14} /> ANNULÉ</> : <><X size={14} /> TERMINÉ</>}
                  </span>
                  {ev.categorie && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>{ev.categorie}</span>}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{ev.titre}</h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{dateStr} à {timeStr}{ev.lieu ? ` · ${ev.lieu}${ev.ville ? `, ${ev.ville}` : ""}` : ""}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>{ev.titre}</h1>
                {ev.categorie && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{ev.categorie}</p>}
              </div>
              <span className={`badge ${ev.statut === "actif" ? "badge-active" : ev.statut === "en_attente" ? "badge-pending" : "badge-sold-out"}`}>
                {ev.statut === "actif" ? <><Calendar size={14} /> ACTIF</> : ev.statut === "en_attente" ? <><Ticket size={14} /> ATTENTE</> : ev.statut === "suspendu" ? <><X size={14} /> ANNULÉ</> : <><X size={14} /> TERMINÉ</>}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Date</p>
              <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{dateStr} à {timeStr}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Lieu</p>
              <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{ev.lieu}{ev.ville ? `, ${ev.ville}` : ""}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Capacité</p>
              <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{ev.capacite_totale} personnes</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Code</p>
              <p className="text-sm font-medium" style={{ color: "#818CF8", fontFamily: "monospace", letterSpacing: "2px" }}>{ev.scan_code}</p>
            </div>
          </div>

          {ev.description && (
            <div className="mb-6">
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{ev.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)" }}>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Places vendues</p>
              <p className="text-lg font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{placesVendues}/{totalPlaces}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Taux</p>
              <p className="text-lg font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>
                {totalPlaces > 0 ? Math.round((placesVendues / totalPlaces) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => openModal("MODIFICATION")} className="btn-ghost btn-md">
              <Edit size={16} /> Demander une modification
            </button>
            <button onClick={() => openModal("SUPPRESSION")} className="btn-danger btn-md">
              <X size={16} /> Demander la suppression
            </button>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 mb-6" style={{ animation: "fadeInUp 0.4s ease 0.1s both" }}>
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9", display:"flex", alignItems:"center", gap:"8px" }}><Calendar size={18} /> Catégories de tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Aucun billet configuré</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#F1F5F9" }}>{t.nom}</p>
                    {t.description && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{t.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {parseInt(t.prix).toLocaleString()} FCFA
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {t.capacite - t.places_disponibles}/{t.capacite} vendus
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-xl rounded-2xl p-6 sm:p-8" style={{ background: "#152232", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
            {demandeSent ? (
              <div className="text-center py-6">
                <Check size={40} style={{ color: "var(--success)" }} />
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Demande envoyée</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  L'équipe SenGuichet examinera votre demande et vous tiendra informé.
                </p>
                <button onClick={() => setModalOpen(false)} className="btn-primary mt-6">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {modalType === "SUPPRESSION" ? <><X size={16} /> Demander la suppression</> : <><Edit size={16} /> Demander une modification</>}
                  </h3>
                  <button onClick={() => setModalOpen(false)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--error)" }}>{error}</div>
                )}
                <form onSubmit={handleSendDemande} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Détails de la demande <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <textarea
                      required rows={5} value={demandeMsg} onChange={(e) => setDemandeMsg(e.target.value)}
                      className="input-premium"
                      placeholder={modalType === "SUPPRESSION" ? "Raison de la suppression..." : "Décrivez les modifications souhaitées..."}
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

export default DetailEvenement;
