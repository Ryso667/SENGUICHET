import React, { useState } from "react";
import EventCard from "../../components/EventCard";


const events = [
  { id: 1, title: "Concert de Youssou Ndour", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop", date: "2026-08-15T20:00:00", location: "Théâtre National Daniel Sorano, Dakar", category: "Concert", price: 15000, organizer: { name: "Événements Sénégal" }, isFeatured: true },
  { id: 2, title: "Festival International de Jazz", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop", date: "2026-09-22T18:00:00", location: "Place de l'Indépendance, Dakar", category: "Festival", price: 25000, organizer: { name: "Jazz SA" } },
  { id: 3, title: "Théâtre : Le Médecin malgré lui", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop", date: "2026-07-10T19:30:00", location: "Institut Français, Saint-Louis", category: "Théâtre", price: 8000, organizer: { name: "Théâtre du Soleil" } },
  { id: 4, title: "Marathon de Dakar", image: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&h=400&fit=crop", date: "2026-10-05T06:00:00", location: "Corniche Ouest, Dakar", category: "Sport", price: 5000, organizer: { name: "Fédération Athlétisme" }, isFeatured: true },
  { id: 5, title: "Conférence Tech Sénégal 2026", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", date: "2026-11-12T09:00:00", location: "Centre de Conférences King Fahd, Dakar", category: "Conférence", price: 35000, organizer: { name: "Tekki Labs" } },
  { id: 6, title: "Soirée Electro SAHEL", image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=600&h=400&fit=crop", date: "2026-08-30T23:00:00", location: "Club Nuit, Dakar", category: "Soirée", price: 10000, organizer: { name: "Electro SA" }, isSoldOut: true },
  { id: 7, title: "Exposition d'Art Contemporain", image: "https://images.unsplash.com/photo-1531913764164-f85c3e08bbf6?w=600&h=400&fit=crop", date: "2026-09-05T10:00:00", location: "Musée d'Art Africain, Dakar", category: "Culturel", price: 3000, organizer: { name: "Art Sénégal" } },
  { id: 8, title: "Tournoi de Lutte Traditionnelle", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop", date: "2026-12-20T15:00:00", location: "Arènes de Lutte, Dakar", category: "Sport", price: 12000, organizer: { name: "CNG" } },
];

const filters = ["Tous", "À venir", "Concert", "Festival"];

export default function Evenements() {
  const [filter, setFilter] = useState("Tous");

  const filteredEvents = filter === "Tous"
    ? events
    : events.filter((e) => e.category.startsWith(filter));

  return (
    <div className="min-h-screen">
      <section className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 max-w-6xl mx-auto">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            Tous les événements
          </h1>
          <p className="mb-6" style={{ color: "var(--color-text-secondary)" }}>
            Découvrez les meilleurs événements au Sénégal
          </p>
        </header>

        <div className="inline-flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              className={`btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))
          ) : (
            <p className="col-span-full text-center" style={{ color: "var(--color-text-secondary)" }}>
              Aucun événement trouvé
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
