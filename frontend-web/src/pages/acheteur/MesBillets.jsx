import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Calendar, MapPin, Search, X } from "lucide-react";
import { mesBillets } from "../../services/billetService";
import { useAuth } from "../../context/AuthContext";

export default function MesBillets() {
  const navigate = useNavigate();
  const { userEmail, isAuthenticated } = useAuth();
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("actifs");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/connexion-acheteur", { state: { from: "/acheteur/mes-billets" }, replace: true });
      return;
    }
    (async () => {
      try {
        const email = userEmail || localStorage.getItem("@senguichet_acheteur_email");
        if (!email) return;
        const data = await mesBillets(email);
        const list = Array.isArray(data) ? data : data.billets || [];
        setBillets(list);
      } catch { } finally { setLoading(false); }
    })();
  }, [isAuthenticated, userEmail]);

  const { actifs, passes } = useMemo(() => {
    const now = new Date();
    const a = []; const p = [];
    (billets || []).forEach(b => {
      if (b.date_debut && new Date(b.date_debut) < now) p.push(b);
      else a.push(b);
    });
    return { actifs: a, passes: p };
  }, [billets]);

  const displayed = activeTab === "actifs" ? actifs : passes;

  return (
    <div className="min-h-screen p-4" style={{ background: "#F0F4F8" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4" style={{ color: "#1a1a1a" }}>Mes billets</h1>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab("actifs")}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === "actifs" ? "#15803D" : "#FFFFFF",
              color: activeTab === "actifs" ? "#FFFFFF" : "#64748B",
              border: activeTab === "actifs" ? "none" : "1px solid #E8EEF4",
              cursor: "pointer",
            }}>
            Actifs ({actifs.length})
          </button>
          <button onClick={() => setActiveTab("passes")}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === "passes" ? "#15803D" : "#FFFFFF",
              color: activeTab === "passes" ? "#FFFFFF" : "#64748B",
              border: activeTab === "passes" ? "none" : "1px solid #E8EEF4",
              cursor: "pointer",
            }}>
            Passés ({passes.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ background: "#E8EEF4", animation: "pulse 2s infinite" }} />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12">
            <Ticket size={48} className="mx-auto mb-3" style={{ color: "#94a3b8" }} />
            <p style={{ color: "#64748B" }}>{activeTab === "actifs" ? "Aucun billet actif" : "Aucun billet passé"}</p>
            {activeTab === "actifs" && (
              <Link to="/acheteur/explorer" className="inline-block mt-3 text-sm font-medium" style={{ color: "#15803D" }}>
                Explorer les événements
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((b, i) => {
              const datePart = b.date_debut ? new Date(b.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
              return (
                <motion.div key={b.uuid || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/acheteur/billet/${b.uuid}`} style={{ textDecoration: "none" }}>
                    <div className="rounded-2xl p-4 border flex items-center gap-4 hover:shadow-md transition-all"
                      style={{ background: "#FFFFFF", borderColor: "#E8EEF4", borderLeft: `4px solid ${b.statut === "ACTIF" ? "#15803D" : "#94a3b8"}` }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "#1a1a1a" }}>{b.evenement_titre || b.evenement_nom}</p>
                        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: "#64748B" }}>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {datePart}</span>
                          {b.evenement_lieu && <span className="flex items-center gap-1"><MapPin size={12} /> {b.evenement_lieu}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: b.statut === "ACTIF" ? "rgba(21,128,61,0.1)" : "rgba(148,163,184,0.1)",
                          color: b.statut === "ACTIF" ? "#15803D" : "#64748B",
                        }}>
                        {b.statut === "ACTIF" ? "Valide" : "Utilisé"}
                      </span>
                      <Ticket size={18} style={{ color: "#15803D" }} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
