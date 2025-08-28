import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Truck,
    Package,
    TrendingUp,
    Bell,
    Menu,
    X,
    User,
    ChevronDown,
    ShoppingCart,
    Settings,
    LogOut,
} from "lucide-react";

const FranchiseHeader = () => {
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const userResponse = await fetch(
                "http://localhost:3002/api/auth/profile",
                { headers }
            );
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData.data);
            }
        } catch (error) {
            console.error("Erreur chargement utilisateur:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const isActivePage = (path) => {
        return location.pathname === path;
    };

    const navigationItems = [
        { path: "/franchise-dashboard", label: "Dashboard", icon: TrendingUp },
        { path: "/mes-commandes", label: "Mes Commandes", icon: Package },
        { path: "/mes-ventes", label: "Mes Ventes", icon: ShoppingCart },
        { path: "#", label: "Mon Camion", icon: Truck },
    ];

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/franchise-dashboard" className="flex items-center">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                                style={{ backgroundColor: "#5C95FF" }}
                            >
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-xl font-bold"
                                    style={{ color: "#7E6C6C" }}
                                >
                                    Driv'n Cook
                                </h1>
                                <p className="text-xs text-gray-500">Espace Franchisé</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex space-x-8">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActivePage(item.path);

                            return item.path === "#" ? (
                                <span
                                    key={item.path}
                                    className="text-gray-400 pb-4 px-1 text-sm font-medium cursor-not-allowed"
                                >
                  {item.label}
                </span>
                            ) : (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`pb-4 px-1 text-sm font-medium transition-colors flex items-center ${
                                        isActive
                                            ? "border-b-2"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                    style={isActive ? {
                                        color: "#5C95FF",
                                        borderBottomColor: "#5C95FF"
                                    } : {}}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Menu Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                            <Bell className="w-5 h-5" />
                            <span
                                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                                style={{ backgroundColor: "#F87575" }}
                            ></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: "#7E6C6C" }}
                                >
                                    {user?.first_name?.[0]}
                                    {user?.last_name?.[0]}
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
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <User className="w-4 h-4 mr-3" />
                                        Mon Profil
                                    </a>
                                    <a
                                        href="#"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Settings className="w-4 h-4 mr-3" />
                                        Paramètres
                                    </a>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                                        style={{ color: "#F87575" }}
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
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActivePage(item.path);

                                return item.path === "#" ? (
                                    <span
                                        key={item.path}
                                        className="block px-3 py-2 text-gray-400 rounded-md text-base font-medium cursor-not-allowed"
                                    >
                    <Icon className="w-4 h-4 inline mr-2" />
                                        {item.label}
                  </span>
                                ) : (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                                            isActive
                                                ? "bg-gray-50"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                        style={isActive ? { color: "#5C95FF" } : {}}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Icon className="w-4 h-4 inline mr-2" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-200 pt-4 pb-3">
                            <div className="flex items-center px-5">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                    style={{ backgroundColor: "#7E6C6C" }}
                                >
                                    {user?.first_name?.[0]}
                                    {user?.last_name?.[0]}
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">
                                        {user?.first_name} {user?.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">Franchisé</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <a
                                    href="#"
                                    className="block px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md text-base font-medium"
                                >
                                    Mon Profil
                                </a>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-base font-medium"
                                    style={{ color: "#F87575" }}
                                >
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default FranchiseHeader;