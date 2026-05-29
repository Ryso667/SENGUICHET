import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { detailEvenement } from "../../services/eventService";

const DetailEvenement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <DashboardLayout title="Détail de l'événement">
        <div className="flex items-center justify-center py-20">
          <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>{ev.titre}</h1>
              {ev.categorie && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{ev.categorie}</p>}
            </div>
            <span className={`badge ${ev.statut === "actif" ? "badge-active" : ev.statut === "en_attente" ? "badge-pending" : "badge-sold-out"}`}>
              {ev.statut === "actif" ? "Actif" : ev.statut === "en_attente" ? "En attente" : ev.statut === "suspendu" ? "Suspendu" : ev.statut === "refuse" ? "Refusé" : "Annulé"}
            </span>
          </div>

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
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Scan Code</p>
              <p className="text-sm font-medium" style={{ color: "#818CF8", fontFamily: "monospace", letterSpacing: "2px" }}>{ev.scan_code}</p>
            </div>
          </div>

          {ev.description && (
            <div className="mb-6">
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{ev.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Places vendues</p>
              <p className="text-lg font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{placesVendues}/{totalPlaces}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Taux de remplissage</p>
              <p className="text-lg font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>
                {totalPlaces > 0 ? Math.round((placesVendues / totalPlaces) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(`/dashboard/evenements/${id}/modifier`)} className="btn-primary btn-md">
              ✏️ Modifier
            </button>
            {ev.statut === "actif" ? (
              <button onClick={() => navigate(`/dashboard/evenements/${id}/annuler`)} className="btn-danger btn-md">
                ❌ Annuler
              </button>
            ) : null}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8" style={{ animation: "fadeInUp 0.4s ease 0.1s both" }}>
          <h2 className="text-lg font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Types de billets</h2>
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
    </DashboardLayout>
  );
};

export default DetailEvenement;
