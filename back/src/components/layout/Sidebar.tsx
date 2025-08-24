import React, { useState } from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    // État pour gérer l'ouverture/fermeture du sous-menu commandes
    const [commandesOpen, setCommandesOpen] = useState(false);

    const menuItems = [
        {
            path: "/dashboard",
            name: "Dashboard",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
            ),
        },
        {
            path: "/candidatures",
            name: "Candidatures",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            badge: 3, // 3 candidatures en attente
        },
        {
            path: "/franchises",
            name: "Franchises",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path
                        fillRule="evenodd"
                        d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            path: "/gestion-financiere",
            name: "Gestion Financière",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            path: "/camions",
            name: "Camions",
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                </svg>
            ),
            badge: 1, // 1 camion en panne
        },
    ];

    // Sous-menu pour la section Commandes
    const commandesSubItems = [
        {
            path: "/commandes/stocks",
            name: "Stocks & Articles",
        },
        {
            path: "/commandes/suivi",
            name: "Suivi Commandes",
        },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r border-gray-200 ${
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center mb-8 px-2">
                        <div
                            className="flex items-center justify-center w-10 h-10 rounded-lg mr-3"
                            style={{ backgroundColor: "#5C95FF" }}
                        >
                            <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Driv'n Cook</h1>
                            <p className="text-sm text-gray-500">Dashboard Admin</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        {/* Menu items normaux */}
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                        isActive
                                            ? "text-white shadow-md"
                                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive
                                        ? {
                                            background: `linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)`,
                                        }
                                        : {}
                                }
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span className="flex-1">{item.name}</span>
                                {item.badge && (
                                    <span
                                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white rounded-full"
                                        style={{ backgroundColor: "#F87575" }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}

                        {/* Section Gestion Commandes avec sous-menu */}
                        <div>
                            {/* Bouton principal Gestion Commandes */}
                            <button
                                onClick={() => setCommandesOpen(!commandesOpen)}
                                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-all duration-200 group hover:text-gray-900 hover:bg-gray-100"
                            >
                                <span className="mr-3">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                                        <path d="M13.293 7.293a1 1 0 011.414 0L17 9.586V17a1 1 0 01-1 1h-1v-4a3 3 0 00-3-3H8a3 3 0 00-3 3v4H4a1 1 0 01-1-1V9.586l2.293-2.293a1 1 0 011.414 0L10 10.586l3.293-3.293z" />
                                    </svg>
                                </span>
                                <span className="flex-1 text-left">Gestion Commandes</span>
                                <svg
                                    className={`w-4 h-4 transform transition-transform duration-200 ${commandesOpen ? 'rotate-180' : ''}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Sous-menu déroulant */}
                            <div className={`overflow-hidden transition-all duration-300 ${commandesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="ml-6 mt-1 space-y-1">
                                    {commandesSubItems.map((subItem) => (
                                        <NavLink
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={({ isActive }) =>
                                                `flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? "text-white shadow-sm"
                                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                }`
                                            }
                                            style={({ isActive }) =>
                                                isActive
                                                    ? {
                                                        background: `linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)`,
                                                    }
                                                    : {}
                                            }
                                        >
                                            <span className="mr-2 text-base">{subItem.icon}</span>
                                            <span>{subItem.name}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* Bottom section */}
                    <div className="absolute bottom-4 left-3 right-3">
                        <div
                            className="p-4 rounded-lg border"
                            style={{ backgroundColor: "#B9E6FF20", borderColor: "#B9E6FF" }}
                        >
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                                Aide & Support
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Besoin d'aide ? Consultez notre documentation
                            </p>
                            <button
                                className="w-full px-3 py-2 text-xs font-medium text-white rounded-md transition-colors"
                                style={{ backgroundColor: "#5C95FF" }}
                            >
                                Voir la doc
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;