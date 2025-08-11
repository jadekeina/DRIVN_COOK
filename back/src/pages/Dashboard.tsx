import React from 'react';
import Candidatures from "./Candidature.tsx";

const Dashboard: React.FC = () => {
    const stats = [
        {
            name: 'Candidatures en attente',
            value: '12',
            change: '+4.75%',
            changeType: 'positive',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            ),
        },
        {
            name: 'Franchises actives',
            value: '24',
            change: '+2.02%',
            changeType: 'positive',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                    <path fillRule="evenodd"
                          d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                          clipRule="evenodd"/>
                </svg>
            ),
        },
        {
            name: 'Revenus ce mois',
            value: '€45,385',
            change: '+12.5%',
            changeType: 'positive',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"/>
                </svg>
            ),
        },
        {
            name: 'Taux de conversion',
            value: '64.2%',
            change: '-2.1%',
            changeType: 'negative',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"/>
                </svg>
            ),
        },
    ];

    return (
        <div className="p-6">
            {/* Page title */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Vue d'ensemble de votre activité</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    backgroundColor: index === 0 ? '#5C95FF15' :
                                        index === 1 ? '#B9E6FF15' :
                                            index === 2 ? '#FFA9A315' : '#F8757515',
                                    color: index === 0 ? '#5C95FF' :
                                        index === 1 ? '#5C95FF' :
                                            index === 2 ? '#FFA9A3' : '#F87575'
                                }}
                            >
                                {stat.icon}
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <span
                                        className={`ml-2 text-sm font-medium ${
                                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                    >
                    {stat.change}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Chart 1 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidatures par mois</h3>
                    <div className="h-64 flex items-end justify-center space-x-2">
                        {/* Simulation d'un graphique en barres */}
                        {[40, 65, 45, 80, 70, 90].map((height, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="w-8 rounded-t transition-all duration-500 hover:opacity-80"
                                    style={{
                                        height: `${height}%`,
                                        background: `linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)`
                                    }}
                                />
                                <span className="text-xs text-gray-500 mt-2">
                  {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'][index]}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des statuts</h3>
                    <div className="flex items-center justify-center h-64">
                        {/* Simulation d'un graphique circulaire */}
                        <div className="relative w-32 h-32">
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                    #5C95FF 0% 40%, 
                    #B9E6FF 40% 65%, 
                    #FFA9A3 65% 85%, 
                    #F87575 85% 100%
                  )`
                                }}
                            />
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-gray-900">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {[
                            {label: 'En attente', color: '#5C95FF', value: '40%'},
                            {label: 'En cours', color: '#B9E6FF', value: '25%'},
                            {label: 'Acceptées', color: '#FFA9A3', value: '20%'},
                            {label: 'Refusées', color: '#F87575', value: '15%'}
                        ].map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{backgroundColor: item.color}}
                                />
                                <span className="text-xs text-gray-600">{item.label}</span>
                                <span className="text-xs font-medium text-gray-900 ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dernières candidatures */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Dernières candidatures</h3>
                        <a
                            href="/candidatures"
                            className="text-sm font-medium hover:opacity-80"
                            style={{color: '#5C95FF'}}
                        >
                            Voir tout
                        </a>
                    </div>
                    <div className="space-y-4">
                        {[
                            {name: 'Jean Dupont', city: 'Paris', time: 'Il y a 2h', status: 'en_attente'},
                            {name: 'Marie Martin', city: 'Lyon', time: 'Il y a 4h', status: 'en_cours'},
                            {name: 'Pierre Durand', city: 'Marseille', time: 'Il y a 6h', status: 'acceptee'}
                        ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                                        style={{backgroundColor: '#7E6C6C'}}
                                    >
                                        {item.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.city} • {item.time}</p>
                                    </div>
                                </div>
                                <span
                                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                    style={{
                                        backgroundColor: item.status === 'en_attente' ? '#5C95FF' :
                                            item.status === 'en_cours' ? '#FFA9A3' : '#28a745'
                                    }}
                                >
                  {item.status === 'en_attente' ? 'En attente' :
                      item.status === 'en_cours' ? 'En cours' : 'Acceptée'}
                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                    <div className="space-y-3">
                        {[
                            {
                                title: 'Nouvelle franchise',
                                desc: 'Ajouter une nouvelle franchise au réseau',
                                color: '#5C95FF',
                                href: '/franchises'
                            },
                            {
                                title: 'Traiter les candidatures',
                                desc: 'Réviser les candidatures en attente',
                                color: '#FFA9A3',
                                href: '/candidatures'
                            },
                            {
                                title: 'Rapport mensuel',
                                desc: 'Générer le rapport d\'activité',
                                color: '#B9E6FF',
                                href: '#'
                            }
                        ].map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className="block p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                                style={{
                                    borderColor: action.color + '20',
                                    backgroundColor: action.color + '05'
                                }}
                            >
                                <div className="flex items-center">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                                        style={{backgroundColor: action.color + '15'}}
                                    >
                                        <svg className="w-5 h-5" style={{color: action.color}} fill="currentColor"
                                             viewBox="0 0 20 20">
                                            <path fillRule="evenodd"
                                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                  clipRule="evenodd"/>
                                        </svg>
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
        </div>
    );
}

export default Dashboard;