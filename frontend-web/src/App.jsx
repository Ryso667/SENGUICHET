import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Accueil from "./pages/Accueil";
import Connexion from "./pages/auth/ConnexionOrganisateur";
import MentionsLegales from "./pages/MentionsLegales";
import Confidentialite from "./pages/Confidentialite";
import InscriptionOrganisateur from "./pages/auth/InscriptionOrganisateur";
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
import EnAttenteValidation from "./pages/EnAttenteValidation";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0D1B2A]">
          <Routes>
            <Route element={<><Outlet /><Footer /></>}>
              <Route path="/" element={<Accueil />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<InscriptionOrganisateur />} />
              <Route path="/admin/connexion" element={<Navigate to="/connexion" replace />} />
              <Route path="/en-attente" element={<EnAttenteValidation />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
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

            <Route path="*" element={<Navigate to="/connexion" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
