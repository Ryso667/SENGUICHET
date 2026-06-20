import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import { adminListerEvenements } from "../../services/eventService";
import { adminListerOrganisateurs } from "../../services/authService";
import { Calendar, Users, FileText, ShieldCheck, Plus, Eye, UserPlus, Printer } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * AdminDashboard — Page d'accueil de l'administration.
 * Affiche les statistiques clés, un graphique d'évolution, les actions rapides,
 * et les listes des derniers événements/organisateurs.
 * Chiffres dynamiques depuis l'API (événements et organisateurs).
 */

/* ─── Couleur pastel par hash (GitHub-style) ─── */
const hashPastel = (str) => {
  if (!str) return { bg: "#E0F2FE", text: "#0284C7" };
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 35 + (Math.abs(hash * 7) % 25);
  const l = 60 + (Math.abs(hash * 13) % 20);
  return {
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    text: `hsl(${h}, ${Math.min(s + 20, 80)}%, ${Math.max(l - 40, 15)}%)`,
  };
};

/* ─── Données mockées pour le graphique ─── */
const genererDonnees = (jours) => {
  const data = [];
  const now = new Date();
  for (let i = jours - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      créés: Math.floor(Math.random() * 5) + 1,
      billets: Math.floor(Math.random() * 120) + 30,
    });
  }
  return data;
};

const donnees7j = genererDonnees(7);
const donnees30j = genererDonnees(30);

/* ─── Helper statut ─── */
const statutInfos = (s) => {
  if (s === "actif" || s === "ACTIF") return { label: "Actif", couleur: "#16a34a", dot: "green" };
  if (s === "en_attente" || s === "EN_ATTENTE" || s === "SOUMIS" || s === "soumis") return { label: "En attente", couleur: "#f59e0b", dot: "yellow" };
  if (s === "suspendu" || s === "SUSPENDU" || s === "refusé" || s === "REFUSÉ") return { label: "Suspendu", couleur: "#ef4444", dot: "red" };
  return { label: s || "Inconnu", couleur: "#6B7280", dot: "gray" };
};

/* ─── Skeleton ─── */
const SqueletteCarte = () => (
  <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: "#E8EEF4" }}>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
      <div className="flex-1">
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const SqueletteLigne = () => (
  <div className="flex items-center gap-3 py-3 px-3">
    <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
    <div className="flex-1">
      <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mb-1" />
      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
    </div>
    <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
  </div>
);

