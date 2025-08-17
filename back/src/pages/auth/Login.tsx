import React, { useState } from "react";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
}

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "admin@drivncook.com",
    password: "admin123"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Tentative de connexion avec:', formData.email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('Réponse de connexion:', data);

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      if (data.success && data.data && data.data.token && data.data.user) {
        // Vérifier que c'est bien un admin
        if (data.data.user.role !== 'admin') {
          throw new Error('Accès refusé : vous devez être administrateur');
        }

        console.log('Connexion admin réussie:', data.data.user);
        setSuccess('Connexion réussie ! Redirection...');

        // Petit délai pour afficher le message de succès
        setTimeout(() => {
          onLogin(data.data.user, data.data.token);
        }, 500);

      } else {
        throw new Error(data.message || 'Réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#5C95FF" }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Administration Driv'n Cook
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre tableau de bord administrateur
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

            {/* Formulaire de connexion */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Message d'erreur */}
              {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-800 text-sm">{error}</span>
                    </div>
                  </div>
              )}

              {/* Message de succès */}
              {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-800 text-sm">{success}</span>
                    </div>
                  </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="mt-1">
                  <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                      style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                      placeholder="admin@drivncook.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="mt-1">
                  <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm"
                      style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                      placeholder="Mot de passe"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      style={{ accentColor: "#5C95FF" }}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <button type="button" className="font-medium hover:opacity-80" style={{ color: "#5C95FF" }}>
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "#5C95FF",
                      "--tw-ring-color": "#5C95FF"
                    } as React.CSSProperties}
                >
                  {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connexion en cours...
                      </div>
                  ) : (
                      'Se connecter'
                  )}
                </button>
              </div>
            </form>

            {/* Infos de test */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Compte administrateur :</strong></p>
                <p>Email: admin@drivncook.com</p>
                <p>Mot de passe: admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Login;