import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const menuItems = [
        {
            path: '/dashboard',
            name: 'Dashboard',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
            ),
        },
        {
            path: '/candidatures',
            name: 'Candidatures',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
            ),
            badge: 3, // Nombre de candidatures en attente
        },
        {
            path: '/franchises',
            name: 'Franchises',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            path: '/profile',
            name: 'Profil',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            ),
        },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r border-gray-200 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center mb-8 px-2">
                        <div
                            className="flex items-center justify-center w-10 h-10 rounded-lg mr-3"
                            style={{ backgroundColor: '#5C95FF' }}
                        >
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                        isActive
                                            ? 'text-white shadow-md'
                                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
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
                                        style={{ backgroundColor: '#F87575' }}
                                    >
                    {item.badge}
                  </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    <div className="absolute bottom-4 left-3 right-3">
                        <div
                            className="p-4 rounded-lg border"
                            style={{ backgroundColor: '#B9E6FF20', borderColor: '#B9E6FF' }}
                        >
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                                Aide & Support
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Besoin d'aide ? Consultez notre documentation
                            </p>
                            <button
                                className="w-full px-3 py-2 text-xs font-medium text-white rounded-md transition-colors"
                                style={{ backgroundColor: '#5C95FF' }}
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