/* ─── Page ─── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [evenements, setEvenements] = useState([]);
  const [organisateurs, setOrganisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [periode, setPeriode] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [events, orgs] = await Promise.all([
          adminListerEvenements(),
          adminListerOrganisateurs(),
        ]);
        setEvenements(events || []);
        setOrganisateurs(orgs || []);
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
      } finally {
        setChargement(false);
      }
    };
    fetchData();
  }, []);

  const totalEvenements = evenements.length;
  const actifs = evenements.filter((e) => e.statut === "actif" || e.statut === "ACTIF").length;
  const enAttente = evenements.filter((e) => {
    const s = e.statut;
    return s === "en_attente" || s === "EN_ATTENTE" || s === "SOUMIS" || s === "soumis";
  }).length;
  const totalOrgs = organisateurs.length;

  const statCards = [
    { label: "Événements total", valeur: totalEvenements, icon: Calendar, couleur: "#16a34a" },
    { label: "Événements actifs", valeur: actifs, icon: ShieldCheck, couleur: "#3b82f6" },
    { label: "En attente", valeur: enAttente, icon: FileText, couleur: "#f59e0b" },
    { label: "Organisateurs", valeur: totalOrgs, icon: Users, couleur: "#8b5cf6" },
  ];

  const actions = [
    { label: "Créer un événement", icon: Plus, chemin: "/admin/evenements", degrade: "from-blue-500 to-indigo-600", desc: "Nouvel événement sur la plateforme" },
    { label: "Voir les demandes", icon: Eye, chemin: "/admin/demandes", degrade: "from-emerald-500 to-teal-600", desc: "Demandes en attente de validation" },
    { label: "Ajouter organisateur", icon: UserPlus, chemin: "/admin/organisateurs", degrade: "from-orange-500 to-pink-600", desc: "Inviter un nouvel organisateur" },
  ];

  const derniersEvenements = [...evenements]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  const derniersOrgs = [...organisateurs]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F4F8" }}>
      <AdminSidebar />
      <div className="flex-1 lg:ml-[260px] flex flex-col relative">

        {/* Watermark logo super géant en fond */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <img src="/images/logo-400.png" alt="" className="w-full max-w-[1200px] opacity-[0.06]" />
        </div>

        {/* ─── Header ─── */}
        <header className="sticky top-0 z-10 px-4 sm:px-8 py-4" style={{ background: "rgba(240,244,248,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8EEF4" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs mb-0.5" style={{ color: "#94a3b8" }}>
                <span>Dashboard</span>
                <span>/</span>
                <span style={{ color: "#64748B" }}>Aperçu</span>
              </div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#1a1a1a" }}>
                Aperçu général
              </h1>
              <p className="text-sm mt-0.5 capitalize" style={{ color: "#94a3b8" }}>{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="admin-export-btn admin-hide-print"
                style={{ background: "#FFFFFF", border: "1px solid #E8EEF4", color: "#64748B" }}>
                <Printer size={14} /> Imprimer
              </button>
              <p className="text-xs capitalize admin-hide-print" style={{ color: "#94a3b8" }}>{today}</p>
            </div>
          </div>
        </header>

        {/* ─── Main ─── */}
        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-6 relative z-[1]">

          {/* ─── Cartes statistiques ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {chargement
              ? Array.from({ length: 4 }).map((_, i) => <SqueletteCarte key={i} />)
              : statCards.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="bg-white rounded-2xl p-5 transition-all"
                      style={{
                        border: "1px solid #E8EEF4",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div className="flex items-center gap-4 relative z-[1]">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${s.couleur}10` }}
                        >
                          <Icon size={22} style={{ color: s.couleur }} />
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold" style={{ color: "#1a1a1a", lineHeight: 1.2 }}>
                            {s.valeur}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* ─── Actions rapides + Graphique ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h2 className="text-base font-bold mb-6" style={{ color: "#1a1a1a" }}>Actions rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {actions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.label}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(a.chemin)}
                      className="text-left p-5 rounded-xl bg-white transition-all"
                      style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${a.degrade}`}>
                        <Icon size={20} style={{ color: "#FFFFFF" }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{a.label}</p>
                      <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{a.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Graphique */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold" style={{ color: "#1a1a1a" }}>Évolution</h2>
                <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "#F1F5F9" }}>
                  <button
                    onClick={() => setPeriode(7)}
                    className="px-3 py-1 text-xs font-medium rounded-md transition-all"
                    style={{
                      background: periode === 7 ? "#FFFFFF" : "transparent",
                      color: periode === 7 ? "#1a1a1a" : "#94a3b8",
                      boxShadow: periode === 7 ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    7j
                  </button>
                  <button
                    onClick={() => setPeriode(30)}
                    className="px-3 py-1 text-xs font-medium rounded-md transition-all"
                    style={{
                      background: periode === 30 ? "#FFFFFF" : "transparent",
                      color: periode === 30 ? "#1a1a1a" : "#94a3b8",
                      boxShadow: periode === 30 ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    30j
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={periode === 7 ? donnees7j : donnees30j}>
                  <defs>
                    <linearGradient id="courbeCreer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="courbeBillets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #E8EEF4",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area type="monotone" dataKey="créés" stroke="#16a34a" strokeWidth={2} fill="url(#courbeCreer)" />
                  <Area type="monotone" dataKey="billets" stroke="#3b82f6" strokeWidth={2} fill="url(#courbeBillets)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── Listes ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Événements récents */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold" style={{ color: "#1a1a1a" }}>Événements récents</h2>
                <button
                  onClick={() => navigate("/admin/evenements")}
                  className="text-xs font-medium"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#1a1a1a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
                >
                  Voir tous →
                </button>
              </div>
              {chargement ? (
                Array.from({ length: 4 }).map((_, i) => <SqueletteLigne key={i} />)
              ) : derniersEvenements.length === 0 ? (
                <div className="admin-empty-state">
                  <Calendar size={32} />
                  <h3>Aucun événement</h3>
                  <p>Les événements créés apparaîtront ici</p>
                </div>
              ) : (
                derniersEvenements.map((e) => {
                  const s = statutInfos(e.statut);
                  const c = hashPastel(e.nom || e.id);
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 py-3 px-3 rounded-xl transition-all cursor-pointer"
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                      onMouseEnter={(el) => { el.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {(e.nom?.charAt(0) || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{e.nom}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>{e.organisateur || e.email || ""}</p>
                      </div>
                      <span
                        className="text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
                        style={{ background: `${s.couleur}12`, color: s.couleur, borderRadius: "20px", padding: "3px 10px" }}
                      >
                        <span className={`admin-pulse-dot admin-pulse-dot--${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  );
                })
              )}
              <button
                onClick={() => navigate("/admin/evenements")}
                className="w-full mt-4 text-sm font-medium rounded-xl py-3 transition-all"
                style={{ border: "1px solid #E8EEF4", color: "#64748B", background: "#FFFFFF" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              >
                Voir tous les événements
              </button>
            </div>

            {/* Organisateurs */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8EEF4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold" style={{ color: "#1a1a1a" }}>Nouveaux organisateurs</h2>
                <button
                  onClick={() => navigate("/admin/organisateurs")}
                  className="text-xs font-medium"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#1a1a1a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
                >
                  Voir tous →
                </button>
              </div>
              {chargement ? (
                Array.from({ length: 4 }).map((_, i) => <SqueletteLigne key={i} />)
              ) : derniersOrgs.length === 0 ? (
                <div className="admin-empty-state">
                  <Users size={32} />
                  <h3>Aucun organisateur</h3>
                  <p>Les organisateurs inscrits apparaîtront ici</p>
                </div>
              ) : (
                derniersOrgs.map((o) => {
                  const c = hashPastel(o.nom || o.email || o.id);
                  const initiale = (o.nom?.charAt(0) || o.email?.charAt(0) || "?").toUpperCase();
                  return (
                    <div
                      key={o.id || o.email}
                      className="flex items-center gap-3 py-3 px-3 rounded-xl transition-all"
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                      onMouseEnter={(el) => { el.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {initiale}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{o.nom || "Inconnu"}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>{o.email}</p>
                      </div>
                      <span
                        className="text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
                        style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a", borderRadius: "20px", padding: "3px 10px" }}
                      >
                        <span className="admin-pulse-dot admin-pulse-dot--green" />
                        Actif
                      </span>
                    </div>
                  );
                })
              )}
              <button
                onClick={() => navigate("/admin/organisateurs")}
                className="w-full mt-4 text-sm font-medium rounded-xl py-3 transition-all"
                style={{ border: "1px solid #E8EEF4", color: "#64748B", background: "#FFFFFF" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              >
                Gérer les organisateurs
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
