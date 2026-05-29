import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Accueil from "./pages/Accueil";
import Connexion from "./pages/auth/ConnexionOrganisateur";
import InscriptionOrganisateur from "./pages/auth/InscriptionOrganisateur";
import DashboardHome from "./pages/dashboard/DashboardHome";
import MesEvenements from "./pages/dashboard/MesEvenements";
import CreerEvenement from "./pages/dashboard/CreerEvenement";
import DetailEvenement from "./pages/dashboard/DetailEvenement";
import ModifierEvenement from "./pages/dashboard/ModifierEvenement";
import AnnulerEvenement from "./pages/dashboard/AnnulerEvenement";
import GestionBillets from "./pages/dashboard/GestionBillets";
import GestionEquipe from "./pages/dashboard/GestionEquipe";
import Statistiques from "./pages/dashboard/Statistiques";
import Parametres from "./pages/dashboard/Parametres";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganisateurs from "./pages/admin/AdminOrganisateurs";
import AdminEvenements from "./pages/admin/AdminEvenements";
import EnAttenteValidation from "./pages/EnAttenteValidation";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#0A0B1A]">
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/inscription" element={<InscriptionOrganisateur />} />
            <Route path="/admin/connexion" element={<Navigate to="/connexion" replace />} />
            <Route path="/en-attente" element={<EnAttenteValidation />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/evenements" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><MesEvenements /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/creer" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><CreerEvenement /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><DetailEvenement /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/modifier" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><ModifierEvenement /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/annuler" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><AnnulerEvenement /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/billets" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><GestionBillets /></ProtectedRoute>} />
            <Route path="/dashboard/evenements/:id/equipe" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><GestionEquipe /></ProtectedRoute>} />
            <Route path="/dashboard/statistiques" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><Statistiques /></ProtectedRoute>} />
            <Route path="/dashboard/parametres" element={<ProtectedRoute allowedRoles={["ORGANISATEUR"]}><Parametres /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/organisateurs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminOrganisateurs /></ProtectedRoute>} />
            <Route path="/admin/evenements" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminEvenements /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/connexion" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
