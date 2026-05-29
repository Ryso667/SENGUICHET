import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const periods = ["7 jours", "30 jours", "3 mois", "Tout"];

const ventesData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}/05`,
  billets: Math.floor(10 + Math.random() * 60),
  revenus: Math.floor(50000 + Math.random() * 300000),
}));

const pieData = [
  { name: "Concert Thiossane Live", value: 320 },
  { name: "Gala de Charité", value: 180 },
  { name: "Tournoi UCAD", value: 250 },
  { name: "Festival Dakar", value: 97 },
];

const pieColors = ["#6366F1", "#FB923C", "#22C55E", "#F59E0B"];

const topEvents = [
  { nom: "Concert Thiossane Live", billets: 320, revenus: "3 200 000 F", taux: 78 },
  { nom: "Tournoi UCAD", billets: 250, revenus: "1 000 000 F", taux: 62 },
  { nom: "Gala de Charité", billets: 180, revenus: "2 700 000 F", taux: 55 },
  { nom: "Festival Dakar", billets: 97, revenus: "970 000 F", taux: 38 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 text-xs" style={{ border: "1px solid var(--border)" }}>
      <p className="font-medium text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name === "billets" ? "🎟 " : "💰 "}
          {p.name === "billets" ? `${p.value} billets` : `${(p.value / 1000).toFixed(0)}k FCFA`}
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

  return (
    <DashboardLayout title="Statistiques">
      <div className="flex gap-2 mb-6 flex-wrap">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: period === p ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
              color: period === p ? "#818CF8" : "var(--text-secondary)",
              border: period === p ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--border)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><span className="stat-value">847</span><span className="stat-label">Billets vendus</span></div>
        <div className="stat-card"><span className="stat-value">425 000 F</span><span className="stat-label">Revenus ce mois</span></div>
        <div className="stat-card"><span className="stat-value">73%</span><span className="stat-label">Taux remplissage</span></div>
        <div className="stat-card"><span className="stat-value">12</span><span className="stat-label">Événements total</span></div>
      </div>

      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>📈 Évolution des ventes</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={ventesData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={6} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="billets" stroke="#6366F1" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: "#6366F1", stroke: "#0A0B1A", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>🥧 Répartition par événement</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={<CustomPieLabel />}>
                {pieData.map((_, i) => (
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

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>🏆 Top événements</h3>
          <div className="space-y-4">
            {topEvents.map((e, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{e.nom}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{e.billets} billets</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${e.taux}%`, background: i === 0 ? "linear-gradient(90deg, #6366F1, #818CF8)" : i === 1 ? "linear-gradient(90deg, #FB923C, #FBBF24)" : i === 2 ? "linear-gradient(90deg, #22C55E, #4ADE80)" : "linear-gradient(90deg, #F59E0B, #FBBF24)" }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)", minWidth: 48, textAlign: "right" }}>{e.taux}%</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Revenus : {e.revenus}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistiques;
