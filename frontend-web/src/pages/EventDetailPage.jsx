import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  IconMapPin,
  IconHeart,
  IconHeartFilled,
  IconShare,
  IconCheck,
  IconCalendar,
  IconTicket,
  IconArrowLeft,
} from "@tabler/icons-react";
import { detailEvenementPublic, listerEvenementsPublic } from "../services/eventService";
import EventCard from "../components/EventCard";

const formatDateLong = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return isoString;
  }
};

const formatPrice = (price) => {
  if (price == null) return "";
  return `${price.toLocaleString("fr-FR")} CFA`;
};

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantities, setQuantities] = useState({});
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailData, allData] = await Promise.all([
          detailEvenementPublic(id),
          listerEvenementsPublic(),
        ]);
        const ev = detailData.evenement || detailData;
        setEvent(ev);
        const cats = detailData.categories || [];
        setCategories(cats);

        const initQ = {};
        cats.forEach((c) => { initQ[c.id || c.nom] = 0; });
        setQuantities(initQ);

        const list = Array.isArray(allData) ? allData : allData.evenements || [];
        setAllEvents(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !event) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <IconTicket size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
            <h2 className="text-xl font-bold mb-2">Événement introuvable</h2>
            <p className="text-gray-500 mb-4">{error || "Cet événement n'existe pas ou a été supprimé."}</p>
            <Link to="/evenements" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
              <IconArrowLeft size={16} /> Retour aux événements
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = categories.reduce(
    (sum, t) => sum + t.prix * (quantities[t.id || t.nom] || 0), 0
  );

  const location = event.ville ? `${event.lieu}, ${event.ville}` : event.lieu;
  const autresEvenements = allEvents.filter((e) => e.id !== event.id).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>

        <section className="detail-hero">
          <img
            src={event.affiche_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop"}
            alt={event.titre}
            className="detail-hero-img"
          />
          <div className="detail-hero-overlay" />
          <div className="detail-hero-content">
            <div className="detail-hero-badges">
              <span className="detail-hero-badge detail-hero-badge--cat">
                {event.categorie}
              </span>
              <span className="detail-hero-badge detail-hero-badge--dispo">
                Disponible
              </span>
            </div>
            <h1 className="detail-hero-title">{event.titre}</h1>
            <div className="detail-hero-meta">
              <span><IconCalendar size={16} /> {formatDateLong(event.date_debut)}</span>
              <span><IconMapPin size={16} /> {location}</span>
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <main className="detail-main">
            {event.description && (
              <section className="detail-section">
                <h2 className="detail-section-title">À propos</h2>
                <p className="detail-description">{event.description}</p>
              </section>
            )}

            <section className="detail-section">
              <h2 className="detail-section-title">Lieu</h2>
              <div className="detail-venue-card">
                <div className="detail-venue-info">
                  <h3 className="detail-venue-name">{event.lieu}</h3>
                  {event.ville && <p className="detail-venue-address">{event.ville}</p>}
                </div>
              </div>
            </section>
          </main>

          <aside className="detail-sidebar">
            <div className="detail-purchase-card">
              <h3 className="detail-purchase-title">Billets</h3>

              {categories.length === 0 && (
                <p className="text-sm text-gray-500 py-4">Aucun billet disponible pour le moment.</p>
              )}

              {categories.map((ticket) => {
                const isSoldOut = (ticket.places_disponibles ?? ticket.capacite) === 0;
                const key = ticket.id || ticket.nom;
                return (
                  <div key={key} className="detail-ticket-row">
                    <div className="detail-ticket-info">
                      <span className="detail-ticket-type">{ticket.nom}</span>
                      {ticket.description && (
                        <span className="text-xs text-gray-400 block">{ticket.description}</span>
                      )}
                      {isSoldOut ? (
                        <span className="detail-ticket-soldout">Épuisé</span>
                      ) : (
                        <span className="detail-ticket-left">
                          {ticket.places_disponibles ?? ticket.capacite} places
                        </span>
                      )}
                    </div>
                    <div className="detail-ticket-right">
                      <span className="detail-ticket-price">{formatPrice(ticket.prix)}</span>
                      {!isSoldOut && (
                        <div className="detail-qty-selector">
                          <button
                            className="detail-qty-btn"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [key]: Math.max(0, (prev[key] || 0) - 1),
                              }))
                            }
                            disabled={!quantities[key]}
                          >
                            −
                          </button>
                          <span className="detail-qty-value">{quantities[key] || 0}</span>
                          <button
                            className="detail-qty-btn"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [key]: (prev[key] || 0) + 1,
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {totalTickets > 0 && (
                <div className="detail-total-row">
                  <span className="detail-total-label">Total</span>
                  <span className="detail-total-price">{formatPrice(totalPrice)}</span>
                </div>
              )}

              <button
                className="btn-primary btn-full btn-lg"
                disabled={totalTickets === 0}
                style={{ marginTop: 16 }}
              >
                <IconTicket size={20} />
                {totalTickets === 0
                  ? "Choisissez vos billets"
                  : `Acheter ${totalTickets} billet${totalTickets > 1 ? "s" : ""}`}
              </button>

              <div className="detail-purchase-trust">
                <span><IconCheck size={14} /> Billet envoyé par email</span>
                <span><IconCheck size={14} /> Paiement sécurisé</span>
              </div>

              <div className="detail-purchase-actions">
                <button
                  className="detail-purchase-action-btn"
                  onClick={() => setIsFav(!isFav)}
                  aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  {isFav ? <IconHeartFilled size={18} color="var(--color-error)" /> : <IconHeart size={18} />}
                  <span>Sauvegarder</span>
                </button>
                <button className="detail-purchase-action-btn">
                  <IconShare size={18} />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </aside>
        </div>

        {autresEvenements.length > 0 && (
          <section className="detail-other-section">
            <h2 className="detail-section-title">Autres événements</h2>
            <div className="detail-other-grid">
              {autresEvenements.map((e) => (
                <Link key={e.id} to={`/evenements/${e.id}`} style={{ textDecoration: "none" }}>
                  <EventCard {...e} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="detail-back-wrapper">
          <Link to="/evenements" className="btn-ghost btn-md" style={{ textDecoration: "none" }}>
            <IconArrowLeft size={16} /> Retour aux événements
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
