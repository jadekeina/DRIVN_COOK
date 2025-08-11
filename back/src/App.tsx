import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Candidatures from './pages/Candidature';
import Franchises from './pages/Franchises';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Pour l'instant en dur

    // Pour l'instant on simule l'auth
    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router>
            <div className="flex h-screen bg-gray-50">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Overlay mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-10 bg-gray-900/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main content */}
                <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
                    sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
                }`}>
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
                            <Route path="/profile" element={<Profile />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
}

export default App;