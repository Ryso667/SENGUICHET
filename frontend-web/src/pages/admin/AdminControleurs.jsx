import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenementsControleurs } from "../../services/controleurService";
import { Shield, Loader } from "../../components/Icons";

const statutConfig = {
  en_attente: { label: "En attente", color: "#FFB347" },
  actif: { label: "Actif", color: "#00E5A0" },
  refuse: { label: "Refusé", color: "#FF4D6D" },
  suspendu: { label: "Suspendu", color: "#6B7280" },
  annule: { label: "Annulé", color: "#6B7280" },
};

const AdminControleurs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await adminListerEvenementsControleurs();
        setEvents(data);
      } catch (err) {
        console.error("Erreur chargement events controleurs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} style={{ color: "#00C8FF" }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
            Contrôleurs
          </h1>
        </div>

        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(0,200,255,0.08)", borderLeft: "4px solid #00C8FF" }}>
          <p className="text-sm" style={{ color: "#A0B4C8" }}>
            Gérez les codes d'accès des contrôleurs pour chaque événement. Chaque événement dispose d'un code unique à 4 chiffres.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} style={{ color: "#00C8FF" }} />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "#152232", border: "1px solid rgba(0,200,255,0.15)" }}>
            <p style={{ color: "#A0B4C8" }}>Aucun événement trouvé.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((e) => {
              const cfg = statutConfig[e.statut] || statutConfig.annule;
              return (
                <div
                  key={e.id}
                  className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
                  style={{ background: "#152232", border: "1px solid rgba(0,200,255,0.15)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>
                      {e.nom}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs" style={{ color: "#A0B4C8" }}>{e.date}</span>
                      <span className="text-xs" style={{ color: "#6B7280" }}>•</span>
                      <span className="text-xs" style={{ color: "#A0B4C8" }}>{e.lieu}</span>
                      <span className="text-xs" style={{ color: "#6B7280" }}>•</span>
                      <span className="text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
                      {e.code ? (
                        <>
                          <span className="text-xs" style={{ color: "#6B7280" }}>•</span>
                          <span className="text-xs font-mono font-bold" style={{ color: "#00C8FF", letterSpacing: "2px" }}>
                            Code : {e.code}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs" style={{ color: "#6B7280" }}>•</span>
                          <span className="text-xs" style={{ color: "#6B7280" }}>Pas de code</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/controleurs/${e.id}`)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                    style={{
                      background: "transparent",
                      border: "1px solid #00C8FF",
                      color: "#00C8FF",
                    }}
                    onMouseEnter={(el) => { el.currentTarget.style.background = "rgba(0,200,255,0.1)"; }}
                    onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}
                  >
                    Gérer le code
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminControleurs;
