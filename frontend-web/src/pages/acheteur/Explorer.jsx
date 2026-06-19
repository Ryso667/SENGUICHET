import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { listerEvenementsPublic } from "../../services/eventService";
import EventCard from "../../components/EventCard";

export default function Explorer() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categorie, setCategorie] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const CATEGORIES = ["Concert", "Festival", "Sport", "Théâtre", "Conférence", "Atelier", "Autre"];

  useEffect(() => {
    listerEvenementsPublic()
      .then(data => setEvents(Array.isArray(data) ? data : data.evenements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = events;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(e => (e.titre || "").toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q) || (e.lieu || "").toLowerCase().includes(q));
    }
    if (categorie) list = list.filter(e => e.categorie === categorie);
    return list;
  }, [events, query, categorie]);

  return (
    <div className="min-h-screen" style={{ background: "#F0F4F8" }}>
      <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: "rgba(240,244,248,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: "#E8EEF4", background: "#FFFFFF", color: "#1a1a1a" }} />
            {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="p-2.5 rounded-xl border"
            style={{ borderColor: "#E8EEF4", background: showFilters ? "rgba(21,128,61,0.1)" : "#FFFFFF", cursor: "pointer" }}>
            <SlidersHorizontal size={18} style={{ color: showFilters ? "#15803D" : "#64748B" }} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button onClick={() => setCategorie("")}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: !categorie ? "#15803D" : "#FFFFFF",
              color: !categorie ? "#FFFFFF" : "#64748B",
              border: !categorie ? "none" : "1px solid #E8EEF4",
              cursor: "pointer",
            }}>
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategorie(c === categorie ? "" : c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background: categorie === c ? "#15803D" : "#FFFFFF",
                color: categorie === c ? "#FFFFFF" : "#64748B",
                border: categorie === c ? "none" : "1px solid #E8EEF4",
                cursor: "pointer",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="rounded-[20px]" style={{ paddingBottom: "140%", background: "#E8EEF4", animation: "pulse 2s infinite" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={40} className="mx-auto mb-3" style={{ color: "#94a3b8" }} />
            <p style={{ color: "#64748B" }}>Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {filtered.map(e => (
              <div key={e.id} onClick={() => navigate(`/evenements/${e.id}`)} style={{ cursor: "pointer" }}>
                <EventCard {...e} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
