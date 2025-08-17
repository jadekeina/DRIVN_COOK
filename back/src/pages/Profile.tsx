import React, { useState, useEffect } from "react";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editedData, setEditedData] = useState({
    first_name: "",
    last_name: "",
    phone: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Charger le profil utilisateur depuis l'API
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant - veuillez vous reconnecter');
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement du profil');
      }

      const data = await response.json();

      if (data.success && data.user) {
        setProfileData(data.user);
        setEditedData({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          phone: data.user.phone || ""
        });
        console.log('Profil chargé:', data.user);
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les modifications du profil
  const handleProfileSave = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();

      if (data.success) {
        await loadProfile();
        alert('Profil mis à jour avec succès !');
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    alert('Changement de mot de passe - Cette fonctionnalité sera implémentée prochainement');
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const tabs = [
    { id: "profile", name: "Profil", icon: "👤" },
    { id: "security", name: "Sécurité", icon: "🔒" },
    { id: "settings", name: "Paramètres", icon: "⚙️" },
  ];

  if (loading) {
    return (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Chargement du profil...</span>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button onClick={loadProfile} className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm">
              Réessayer
            </button>
          </div>
        </div>
    );
  }

  if (!profileData) {
    return <div className="p-6">Aucune donnée de profil disponible</div>;
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et paramètres
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
                    style={{ backgroundColor: "#5C95FF" }}
                >
                  {profileData.first_name?.[0] || 'A'}
                  {profileData.last_name?.[0] || 'D'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{profileData.role}</p>
                {profileData.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Vérifié
                </span>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === tab.id
                                ? "text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={
                          activeTab === tab.id
                              ? {
                                background:
                                    "linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)",
                              }
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
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Informations du compte
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-gray-600">Connecté</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-gray-600">
                    Créé le {new Date(profileData.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    <span className="text-gray-600">ID: {profileData.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Onglet Profil */}
              {activeTab === "profile" && (
                  <div className="p-6">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Informations personnelles
                      </h2>
                      <p className="text-gray-600">
                        Modifiez vos informations de base
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom
                        </label>
                        <input
                            type="text"
                            value={editedData.first_name}
                            onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  first_name: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom
                        </label>
                        <input
                            type="text"
                            value={editedData.last_name}
                            onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  last_name: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <input
                            type="tel"
                            value={editedData.phone}
                            onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  phone: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                            placeholder="01 23 45 67 89"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                          onClick={handleProfileSave}
                          disabled={saving}
                          className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: "#5C95FF" }}
                      >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                      </button>
                    </div>
                  </div>
              )}

              {/* Onglet Sécurité */}
              {activeTab === "security" && (
                  <div className="p-6">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Sécurité
                      </h2>
                      <p className="text-gray-600">
                        Gérez votre mot de passe et la sécurité de votre compte
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe actuel
                        </label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  currentPassword: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                          onClick={handlePasswordChange}
                          className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                          style={{ backgroundColor: "#F87575" }}
                      >
                        Changer le mot de passe
                      </button>
                    </div>

                    {/* Conseils de sécurité */}
                    <div className="mt-8 p-4 rounded-lg border" style={{ backgroundColor: "#B9E6FF20", borderColor: "#B9E6FF" }}>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Conseils de sécurité
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Utilisez un mot de passe complexe avec au moins 8 caractères</li>
                        <li>• Mélangez lettres majuscules, minuscules, chiffres et symboles</li>
                        <li>• Ne réutilisez pas ce mot de passe sur d'autres sites</li>
                      </ul>
                    </div>
                  </div>
              )}

              {/* Onglet Paramètres */}
              {activeTab === "settings" && (
                  <div className="p-6">
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Paramètres
                      </h2>
                      <p className="text-gray-600">
                        Configurez vos préférences d'utilisation
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Notifications
                        </h3>
                        <div className="space-y-3">
                          {[
                            {
                              name: "Nouvelles candidatures",
                              desc: "Recevoir une notification pour chaque nouvelle candidature",
                            },
                            {
                              name: "Candidatures approuvées",
                              desc: "Notification quand une candidature est approuvée",
                            },
                            {
                              name: "Nouvelles franchises",
                              desc: "Notification pour les nouvelles franchises créées",
                            },
                          ].map((setting, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{setting.name}</p>
                                  <p className="text-sm text-gray-500">{setting.desc}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300"
                                    style={{ accentColor: "#5C95FF" }}
                                    defaultChecked={index < 2}
                                />
                              </div>
                          ))}
                        </div>
                      </div>

                      {/* Préférences */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Préférences
                        </h3>
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

                      {/* Informations de session */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Session
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Rôle:</span>
                              <span className="ml-2 text-gray-900 capitalize">{profileData.role}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Statut:</span>
                              <span className={`ml-2 ${profileData.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                            {profileData.is_verified ? 'Vérifié' : 'Non vérifié'}
                          </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">ID utilisateur:</span>
                              <span className="ml-2 text-gray-900">{profileData.id}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Compte créé:</span>
                              <span className="ml-2 text-gray-900">
                            {new Date(profileData.created_at).toLocaleDateString('fr-FR')}
                          </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                  localStorage.removeItem('token');
                                  localStorage.removeItem('user');
                                  window.location.href = '/login';
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                            >
                              Se déconnecter
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                          className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                          style={{ backgroundColor: "#5C95FF" }}
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