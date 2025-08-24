import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Tes composants existants
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Candidatures from "./pages/Candidature";
import Franchises from "./pages/Franchises";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";

// Nouveau module Gestion Financière
import GestionFinanciere from "./pages/GestionFinanciere";
import GestionStocks  from "./pages/GestionStocks.tsx";
import ObligationsMensuelles from "./pages/ObligationsMensuelles.tsx";
import SuivieCommandes from "./pages/SuivieCommandes.tsx";


// Autres composants existants
import FranchiseesManagement from "./pages/FranchiseesManagement";
import Camions from "./pages/Camions";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);

        // Vérifier que c'est bien un admin
        if (userData.role === 'admin') {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Utilisateur admin restauré:', userData);
        } else {
          // Pas admin, on nettoie
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.log('Utilisateur non admin, déconnexion');
        }
      } catch (error) {
        console.error('Erreur parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Gérer la connexion depuis le composant Login
  const handleLogin = (userData: User, token: string) => {
    console.log('Connexion API réussie:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    console.log('Déconnexion');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Affichage pendant le chargement initial
  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
    );
  }

  // Si pas connecté, afficher la page de connexion
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
      <Router>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Overlay mobile */}
          {sidebarOpen && (
              <div
                  className="fixed inset-0 z-10 bg-gray-900/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
              />
          )}

          {/* Main content */}
          <div
              className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
                  sidebarOpen ? "lg:ml-64" : "lg:ml-0"
              }`}
          >
            {/* Header */}
            <Header
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                onLogout={handleLogout}
            />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/candidatures" element={<Candidatures />} />
                <Route path="/franchises" element={<Franchises />} />


                <Route path="/gestion-financiere" element={<GestionFinanciere />} />
                <Route path="/commandes/stocks" element={<GestionStocks />} />
                <Route path="/commandes/suivi" element={<SuivieCommandes />} />
                <Route path="/commandes/obligations" element={<ObligationsMensuelles />} />


                <Route path="/camions" element={<Camions />} />
                <Route path="/franchisees" element={<FranchiseesManagement />} />
                <Route path="/profile" element={<Profile />} />

                {/* Route 404 */}
                <Route path="*" element={
                  <div className="p-6">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Page non trouvée</h1>
                      <p className="text-gray-600 mb-4">La page que vous cherchez n'existe pas.</p>
                      <button
                          onClick={() => window.location.href = '/dashboard'}
                          className="text-white px-4 py-2 rounded-lg hover:opacity-90"
                          style={{ backgroundColor: "#5C95FF" }}
                      >
                        Retour au dashboard
                      </button>
                    </div>
                  </div>
                } />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
  );
}

export default App;