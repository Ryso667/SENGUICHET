import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";

const COLORS = ["#00E5A0", "#00C8FF", "#FFB347", "#FF4D6D", "#A78BFA"];

const Statistiques = () => {
  const ventesData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/05`,
    billets: 0,
    revenus: 0,
  }));

  const categorieData = [
    { name: "Standard", value: 0 },
    { name: "VIP", value: 0 },
    { name: "Gold", value: 0 },
    { name: "Early Bird", value: 0 },
  ];

  const revenusCumules = Array.from({ length: 12 }, (_, i) => ({
    mois: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][i],
    montant: 0,
  }));

  const remplissageData = [
    { nom: "Aucun événement", taux: 0 },
  ];

  return (
    <DashboardLayout title="Mes statistiques">
      <div className="max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Billets vendus", value: "0" },
            { label: "Revenus ce mois", value: "0 FCFA" },
            { label: "Taux remplissage", value: "0 %" },
            { label: "Événements total", value: "0" },
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
              Évolution des ventes (30 derniers jours)
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
              Revenus cumulés
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
              Taux de remplissage
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
