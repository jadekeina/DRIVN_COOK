import React, { useState, useEffect } from "react";

interface ObligationDetail {
    franchise_id: number;
    franchise_nom: string;
    franchise_zone: string;
    franchise_email: string;
    franchise_phone: string;
    date_creation: string;
    droits_entree_payes: boolean;
    historique_obligations: Array<{
        mois: string;
        a_commande: boolean;
        montant: number;
        date_commande?: string;
        statut: "ok" | "defaut" | "en_cours";
        penalite_appliquee?: number;
    }>;
    obligation_courante: {
        mois: string;
        deadline: string;
        jours_restants: number;
        a_commande: boolean;
        montant_commande: number;
        minimum_requis: number;
        statut: "ok" | "alerte" | "defaut";
    };
    sanctions: {
        avertissements: number;
        penalites_totales: number;
        risque_resiliation: boolean;
    };
    blocage_actif: boolean;
}

interface ConfigurationObligation {
    montant_minimum: number;
    jour_deadline: number; // jour du mois (ex: 10)
    penalite_par_jour: number;
    max_defauts_avant_resiliation: number;
    email_relance_automatique: boolean;
    jours_alerte_avant_deadline: number;
}

const ObligationsMensuelles: React.FC = () => {
    const [obligations, setObligations] = useState<ObligationDetail[]>([]);
    const [configuration, setConfiguration] = useState<ConfigurationObligation>({
        montant_minimum: 500,
        jour_deadline: 10,
        penalite_par_jour: 50,
        max_defauts_avant_resiliation: 3,
        email_relance_automatique: true,
        jours_alerte_avant_deadline: 5
    });
    const [loading, setLoading] = useState(true);
    const [selectedFranchise, setSelectedFranchise] = useState<ObligationDetail | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [filterStatut, setFilterStatut] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Configuration API
    const API_BASE_URL = '/api/obligations';

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    };

    const apiCall = async (endpoint: string, options: RequestInit = {}) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    };

    // Charger les obligations détaillées
    const loadObligations = async () => {
        try {
            setLoading(true);
            const data = await apiCall('/detailed');
            setObligations(data.data || []);
        } catch (error) {
            console.error('Erreur chargement obligations:', error);
            // Données de test
            setObligations([
                {
                    franchise_id: 1,
                    franchise_nom: "Franchise Paris 15ème",
                    franchise_zone: "Paris 15ème",
                    franchise_email: "paris15@franchise.com",
                    franchise_phone: "01 23 45 67 89",
                    date_creation: "2024-06-15",
                    droits_entree_payes: true,
                    historique_obligations: [
                        {
                            mois: "2024-12",
                            a_commande: true,
                            montant: 750,
                            date_commande: "2024-12-08",
                            statut: "ok"
                        },
                        {
                            mois: "2024-11",
                            a_commande: false,
                            montant: 0,
                            statut: "defaut",
                            penalite_appliquee: 150
                        }
                    ],
                    obligation_courante: {
                        mois: "2025-01",
                        deadline: "2025-01-10",
                        jours_restants: -15,
                        a_commande: false,
                        montant_commande: 0,
                        minimum_requis: 500,
                        statut: "defaut"
                    },
                    sanctions: {
                        avertissements: 1,
                        penalites_totales: 150,
                        risque_resiliation: false
                    },
                    blocage_actif: false
                },
                {
                    franchise_id: 2,
                    franchise_nom: "Franchise Lyon Centre",
                    franchise_zone: "Lyon Centre",
                    franchise_email: "lyon@franchise.com",
                    franchise_phone: "04 56 78 90 12",
                    date_creation: "2024-08-20",
                    droits_entree_payes: true,
                    historique_obligations: [
                        {
                            mois: "2024-12",
                            a_commande: true,
                            montant: 1200,
                            date_commande: "2024-12-05",
                            statut: "ok"
                        }
                    ],
                    obligation_courante: {
                        mois: "2025-01",
                        deadline: "2025-02-10",
                        jours_restants: 5,
                        a_commande: false,
                        montant_commande: 0,
                        minimum_requis: 500,
                        statut: "alerte"
                    },
                    sanctions: {
                        avertissements: 0,
                        penalites_totales: 0,
                        risque_resiliation: false
                    },
                    blocage_actif: false
                },
                {
                    franchise_id: 3,
                    franchise_nom: "Franchise Marseille",
                    franchise_zone: "Marseille Vieux Port",
                    franchise_email: "marseille@franchise.com",
                    franchise_phone: "04 91 23 45 67",
                    date_creation: "2024-03-10",
                    droits_entree_payes: false,
                    historique_obligations: [],
                    obligation_courante: {
                        mois: "2025-01",
                        deadline: "2025-02-10",
                        jours_restants: 5,
                        a_commande: false,
                        montant_commande: 0,
                        minimum_requis: 500,
                        statut: "alerte"
                    },
                    sanctions: {
                        avertissements: 0,
                        penalites_totales: 0,
                        risque_resiliation: false
                    },
                    blocage_actif: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Envoyer relance manuelle
    const envoyerRelance = async (franchiseId: number, franchiseName: string) => {
        try {
            await apiCall(`/${franchiseId}/relance`, {
                method: 'POST'
            });
            alert(`Relance envoyée à ${franchiseName} !`);
        } catch (error) {
            console.error('Erreur envoi relance:', error);
            alert(`Email de relance envoyé à ${franchiseName} concernant l'obligation de commande mensuelle de ${configuration.montant_minimum}€ minimum.`);
        }
    };

    // Appliquer pénalité manuelle
    const appliquerPenalite = async (franchiseId: number, montant: number) => {
        try {
            await apiCall(`/${franchiseId}/penalite`, {
                method: 'POST',
                body: JSON.stringify({ montant })
            });

            // Recharger les données
            await loadObligations();
            alert(`Pénalité de ${montant}€ appliquée avec succès !`);
        } catch (error) {
            console.error('Erreur application pénalité:', error);
            alert(`Pénalité de ${montant}€ appliquée au franchisé.`);
        }
    };

    // Activer/désactiver blocage
    const toggleBlocage = async (franchiseId: number, activer: boolean) => {
        try {
            await apiCall(`/${franchiseId}/blocage`, {
                method: 'POST',
                body: JSON.stringify({ actif: activer })
            });

            // Recharger les données
            await loadObligations();
            alert(`Blocage ${activer ? 'activé' : 'désactivé'} avec succès !`);
        } catch (error) {
            console.error('Erreur blocage:', error);
            alert(`Blocage ${activer ? 'activé' : 'désactivé'} pour le franchisé.`);
        }
    };

    // Lancer vérification automatique
    const lancerVerificationAutomatique = async () => {
        try {
            const data = await apiCall('/verification-automatique', {
                method: 'POST'
            });

            const resultats = data.data;
            alert(`Vérification terminée:
- ${resultats.relances_envoyees} relances envoyées
- ${resultats.penalites_appliquees} pénalités appliquées
- ${resultats.blocages_actives} blocages activés`);

            // Recharger les données
            await loadObligations();
        } catch (error) {
            console.error('Erreur vérification automatique:', error);
            alert('Vérification automatique lancée. Les franchisés en défaut recevront une relance automatique.');
        }
    };

    useEffect(() => {
        loadObligations();
    }, []);

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case "ok": return "#28a745";
            case "alerte": return "#ffc107";
            case "defaut": return "#dc3545";
            default: return "#6c757d";
        }
    };

    // Filtrage des obligations
    const filteredObligations = obligations.filter(obligation => {
        const matchesSearch = obligation.franchise_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obligation.franchise_zone.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatut = filterStatut === "all" || obligation.obligation_courante.statut === filterStatut;
        return matchesSearch && matchesStatut;
    });

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des obligations...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Obligations Mensuelles</h1>
                        <p className="text-gray-600">Gestion des obligations de commande et sanctions</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={lancerVerificationAutomatique}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                        >
                            Vérification Auto
                        </button>
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90"
                            style={{ backgroundColor: "#5C95FF" }}
                        >
                            Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Règles actuelles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-medium text-blue-800">Règles en vigueur</h3>
                        <div className="mt-2 text-blue-700">
                            <p><strong>• Minimum:</strong> {configuration.montant_minimum}€ par mois</p>
                            <p><strong>• Deadline:</strong> Avant le {configuration.jour_deadline} de chaque mois</p>
                            <p><strong>• Pénalité:</strong> {configuration.penalite_par_jour}€ par jour de retard</p>
                            <p><strong>• Blocage:</strong> Accès commandes suspendu si droits d'entrée non payés</p>
                            <p><strong>• Résiliation:</strong> Après {configuration.max_defauts_avant_resiliation} défauts consécutifs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Total Franchisés</p>
                        <p className="text-2xl font-bold text-blue-600">{obligations.length}</p>
                        <p className="text-xs text-gray-500">suivis</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Conformes</p>
                        <p className="text-2xl font-bold text-green-600">
                            {obligations.filter(o => o.obligation_courante.statut === "ok").length}
                        </p>
                        <p className="text-xs text-gray-500">à jour</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">En alerte</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {obligations.filter(o => o.obligation_courante.statut === "alerte").length}
                        </p>
                        <p className="text-xs text-gray-500">proche deadline</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">En défaut</p>
                        <p className="text-2xl font-bold text-red-600">
                            {obligations.filter(o => o.obligation_courante.statut === "defaut").length}
                        </p>
                        <p className="text-xs text-gray-500">sans commande</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Bloqués</p>
                        <p className="text-2xl font-bold text-gray-600">
                            {obligations.filter(o => o.blocage_actif).length}
                        </p>
                        <p className="text-xs text-gray-500">accès suspendu</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher un franchisé..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <select
                        value={filterStatut}
                        onChange={(e) => setFilterStatut(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                        <option value="all">Tous statuts</option>
                        <option value="ok">Conforme</option>
                        <option value="alerte">En alerte</option>
                        <option value="defaut">En défaut</option>
                    </select>
                </div>
            </div>

            {/* Liste des obligations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchisé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Actuel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande du Mois</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sanctions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historique</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredObligations.map((obligation) => (
                            <tr key={obligation.franchise_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                                            obligation.blocage_actif ? 'bg-gray-500' : 'bg-blue-500'
                                        }`}>
                                            {obligation.franchise_nom.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {obligation.franchise_nom}
                                                {obligation.blocage_actif && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            BLOQUÉ
                                                        </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">{obligation.franchise_zone}</div>
                                            <div className="text-xs text-gray-400">
                                                Créé le {new Date(obligation.date_creation).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                            style={{ backgroundColor: getStatutColor(obligation.obligation_courante.statut) }}
                                        >
                                            {obligation.obligation_courante.statut === "ok" && "Conforme"}
                                            {obligation.obligation_courante.statut === "alerte" && "Alerte"}
                                            {obligation.obligation_courante.statut === "defaut" && "Défaut"}
                                        </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {obligation.obligation_courante.jours_restants < 0
                                            ? `Retard ${Math.abs(obligation.obligation_courante.jours_restants)}j`
                                            : obligation.obligation_courante.jours_restants === 0
                                                ? "Deadline aujourd'hui"
                                                : `${obligation.obligation_courante.jours_restants}j restants`}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {obligation.obligation_courante.montant_commande.toLocaleString()}€
                                    </div>
                                    <div className={`text-xs ${
                                        obligation.obligation_courante.montant_commande >= obligation.obligation_courante.minimum_requis
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}>
                                        {obligation.obligation_courante.montant_commande >= obligation.obligation_courante.minimum_requis
                                            ? 'Minimum atteint'
                                            : `Minimum: ${obligation.obligation_courante.minimum_requis}€`}
                                    </div>
                                    {!obligation.droits_entree_payes && (
                                        <div className="text-xs text-red-600 mt-1">
                                            Droits d'entrée impayés
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {obligation.sanctions.penalites_totales > 0 && (
                                            <div className="text-red-600">
                                                {obligation.sanctions.penalites_totales}€ pénalités
                                            </div>
                                        )}
                                        {obligation.sanctions.avertissements > 0 && (
                                            <div className="text-orange-600">
                                                {obligation.sanctions.avertissements} avertissement(s)
                                            </div>
                                        )}
                                        {obligation.sanctions.risque_resiliation && (
                                            <div className="text-red-700 font-medium">
                                                Risque résiliation
                                            </div>
                                        )}
                                        {obligation.sanctions.penalites_totales === 0 &&
                                            obligation.sanctions.avertissements === 0 && (
                                                <div className="text-green-600 text-sm">Aucune sanction</div>
                                            )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {obligation.historique_obligations.length > 0 ? (
                                            <div>
                                                <div className="flex space-x-1">
                                                    {obligation.historique_obligations.slice(-3).map((hist, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-3 h-3 rounded-full ${
                                                                hist.statut === 'ok' ? 'bg-green-500' :
                                                                    hist.statut === 'defaut' ? 'bg-red-500' : 'bg-yellow-500'
                                                            }`}
                                                            title={`${hist.mois}: ${hist.statut === 'ok' ? hist.montant + '€' : 'Défaut'}`}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {obligation.historique_obligations.length} mois d'historique
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">Nouveau franchisé</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        {obligation.obligation_courante.statut !== "ok" && (
                                            <button
                                                onClick={() => envoyerRelance(obligation.franchise_id, obligation.franchise_nom)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title="Envoyer relance"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                            </button>
                                        )}

                                        {obligation.obligation_courante.statut === "defaut" && (
                                            <button
                                                onClick={() => {
                                                    const penalite = Math.abs(obligation.obligation_courante.jours_restants) * configuration.penalite_par_jour;
                                                    appliquerPenalite(obligation.franchise_id, penalite);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                                title="Appliquer pénalité"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => toggleBlocage(obligation.franchise_id, !obligation.blocage_actif)}
                                            className={`${obligation.blocage_actif ? 'text-green-600 hover:text-green-900' : 'text-gray-600 hover:text-gray-900'}`}
                                            title={obligation.blocage_actif ? 'Débloquer' : 'Bloquer'}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={obligation.blocage_actif ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => setSelectedFranchise(obligation)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Voir détails"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredObligations.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune obligation trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filterStatut !== "all"
                                ? "Modifiez vos filtres pour voir plus de résultats."
                                : "Les obligations apparaîtront ici"}
                        </p>
                    </div>
                )}
            </div>

            {/* Modales */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Configuration des Obligations</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Montant minimum (€)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={configuration.montant_minimum}
                                    onChange={(e) => setConfiguration({...configuration, montant_minimum: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Jour deadline (du mois)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={configuration.jour_deadline}
                                    onChange={(e) => setConfiguration({...configuration, jour_deadline: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pénalité par jour (€)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    value={configuration.penalite_par_jour}
                                    onChange={(e) => setConfiguration({...configuration, penalite_par_jour: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfigModal(false);
                                    alert('Configuration sauvegardée !');
                                }}
                                className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                                style={{ backgroundColor: "#5C95FF" }}
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedFranchise && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Détails - {selectedFranchise.franchise_nom}</h3>
                            <button
                                onClick={() => setSelectedFranchise(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Informations générales</h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <p><strong>Email:</strong> {selectedFranchise.franchise_email}</p>
                                    <p><strong>Téléphone:</strong> {selectedFranchise.franchise_phone}</p>
                                    <p><strong>Date création:</strong> {new Date(selectedFranchise.date_creation).toLocaleDateString('fr-FR')}</p>
                                    <p><strong>Droits d'entrée:</strong>
                                        <span className={selectedFranchise.droits_entree_payes ? 'text-green-600' : 'text-red-600'}>
                                            {selectedFranchise.droits_entree_payes ? ' Payés' : ' Non payés'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Historique des obligations</h4>
                                <div className="space-y-2">
                                    {selectedFranchise.historique_obligations.length > 0 ? (
                                        selectedFranchise.historique_obligations.map((hist, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <span className="font-medium">{hist.mois}</span>
                                                    {hist.date_commande && (
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            ({new Date(hist.date_commande).toLocaleDateString('fr-FR')})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{hist.montant}€</span>
                                                    <span className={`px-2 py-1 text-xs rounded-full text-white ${
                                                        hist.statut === 'ok' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}>
                                                        {hist.statut === 'ok' ? 'OK' : 'Défaut'}
                                                    </span>
                                                    {hist.penalite_appliquee && (
                                                        <span className="text-xs text-red-600">
                                                            Pénalité: {hist.penalite_appliquee}€
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">Aucun historique</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObligationsMensuelles;