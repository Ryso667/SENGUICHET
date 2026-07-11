import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import PartnershipPage from "./pages/PartnershipPage";
import Connexion from "./pages/auth/ConnexionOrganisateur";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import InscriptionOrganisateur from "./pages/auth/InscriptionOrganisateur";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import MesEvenements from "./pages/dashboard/MesEvenements";
import DetailEvenement from "./pages/dashboard/DetailEvenement";
import GestionBillets from "./pages/dashboard/GestionBillets";
import GestionEquipe from "./pages/dashboard/GestionEquipe";
import Statistiques from "./pages/dashboard/Statistiques";
import Parametres from "./pages/dashboard/Parametres";
import MesDemandes from "./pages/dashboard/MesDemandes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganisateurs from "./pages/admin/AdminOrganisateurs";
import AdminEvenements from "./pages/admin/AdminEvenements";
import AdminPartenaires from "./pages/admin/AdminPartenaires";
import AdminGestionPartenaires from "./pages/admin/AdminGestionPartenaires";
import AdminGestionDemandes from "./pages/admin/AdminGestionDemandes";
import AdminControleurs from "./pages/admin/AdminControleurs";
import AdminCodesControleurs from "./pages/admin/AdminCodesControleurs";
import EnAttenteValidation from "./pages/EnAttenteValidation";
import Unauthorized from "./pages/Unauthorized";
import { ToastProvider } from "./context/ToastContext";
import CommandPalette from "./components/CommandPalette";
import KeyboardShortcutsOverlay from "./components/KeyboardShortcutsOverlay";
import BackgroundPattern from "./components/BackgroundPattern";

import ConnexionAcheteur from "./pages/acheteur/ConnexionAcheteur";
import MesBillets from "./pages/acheteur/MesBillets";
import BilletDetail from "./pages/acheteur/BilletDetail";
import Compte from "./pages/acheteur/Compte";
import Explorer from "./pages/acheteur/Explorer";
import AcheteurLayout from "./layouts/AcheteurLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <CommandPalette />
        <KeyboardShortcutsOverlay />
        <div className="min-h-screen bg-bg">
          <Routes>
            <Route element={<BackgroundPattern><div className="pb-16 md:pb-0"><Navbar /><Outlet /><Footer /><BottomNav /></div></BackgroundPattern>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/evenements" element={<EventsPage />} />
              <Route path="/evenements/:id" element={<EventDetailPage />} />
              <Route path="/partenariat" element={<PartnershipPage />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<InscriptionOrganisateur />} />
              <Route path="/admin/connexion" element={<Navigate to="/connexion" replace />} />
              <Route path="/en-attente" element={<EnAttenteValidation />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ORGANISATEUR", "PARTENAIRE"]}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/evenements" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><MesEvenements /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><DetailEvenement /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/billets" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><GestionBillets /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/equipe" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><GestionEquipe /></ProtectedRoute>} />
            <Route path="/dashboard/statistiques" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><Statistiques /></ProtectedRoute>} />
            <Route path="/dashboard/parametres" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><Parametres /></ProtectedRoute>} />
            <Route path="/dashboard/demandes" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><MesDemandes /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/organisateurs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminOrganisateurs /></ProtectedRoute>} />
            <Route path="/admin/evenements" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminEvenements /></ProtectedRoute>} />
            <Route path="/admin/partenaires" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPartenaires /></ProtectedRoute>} />
            <Route path="/admin/partenaires/gestion" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminGestionPartenaires /></ProtectedRoute>} />
            <Route path="/admin/demandes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminGestionDemandes /></ProtectedRoute>} />
            <Route path="/admin/controleurs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminControleurs /></ProtectedRoute>} />
            <Route path="/admin/controleurs/:evenementId" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminCodesControleurs /></ProtectedRoute>} />

            <Route path="/connexion-acheteur" element={<ConnexionAcheteur />} />
            <Route path="/acheteur" element={<AcheteurLayout />}>
              <Route index element={<Navigate to="accueil" replace />} />
              <Route path="accueil" element={<HomePage />} />
              <Route path="explorer" element={<Explorer />} />
              <Route path="mes-billets" element={<MesBillets />} />
              <Route path="billet/:uuid" element={<BilletDetail />} />
              <Route path="compte" element={<Compte />} />
            </Route>

            <Route path="*" element={<Navigate to="/connexion" replace />} />
          </Routes>
        </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
