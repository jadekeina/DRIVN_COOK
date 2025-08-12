import React, { useState, useEffect } from 'react';
import {
    Truck,
    Package,
    TrendingUp,
    MapPin,
    Calendar,
    DollarSign,
    Users,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
    User,
    ChevronDown
} from 'lucide-react';

const FranchiseDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        chiffre_affaires_mois: 0,
        nombre_commandes_mois: 0,
        clients_mois: 0,
        pourcentage_objectif: 0
    });
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Récupérer les données depuis l'API
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Charger les données utilisateur
            const userResponse = await fetch('http://localhost:3002/api/auth/profile', { headers });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData.data);
            }

            // TODO: Ajouter les appels API pour les stats

        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: color }}
                >
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        {/* Logo */}
                        <div className="flex items-center">
                            <div className="flex items-center">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                                    style={{ backgroundColor: '#5C95FF' }}
                                >
                                    <Truck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold" style={{ color: '#7E6C6C' }}>Driv'n Cook</h1>
                                    <p className="text-xs text-gray-500">Espace Franchisé</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Desktop */}
                        <nav className="hidden md:flex space-x-8">
                            <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-4 px-1 text-sm font-medium">
                                Dashboard
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">
                                Mon Camion
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">
                                Mes Commandes
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">
                                Mes Ventes
                            </a>
                        </nav>

                        {/* User Menu Desktop */}
                        <div className="hidden md:flex items-center space-x-4">
                            <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                        style={{ backgroundColor: '#7E6C6C' }}
                                    >
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-700">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">Franchisé</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {/* Dropdown User Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <User className="w-4 h-4 mr-3" />
                                            Mon Profil
                                        </a>
                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <Settings className="w-4 h-4 mr-3" />
                                            Paramètres
                                        </a>
                                        <hr className="my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Déconnexion
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200 bg-white">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a href="#" className="block px-3 py-2 text-blue-600 bg-blue-50 rounded-md text-base font-medium">
                                    Dashboard
                                </a>
                                <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md text-base font-medium">
                                    Mon Camion
                                </a>
                                <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md text-base font-medium">
                                    Mes Commandes
                                </a>
                                <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md text-base font-medium">
                                    Mes Ventes
                                </a>
                            </div>
                            <div className="border-t border-gray-200 pt-4 pb-3">
                                <div className="flex items-center px-5">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                        style={{ backgroundColor: '#7E6C6C' }}
                                    >
                                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">
                                            {user?.first_name} {user?.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">Franchisé</div>
                                    </div>
                                </div>
                                <div className="mt-3 px-2 space-y-1">
                                    <a href="#" className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md text-base font-medium">
                                        Mon Profil
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-base font-medium"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Bonjour {user?.first_name} ! 👋
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Voici un aperçu de votre activité franchisée
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="CA ce mois"
                        value="€2,450"
                        icon={DollarSign}
                        color="#28a745"
                        subtitle="+12% vs mois dernier"
                    />
                    <StatCard
                        title="Commandes"
                        value="8"
                        icon={Package}
                        color="#5C95FF"
                        subtitle="Ce mois"
                    />
                    <StatCard
                        title="Clients servis"
                        value="142"
                        icon={Users}
                        color="#FFA9A3"
                        subtitle="Ce mois"
                    />
                    <StatCard
                        title="Objectif"
                        value="78%"
                        icon={TrendingUp}
                        color="#7E6C6C"
                        subtitle="De l'objectif mensuel"
                    />
                </div>

                {/* Main Content Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Mon Camion - Plus large */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <Truck className="w-6 h-6 mr-3" style={{ color: '#5C95FF' }} />
                                Mon Camion
                            </h3>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                En service
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Immatriculation</span>
                                    <span className="font-medium">AB-123-CD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Modèle</span>
                                    <span className="font-medium">Food Truck Premium</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Dernière maintenance</span>
                                    <span className="font-medium">15 déc. 2024</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-gray-600 block mb-2">Emplacement actuel</span>
                                    <div className="flex items-center text-gray-900 font-medium">
                                        <MapPin className="w-4 h-4 mr-2" style={{ color: '#5C95FF' }} />
                                        Place Bastille, Paris 75011
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        className="w-full py-2 px-4 text-white rounded-lg hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: '#5C95FF' }}
                                    >
                                        Changer d'emplacement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activité Récente */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                            <Calendar className="w-6 h-6 mr-3" style={{ color: '#5C95FF' }} />
                            Activité Récente
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Vente enregistrée</p>
                                    <p className="text-sm text-gray-600">€145 - Aujourd'hui 14h30</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Commande livrée</p>
                                    <p className="text-sm text-gray-600">Entrepôt Est - Hier 9h00</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-1">
                                    <Truck className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Nouveau déplacement</p>
                                    <p className="text-sm text-gray-600">Place Bastille - Hier 8h00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Rapides */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Actions Rapides</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
                            <DollarSign className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Saisir une vente</span>
                        </button>
                        <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
                            <Package className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Passer commande</span>
                        </button>
                        <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
                            <MapPin className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Changer d'emplacement</span>
                        </button>
                        <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
                            <Truck className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Signaler un problème</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                style={{ backgroundColor: '#5C95FF' }}
                            >
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-gray-600">© 2024 Driv'n Cook - Espace Franchisé</span>
                        </div>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-500 hover:text-gray-700">Support</a>
                            <a href="#" className="text-gray-500 hover:text-gray-700">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FranchiseDashboard;