import React, { useState } from 'react';

const Profile: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        firstName: 'Admin',
        lastName: 'Driv\'n Cook',
        email: 'admin@drivncook.com',
        phone: '01 23 45 67 89',
        role: 'Administrateur'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileSave = () => {
        // Ici on ferait l'appel API pour sauvegarder le profil
        console.log('Sauvegarde profil:', profileData);
    };

    const handlePasswordChange = () => {
        // Ici on ferait l'appel API pour changer le mot de passe
        console.log('Changement mot de passe');
    };

    const tabs = [
        { id: 'profile', name: 'Profil', icon: '👤' },
        { id: 'security', name: 'Sécurité', icon: '🔒' },
        { id: 'settings', name: 'Paramètres', icon: '⚙️' }
    ];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-gray-600">Gérez vos informations personnelles et paramètres</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {/* Avatar */}
                        <div className="text-center mb-6">
                            <div
                                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
                                style={{ backgroundColor: '#5C95FF' }}
                            >
                                {profileData.firstName[0]}{profileData.lastName[0]}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {profileData.firstName} {profileData.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">{profileData.role}</p>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === tab.id
                                            ? 'text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    style={
                                        activeTab === tab.id
                                            ? { background: 'linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)' }
                                            : {}
                                    }
                                >
                                    <span className="mr-3">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>

                        {/* Quick Stats */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Activité récente</h4>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-gray-600">Dernière connexion: Aujourd'hui</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                    <span className="text-gray-600">12 candidatures traitées</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                                    <span className="text-gray-600">3 franchises créées</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Tab content */}
                        {activeTab === 'profile' && (
                            <div className="p-6">
                                <div className="border-b border-gray-200 pb-4 mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                                    <p className="text-gray-600">Modifiez vos informations de base</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Téléphone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleProfileSave}
                                        className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                        style={{ backgroundColor: '#5C95FF' }}
                                    >
                                        Sauvegarder les modifications
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="p-6">
                                <div className="border-b border-gray-200 pb-4 mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
                                    <p className="text-gray-600">Gérez votre mot de passe et la sécurité de votre compte</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mot de passe actuel
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmer le nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                            style={{ '--tw-ring-color': '#5C95FF' } as React.CSSProperties}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handlePasswordChange}
                                        className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                        style={{ backgroundColor: '#F87575' }}
                                    >
                                        Changer le mot de passe
                                    </button>
                                </div>

                                {/* Security info */}
                                <div
                                    className="mt-8 p-4 rounded-lg border"
                                    style={{ backgroundColor: '#B9E6FF20', borderColor: '#B9E6FF' }}
                                >
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Conseils de sécurité</h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Utilisez un mot de passe complexe avec au moins 8 caractères</li>
                                        <li>• Mélangez lettres majuscules, minuscules, chiffres et symboles</li>
                                        <li>• Ne réutilisez pas ce mot de passe sur d'autres sites</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="p-6">
                                <div className="border-b border-gray-200 pb-4 mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Paramètres</h2>
                                    <p className="text-gray-600">Configurez vos préférences d'utilisation</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'Nouvelles candidatures', desc: 'Recevoir une notification pour chaque nouvelle candidature' },
                                                { name: 'Candidatures approuvées', desc: 'Notification quand une candidature est approuvée' },
                                                { name: 'Nouvelles franchises', desc: 'Notification pour les nouvelles franchises créées' }
                                            ].map((setting, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{setting.name}</p>
                                                        <p className="text-sm text-gray-500">{setting.desc}</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300"
                                                        style={{ accentColor: '#5C95FF' }}
                                                        defaultChecked={index < 2}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Préférences</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Langue
                                                </label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent">
                                                    <option>Français</option>
                                                    <option>English</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fuseau horaire
                                                </label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent">
                                                    <option>Europe/Paris</option>
                                                    <option>UTC</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                                        style={{ backgroundColor: '#5C95FF' }}
                                    >
                                        Sauvegarder les paramètres
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;