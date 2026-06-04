// Fichier : Statistiques.jsx
// Rôle : Page de statistiques — les données sont chargées depuis l'API ; si indisponibles,
//        un message "Non disponibles" s'affiche au lieu de données aléatoires

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { getToken } from "../../utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const periods = ["7 jours", "30 jours", "3 mois", "Tout"];

const pieColors = ["#00C8FF", "#0077FF", "#00E5A0", "#818CF8"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 text-xs" style={{ border: "1px solid var(--border)" }}>
      <p className="font-medium text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name === "billets" ? "🎟 " : p.name === "montant" ? "💰 " : "📊 "}
          {p.name === "billets" ? `${p.value} billets` : p.name === "montant" ? `${(p.value / 1000).toFixed(0)}k FCFA` : `${p.value}%`}
        </p>
      ))}
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.6)" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const Statistiques = () => {
  const [period, setPeriod] = useState("30 jours");
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/evenements/statistiques`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.status === 204) {
          setStatsData(null);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur serveur");
        setStatsData(data);
        setError(null);
      } catch (err) {
        console.error("Erreur chargement statistiques:", err);
        setError(err.message);
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Données mockées conservées pour l'affichage graphique uniquement si l'API échoue
  // Sera remplacé par API
  const ventesData = statsData?.ventes_par_jour || [];
  const categorieData = statsData?.repartition_categories || [];
  const revenusCumules = statsData?.revenus_cumules || [];
  const remplissageData = statsData?.taux_remplissage || [];
  const statsCards = statsData?.cartes || null;

  if (loading) {
    return (
      <DashboardLayout title="Mes statistiques">
        <div className="max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <p style={{ color: "var(--text-secondary)" }}>Chargement des statistiques...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !statsData) {
    return (
      <DashboardLayout title="Mes statistiques">
        <div className="max-w-6xl">
          <div className="glass-card p-12 text-center">
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-secondary)" }}>
              Statistiques non disponibles
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {error}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mes statistiques">
      <div className="max-w-6xl">
        <div className="flex gap-2 mb-6 flex-wrap">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: period === p ? "rgba(0,200,255,0.15)" : "rgba(255,255,255,0.04)",
                color: period === p ? "#818CF8" : "var(--text-secondary)",
                border: period === p ? "1px solid rgba(0,200,255,0.3)" : "1px solid var(--border)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card"><span className="stat-value">{statsCards?.billets_vendus ?? "—"}</span><span className="stat-label">Billets vendus</span></div>
          <div className="stat-card"><span className="stat-value">{statsCards?.revenus_mois ?? "—"}</span><span className="stat-label">Revenus ce mois</span></div>
          <div className="stat-card"><span className="stat-value">{statsCards?.taux_remplissage ?? "—"}</span><span className="stat-label">Taux remplissage</span></div>
          <div className="stat-card"><span className="stat-value">{statsCards?.evenements_total ?? "—"}</span><span className="stat-label">Événements total</span></div>
        </div>

        {ventesData.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>📈 Ventes par jour</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ventesData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C8FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00C8FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="billets" stroke="#00C8FF" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: "#00C8FF", stroke: "var(--bg)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {categorieData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>🥧 Répartition par catégorie</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categorieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={<CustomPieLabel />}>
                    {categorieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}
                    formatter={(value) => <span style={{ color: "rgba(255,255,255,0.6)" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {revenusCumules.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>💰 Revenus cumulés</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenusCumules}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mois" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="montant" fill="#00C8FF" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {remplissageData.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>📊 Taux de remplissage par événement</h3>
            <div className="space-y-4">
              {remplissageData.map((e, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{e.nom}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{e.taux}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${e.taux}%`,
                          background: e.taux >= 70
                            ? "linear-gradient(90deg, #00C8FF, #0077FF)"
                            : e.taux >= 50
                            ? "linear-gradient(90deg, #0077FF, #818CF8)"
                            : "linear-gradient(90deg, #818CF8, #A0B4C8)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!statsData && (
          <div className="glass-card p-12 text-center">
            <p style={{ color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Aucune donnée de statistique disponible pour le moment.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Statistiques;
