import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerOrganisateurs } from "../../services/authService";

const badgeMap = {
  VALIDE: { class: "badge-active", label: "Actif" },
};

const AdminOrganisateurs = () => {
  const [orgas, setOrgas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgas = async () => {
      try {
        const data = await adminListerOrganisateurs();
        setOrgas(data);
      } catch (err) {
        console.error("Erreur chargement organisateurs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgas();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B1A] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#F1F5F9" }}>Gestion des organisateurs</h1>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Nom", "Email", "Téléphone", "Date inscription", "Événements", "Statut"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgas.map((o) => {
                    const b = badgeMap[o.statut] || badgeMap.VALIDE;
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white font-medium">{o.nom}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.email}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.telephone}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.date}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{o.nb_evenements}</td>
                        <td className="px-4 py-3"><span className={`badge ${b.class}`}>{b.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orgas.length === 0 && (
                <p className="text-center py-10" style={{ color: "var(--text-secondary)" }}>Aucun organisateur.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrganisateurs;
