import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import PaiementModal from "../components/PaiementModal";
import BackgroundPattern from "../components/BackgroundPattern";

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
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [achatCategories, setAchatCategories] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDropdownOpen]);

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

        if (cats.length > 0) setSelectedCategory(cats[0]);

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

  // Détecter le retour OTP : dès que les catégories sont chargées et que
  // sessionStorage contient les quantités, ouvrir le modal de paiement
  useEffect(() => {
    const storedQ = sessionStorage.getItem("@senguichet_quantities");
    const storedId = sessionStorage.getItem("@senguichet_event_id");
    if (!storedQ || storedId !== id || categories.length === 0) return;
    sessionStorage.removeItem("@senguichet_quantities");
    sessionStorage.removeItem("@senguichet_event_id");
    const saved = JSON.parse(storedQ);
    const restoredCart = categories
      .filter(c => saved[c.id || c.nom] > 0)
      .map(c => ({ id: c.id, nom: c.nom, prix: c.prix, quantite: saved[c.id || c.nom] }));
    if (restoredCart.length > 0) {
      setCart(restoredCart);
      setAchatCategories(restoredCart);
      setShowPaiement(true);
    }
  }, [categories, id]);

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

  const totalTickets = cart.reduce((sum, c) => sum + c.quantite, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.prix * c.quantite, 0);

  const location = event.ville ? `${event.lieu}, ${event.ville}` : event.lieu;
  const estTermine = event.date_fin && new Date(event.date_fin) < new Date();
  const autresEvenements = allEvents.filter((e) => e.id !== event.id).slice(0, 3);

  return (
    <BackgroundPattern>
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

              {/* Dropdown de sélection de catégorie */}
              <div className="detail-cat-wrap" ref={dropdownRef}>
                <button
                  className="detail-cat-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  type="button"
                >
                  {selectedCategory ? (
                    <>
                      <div className="detail-cat-trigger-info">
                        <div className="detail-cat-trigger-name">{selectedCategory.nom}</div>
                        {selectedCategory.description && (
                          <div className="detail-cat-trigger-detail">{selectedCategory.description}</div>
                        )}
                        <div className="detail-cat-selected-info">
                          <span className="detail-cat-selected-dot" />
                          {selectedCategory.places_disponibles ?? selectedCategory.capacite} places
                        </div>
                      </div>
                      <div className="detail-cat-trigger-right">
                        <span className="detail-cat-trigger-price">{formatPrice(selectedCategory.prix)}</span>
                        <svg className={`detail-cat-chevron${isDropdownOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="detail-cat-trigger-placeholder">Choisissez une catégorie</span>
                      <svg className={`detail-cat-chevron${isDropdownOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="detail-cat-panel">
                    {categories.map((ticket) => {
                      const isSoldOut = (ticket.places_disponibles ?? ticket.capacite) === 0;
                      const isSelected = selectedCategory && (ticket.id || ticket.nom) === (selectedCategory.id || selectedCategory.nom);
                      return (
                        <button
                          key={ticket.id || ticket.nom}
                          className={`detail-cat-option${isSelected ? ' active' : ''}${isSoldOut ? ' soldout' : ''}`}
                          onClick={() => {
                            if (!isSoldOut) {
                              setSelectedCategory(ticket);
                              setSelectedQuantity(prev => Math.max(1, prev));
                              setIsDropdownOpen(false);
                            }
                          }}
                          type="button"
                          disabled={isSoldOut}
                        >
                          <div className="detail-cat-option-info">
                            <div className="detail-cat-option-name">{ticket.nom}</div>
                            {ticket.description && (
                              <div className="detail-cat-option-desc">{ticket.description}</div>
                            )}
                          </div>
                          <div className="detail-cat-option-right">
                            <span className="detail-cat-option-price">{formatPrice(ticket.prix)}</span>
                            {isSoldOut ? (
                              <span className="detail-cat-soldout-label">Épuisé</span>
                            ) : (
                              <span className="detail-cat-option-places">
                                {ticket.places_disponibles ?? ticket.capacite} places
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="detail-cat-option-check" style={{ background: "#15803D" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sélecteur de quantité */}
              {selectedCategory && (
                <div style={{ marginBottom: 12 }}>
                  <div className="detail-qty-label">Quantité</div>
                  <div className="detail-qty-wrap">
                    <button
                      className="detail-qty-wrap-btn"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      disabled={selectedQuantity <= 1}
                      type="button"
                    >−</button>
                    <span className="detail-qty-wrap-value">{selectedQuantity}</span>
                    <button
                      className="detail-qty-wrap-btn"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      type="button"
                    >+</button>
                  </div>
                </div>
              )}

              {/* Bouton Ajouter au panier */}
              {selectedCategory && (
                <button
                  className="btn-primary btn-full"
                  style={{ marginBottom: cart.length > 0 ? 16 : 0, background: "transparent", color: "#15803D", border: "1.5px solid #15803D", boxShadow: "none" }}
                  onClick={() => {
                    const key = selectedCategory.id || selectedCategory.nom;
                    setCart(prev => {
                      const existing = prev.find(c => (c.id || c.nom) === key);
                      if (existing) {
                        return prev.map(c =>
                          (c.id || c.nom) === key
                            ? { ...c, quantite: c.quantite + selectedQuantity }
                            : c
                        );
                      }
                      return [...prev, { id: selectedCategory.id, nom: selectedCategory.nom, prix: selectedCategory.prix, quantite: selectedQuantity }];
                    });
                  }}
                >
                  + Ajouter au panier
                </button>
              )}

              {/* Liste du panier */}
              {cart.length > 0 && (
                <div style={{ marginTop: 4, marginBottom: 16 }}>
                  <div className="detail-qty-label" style={{ textAlign: "left", marginBottom: 8 }}>Votre sélection</div>
                  {cart.map((item) => (
                    <div key={item.id || item.nom} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                      background: "#F9FAFB", border: "1px solid #E5E7EB"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F2937" }}>{item.nom}</span>
                        <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>× {item.quantite}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#15803D" }}>{formatPrice(item.prix * item.quantite)}</span>
                        <button
                          onClick={() => setCart(prev => prev.filter(c => (c.id || c.nom) !== (item.id || item.nom)))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 2, display: "flex" }}
                          type="button"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {estTermine ? (
                <div className="detail-terminé-badge" style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
                  <span style={{ color: "#991B1B", fontWeight: 700, fontSize: "1rem" }}>🏁 Événement terminé</span>
                  <p style={{ color: "#7F1D1D", fontSize: "0.85rem", marginTop: 4 }}>La date de cet événement est passée. La vente de billets n'est plus disponible.</p>
                </div>
              ) : (
                <>
                  {cart.length > 0 && (
                    <div className="detail-total-row">
                      <span className="detail-total-label">Total</span>
                      <span className="detail-total-price">{formatPrice(totalPrice)}</span>
                    </div>
                  )}
                  <button
                    className="btn-primary btn-full btn-lg"
                    disabled={cart.length === 0}
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      const token = localStorage.getItem("jwt_token") || sessionStorage.getItem("@senguichet_jwt");
                      if (!token) {
                        const q = {};
                        cart.forEach(c => { q[c.id || c.nom] = c.quantite; });
                        sessionStorage.setItem("@senguichet_quantities", JSON.stringify(q));
                        sessionStorage.setItem("@senguichet_event_id", id);
                        navigate("/connexion-acheteur", { state: { from: `/evenements/${id}` } });
                        return;
                      }
                      setAchatCategories(cart);
                      setShowPaiement(true);
                    }}
                  >
                    <IconTicket size={20} />
                    {cart.length === 0
                      ? "Ajoutez des billets"
                      : `Acheter ${totalTickets} billet${totalTickets > 1 ? "s" : ""} — ${formatPrice(totalPrice)}`}
                  </button>
                </>
              )}

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

      {achatCategories && (
        <PaiementModal
          open={showPaiement}
          onClose={() => { setShowPaiement(false); setAchatCategories(null); }}
          evenementId={event.id}
          categories={achatCategories}
          titre={event.titre}
        />
      )}
    </motion.div>
    </BackgroundPattern>
  );
}
