import React, { useState, useEffect } from "react";

interface DashboardStats {
  franchisees: {
    total: number;
    actifs: number;
    inactifs: number;
  };
  camions: {
    total: number;
    disponible: number;
    en_service: number;
    en_panne: number;
    maintenance: number;
  };
  alertes: {
    pannes: number;
    maintenance_due: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques depuis l'API
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        console.log('Statistiques chargées:', data.data);
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }
    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Chargement du tableau de bord...</span>
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
            <button onClick={loadStats} className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm">
              Réessayer
            </button>
          </div>
        </div>
    );
  }

  if (!stats) {
    return <div className="p-6">Aucune donnée disponible</div>;
  }

  const statCards = [
    {
      name: "Franchisés Total",
      value: stats.franchisees.total.toString(),
      subtitle: `${stats.franchisees.actifs} actifs`,
      change: stats.franchisees.actifs > 0 ? "+100%" : "0%",
      changeType: "positive",
      icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
      ),
      color: "#5C95FF"
    },
    {
      name: "Camions Actifs",
      value: stats.camions.en_service.toString(),
      subtitle: `/${stats.camions.total} total`,
      change: stats.camions.total > 0 ? `${Math.round((stats.camions.en_service / stats.camions.total) * 100)}%` : "0%",
      changeType: "positive",
      icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
          </svg>
      ),
      color: "#28a745"
    },
    {
      name: "Pannes Actives",
      value: stats.alertes.pannes.toString(),
      subtitle: "nécessitent attention",
      change: stats.alertes.pannes > 0 ? "Urgent" : "OK",
      changeType: stats.alertes.pannes > 0 ? "negative" : "positive",
      icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
      ),
      color: "#F87575"
    },
    {
      name: "Camions Disponibles",
      value: stats.camions.disponible.toString(),
      subtitle: "prêts à assigner",
      change: stats.camions.disponible > 0 ? "Disponible" : "Aucun",
      changeType: stats.camions.disponible > 0 ? "positive" : "negative",
      icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
      ),
      color: "#FFA9A3"
    },
  ];

  return (
      <div className="p-6">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">Vue d'ensemble de votre réseau Driv'n Cook</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
              <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: stat.color + "15",
                        color: stat.color,
                      }}
                  >
                    {stat.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <span className="ml-2 text-xs text-gray-500">
                    {stat.subtitle}
                  </span>
                    </div>
                    <span
                        className={`text-sm font-medium ${
                            stat.changeType === "positive"
                                ? "text-green-600"
                                : "text-red-600"
                        }`}
                    >
                  {stat.change}
                </span>
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* Alertes et Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Alertes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alertes & Notifications
            </h3>
            <div className="space-y-4">
              {stats.alertes.pannes > 0 && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.alertes.pannes} camion{stats.alertes.pannes > 1 ? 's' : ''} en panne
                      </p>
                      <p className="text-xs text-red-600">Intervention requise</p>
                    </div>
                  </div>
              )}

              {stats.alertes.maintenance_due > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.alertes.maintenance_due} maintenance{stats.alertes.maintenance_due > 1 ? 's' : ''} prévue{stats.alertes.maintenance_due > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-yellow-600">Planification requise</p>
                    </div>
                  </div>
              )}

              {stats.alertes.pannes === 0 && stats.alertes.maintenance_due === 0 && (
                  <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Tout va bien !</p>
                      <p className="text-xs text-green-600">Aucune alerte active</p>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions Rapides
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: "Nouveau franchisé",
                  desc: "Ajouter un franchisé au réseau",
                  color: "#5C95FF",
                  href: "/franchisees",
                  icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                  )
                },
                {
                  title: "Nouveau camion",
                  desc: "Ajouter un camion à la flotte",
                  color: "#28a745",
                  href: "/camions",
                  icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                      </svg>
                  )
                },
                {
                  title: "Traiter candidatures",
                  desc: "Réviser les candidatures en attente",
                  color: "#FFA9A3",
                  href: "/candidatures",
                  icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                  )
                },
              ].map((action, index) => (
                  <a
                      key={index}
                      href={action.href}
                      className="block p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                      style={{
                        borderColor: action.color + "20",
                        backgroundColor: action.color + "05",
                      }}
                  >
                    <div className="flex items-center">
                      <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                          style={{ backgroundColor: action.color + "15", color: action.color }}
                      >
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-500">{action.desc}</p>
                      </div>
                    </div>
                  </a>
              ))}
            </div>
          </div>
        </div>

        {/* Graphiques de données */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition des camions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des Camions
            </h3>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-32 h-32">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                    #28a745 0% ${(stats.camions.disponible / Math.max(stats.camions.total, 1)) * 100}%, 
                    #5C95FF ${(stats.camions.disponible / Math.max(stats.camions.total, 1)) * 100}% ${((stats.camions.disponible + stats.camions.en_service) / Math.max(stats.camions.total, 1)) * 100}%, 
                    #F87575 ${((stats.camions.disponible + stats.camions.en_service) / Math.max(stats.camions.total, 1)) * 100}% ${((stats.camions.disponible + stats.camions.en_service + stats.camions.en_panne) / Math.max(stats.camions.total, 1)) * 100}%,
                    #FFA9A3 ${((stats.camions.disponible + stats.camions.en_service + stats.camions.en_panne) / Math.max(stats.camions.total, 1)) * 100}% 100%
                  )`,
                    }}
                />
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-lg font-bold text-gray-900">{stats.camions.total}</span>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { label: "Disponibles", color: "#28a745", value: stats.camions.disponible },
                { label: "En service", color: "#5C95FF", value: stats.camions.en_service },
                { label: "En panne", color: "#F87575", value: stats.camions.en_panne },
                { label: "Maintenance", color: "#FFA9A3", value: stats.camions.maintenance }
              ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs font-medium text-gray-900 ml-auto">
                  {item.value}
                </span>
                  </div>
              ))}
            </div>
          </div>

          {/* Évolution des franchisés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résumé Franchisés
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: "#5C95FF15", color: "#5C95FF" }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Total Franchisés</p>
                    <p className="text-sm text-gray-500">Réseau complet</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.franchisees.total}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: "#28a74515", color: "#28a745" }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Franchisés Actifs</p>
                    <p className="text-sm text-gray-500">Comptes vérifiés</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.franchisees.actifs}</span>
              </div>

              {stats.franchisees.inactifs > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: "#F8757515", color: "#F87575" }}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Franchisés Inactifs</p>
                        <p className="text-sm text-gray-500">Comptes non vérifiés</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{stats.franchisees.inactifs}</span>
                  </div>
              )}

              {/* Taux d'activation */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Taux d'activation</span>
                  <span className="text-sm font-bold text-blue-900">
                  {stats.franchisees.total > 0 ? Math.round((stats.franchisees.actifs / stats.franchisees.total) * 100) : 0}%
                </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: stats.franchisees.total > 0 ? `${(stats.franchisees.actifs / stats.franchisees.total) * 100}%` : '0%'
                      }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton actualiser */}
        <div className="mt-8 text-center">
          <button
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {loading ? 'Actualisation...' : 'Actualiser les données'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </div>
  );
};

export default Dashboard;