import React, { useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center">
          {/* Menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Breadcrumb ou titre de page */}
          <div className="hidden lg:block ml-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-500">
              Gérez vos candidatures et franchises
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">




          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: "#5C95FF" }}
              >
                A
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">admin@drivncook.com</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Mon Profil
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Paramètres
                </a>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
