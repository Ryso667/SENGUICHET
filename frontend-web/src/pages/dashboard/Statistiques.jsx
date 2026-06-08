import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import { listerEvenements } from "../../services/eventService";

const COLORS = ["#00E5A0", "#00C8FF", "#FFB347", "#FF4D6D", "#A78BFA"];

const Statistiques = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await listerEvenements();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalVendus = events.reduce((s, e) => s + (e.remplis || 0), 0);
  const totalCapacite = events.reduce((s, e) => s + (e.capacite || 0), 0);
  const totalRevenus = events.reduce((s, e) => {
    const num = parseInt((e.revenus || "0").replace(/\D/g, "")) || 0;
    return s + num;
  }, 0);
  const tauxRemplissage = totalCapacite > 0 ? Math.round((totalVendus / totalCapacite) * 100) : 0;

  const ventesData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      billets: totalVendus,
      revenus: totalRevenus,
    };
  });

  const catMap = {};
  events.forEach((e) => {
    const cat = e.categorie || "Autre";
    catMap[cat] = (catMap[cat] || 0) + (e.remplis || 0);
  });
  const categorieData = Object.entries(catMap).length
    ? Object.entries(catMap).map(([name, value]) => ({ name, value }))
    : [{ name: "Aucune donnée", value: 1 }];

  const revenusCumules = [
    { mois: "Ce mois", montant: totalRevenus },
    { mois: "Total", montant: totalRevenus },
  ];

  const remplissageData = events.length
    ? events.map((e) => ({
        nom: e.nom?.length > 18 ? e.nom.slice(0, 16) + "..." : e.nom || "Sans titre",
        taux: e.capacite > 0 ? Math.round((e.remplis / e.capacite) * 100) : 0,
      }))
    : [{ nom: "Aucun événement", taux: 0 }];

  if (loading) {
    return (
      <DashboardLayout title="Mes statistiques">
        <div className="flex items-center justify-center py-20">
          <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mes statistiques">
      <div className="max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Billets vendus", value: String(totalVendus) },
            { label: "Revenus", value: `${totalRevenus.toLocaleString()} FCFA` },
            { label: "Taux remplissage", value: `${tauxRemplissage} %` },
            { label: "Événements total", value: String(events.length) },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Aperçu des ventes (30 jours)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ventesData}>
                <defs>
                  <linearGradient id="ventesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="billets" stroke="#00E5A0" fill="url(#ventesGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Répartition par catégorie
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categorieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {categorieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Revenus
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenusCumules}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
                <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="montant" fill="#00C8FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Taux de remplissage par événement
            </h3>
            <div className="space-y-3">
              {remplissageData.map((e, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                    <span>{e.nom}</span>
                    <span>{e.taux}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${e.taux}%`,
                        height: "100%",
                        borderRadius: 4,
                        background: "linear-gradient(90deg, #00E5A0, #00C8FF)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistiques;
