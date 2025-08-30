import React, { useState, useEffect } from "react";

interface FranchiseePayment {
    id: number;
    franchisee_name: string;
    email: string;
    phone: string;
    assigned_zone: string;
    date_creation: string;
    paiement: {
        statut: string;
        montant_paye: number;
        date_paiement: string | null;
        methode: string;
    };
    franchise: {
        existe: boolean;
        nom: string | null;
        active: boolean;
    };
    statut_global: string;
    actions_requises: {
        peut_assigner_franchise: boolean;
        peut_modifier_zone: boolean;
        paiement_complete: boolean;
    };
}

interface FranchiseeDetail {
    id: number;
    franchisee_name: string;
    email: string;
    phone: string;
    assigned_zone: string;
    date_creation: string;
    paiement: {
        statut: string;
        contrat_signe: string | null;
        paiement_complete: string | null;
        methode_paiement: string | null;
        montant_paye: number;
    };
    franchise: {
        id: number;
        nom: string;
        adresse: string;
        ville: string;
        code_postal: string;
        active: boolean;
        date_creation: string;
    } | null;
}

interface CreateFranchiseData {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    email: string;
    phone: string;
}

const GestionFinanciere: React.FC = () => {
    const [franchisees, setFranchisees] = useState<FranchiseePayment[]>([]);
    const [selectedFranchisee, setSelectedFranchisee] = useState<number | null>(null);
    const [franchiseeDetail, setFranchiseeDetail] = useState<FranchiseeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [error, setError] = useState<string | null>(null);
    const [showCreateFranchiseModal, setShowCreateFranchiseModal] = useState(false);
    const [franchiseFormData, setFranchiseFormData] = useState<CreateFranchiseData>({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        email: '',
        phone: ''
    });

    // Configuration de l'API - CORRECTION
    const API_BASE_URL = 'http://localhost:3002/api/finance';

    // Fonction pour récupérer le token d'authentification
    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    };

    // Fonction pour faire les appels API avec gestion d'erreurs
    const apiCall = async (endpoint: string, options: RequestInit = {}) => {
        try {
            const token = getAuthToken();
            console.log('API Call:', `${API_BASE_URL}${endpoint}`, 'Token present:', !!token);

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers,
                },
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (!data.success) {
                throw new Error(data.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    };

    // Charger les données des franchisés
    const loadFranchiseesData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Chargement des données utilisateurs...');
            const data = await apiCall('/franchises');

            console.log('Données reçues:', data);
            setFranchisees(data.data || []);

        } catch (error: any) {
            console.error('Erreur lors du chargement:', error);
            setError('Impossible de charger les données. Vérifiez votre connexion.');
            setFranchisees([]);
        } finally {
            setLoading(false);
        }
    };

    // Charger les détails d'un franchisé
    const loadFranchiseeDetail = async (franchiseeId: number) => {
        try {
            setLoadingDetail(true);
            setError(null);

            console.log(`Chargement des détails du franchisé ${franchiseeId}...`);
            const data = await apiCall(`/franchises/${franchiseeId}`);

            console.log('Détails reçus:', data);
            setFranchiseeDetail(data.data);

        } catch (error: any) {
            console.error('Erreur lors du chargement des détails:', error);
            setError('Impossible de charger les détails.');
            setFranchiseeDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Créer une franchise pour un utilisateur
    const createFranchise = async (userId: number) => {
        try {
            console.log('Création de franchise pour:', userId, franchiseFormData);

            const data = await apiCall(`/franchises/${userId}/create-franchise`, {
                method: 'POST',
                body: JSON.stringify(franchiseFormData)
            });

            console.log('Franchise créée:', data);
            alert(`Franchise créée avec succès!\n\nNom: ${franchiseFormData.name}\nVille: ${franchiseFormData.city}`);

            // Réinitialiser le formulaire
            setFranchiseFormData({
                name: '',
                address: '',
                city: '',
                postal_code: '',
                email: '',
                phone: ''
            });
            setShowCreateFranchiseModal(false);

            // Recharger les données
            await loadFranchiseesData();
            if (selectedFranchisee) {
                await loadFranchiseeDetail(selectedFranchisee);
            }

        } catch (error: any) {
            console.error('Erreur création franchise:', error);
            alert('Erreur lors de la création de la franchise: ' + error.message);
        }
    };

    // Mettre à jour la zone d'un utilisateur
    const updateZone = async (userId: number, newZone: string) => {
        try {
            console.log('Mise à jour zone:', userId, newZone);

            const data = await apiCall(`/franchises/${userId}/zone`, {
                method: 'PUT',
                body: JSON.stringify({ zone: newZone })
            });

            console.log('Zone mise à jour:', data);
            alert(`Zone mise à jour avec succès!\n\nNouvelle zone: ${newZone}`);

            // Recharger les données
            await loadFranchiseesData();
            if (selectedFranchisee) {
                await loadFranchiseeDetail(selectedFranchisee);
            }

        } catch (error: any) {
            console.error('Erreur mise à jour zone:', error);
            alert('Erreur lors de la mise à jour de la zone: ' + error.message);
        }
    };

    // Charger les statistiques globales
    const loadGlobalStats = async () => {
        try {
            const data = await apiCall('/stats');
            const stats = data.data;

            const message = `📊 Statistiques Globales Driv'n Cook

🏢 Franchisés:
• ${stats.franchises.total} utilisateurs total
• ${stats.franchises.payes} ont payé (50 000€)
• ${stats.franchises.assignes} franchises assignées
• ${stats.franchises.en_attente_assignation} en attente d'assignation

💰 Revenus:
• Total collecté: ${stats.revenus.total_collecte.toLocaleString()}€
• Nouveaux paiements ce mois: ${stats.revenus.nouveaux_ce_mois}
• Revenus ce mois: ${stats.revenus.revenus_ce_mois.toLocaleString()}€

📈 Taux:
• Paiement: ${stats.taux.paiement}%
• Assignation: ${stats.taux.assignation}%`;

            alert(message);
        } catch (error: any) {
            console.error('Erreur statistiques:', error);
            alert('Erreur lors du chargement des statistiques.');
        }
    };

    // Charger les données au montage du composant
    useEffect(() => {
        loadFranchiseesData();
    }, []);

    // Gestionnaires d'événements
    const handleFranchiseeClick = async (franchiseeId: number) => {
        setSelectedFranchisee(franchiseeId);
        await loadFranchiseeDetail(franchiseeId);
    };

    const handleBackToList = () => {
        setSelectedFranchisee(null);
        setFranchiseeDetail(null);
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case "franchise_assignee": return "#28a745";
            case "paiement_complete_non_assigne": return "#ffc107";
            case "contract_signe_attente_paiement": return "#5C95FF";
            case "en_attente": return "#6c757d";
            default: return "#6c757d";
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case "franchise_assignee": return "Franchise assignée";
            case "paiement_complete_non_assigne": return "Payé - Non assigné";
            case "contract_signe_attente_paiement": return "Attente paiement";
            case "en_attente": return "En attente";
            default: return statut;
        }
    };

    // Filtrage des franchisés
    const filteredFranchisees = franchisees.filter(franchisee => {
        const matchesSearch =
            franchisee.franchisee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            franchisee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            franchisee.assigned_zone.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || franchisee.statut_global === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Affichage d'erreur
    if (error && franchisees.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                            <p className="text-red-600 mt-1">{error}</p>
                            <p className="text-red-500 text-sm mt-2">Vérifiez que le serveur backend est démarré sur le port 3002.</p>
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                        <button
                            onClick={loadFranchiseesData}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => {
                                fetch('http://localhost:3002/api/finance/test')
                                    .then(res => res.json())
                                    .then(data => {
                                        console.log('Test API:', data);
                                        alert('Test API réussi! Vérifiez la console pour plus de détails.');
                                    })
                                    .catch(err => {
                                        console.error('Test API échoué:', err);
                                        alert('Test API échoué. Le serveur ne semble pas répondre.');
                                    });
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Tester API
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Affichage de chargement
    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des données...</span>
                </div>
            </div>
        );
    }

    // Vue détaillée d'un franchisé
    if (selectedFranchisee && franchiseeDetail) {
        return (
            <div className="p-6">
                {loadingDetail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                            <span>Chargement des détails...</span>
                        </div>
                    </div>
                )}

                {/* Header avec retour */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToList}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{franchiseeDetail.franchisee_name}</h1>
                            <p className="text-gray-600">{franchiseeDetail.assigned_zone} • {franchiseeDetail.email}</p>
                        </div>
                    </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Statut Paiement</p>
                            <p className="text-xl font-bold text-blue-600">
                                {franchiseeDetail.paiement.montant_paye.toLocaleString()}€
                            </p>
                            <p className="text-xs text-gray-500">
                                {franchiseeDetail.paiement.statut === 'franchise_payment_completed' ? 'Payé complet' : 'En attente'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Franchise</p>
                            <p className="text-xl font-bold text-green-600">
                                {franchiseeDetail.franchise ? 'Assignée' : 'Non assignée'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {franchiseeDetail.franchise ? franchiseeDetail.franchise.nom : 'Aucune franchise'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Zone</p>
                            <p className="text-xl font-bold text-purple-600">
                                {franchiseeDetail.assigned_zone || 'Non assignée'}
                            </p>
                            <button
                                onClick={() => {
                                    const newZone = prompt('Nouvelle zone:', franchiseeDetail.assigned_zone);
                                    if (newZone && newZone.trim()) {
                                        updateZone(franchiseeDetail.id, newZone.trim());
                                    }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>

                {/* Informations détaillées */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations détaillées</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Paiement</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-600">Statut:</span> <span className="font-medium">{franchiseeDetail.paiement.statut}</span></p>
                                <p><span className="text-gray-600">Montant:</span> <span className="font-medium">{franchiseeDetail.paiement.montant_paye.toLocaleString()}€</span></p>
                                {franchiseeDetail.paiement.paiement_complete && (
                                    <p><span className="text-gray-600">Date paiement:</span> <span className="font-medium">{new Date(franchiseeDetail.paiement.paiement_complete).toLocaleDateString('fr-FR')}</span></p>
                                )}
                                <p><span className="text-gray-600">Méthode:</span> <span className="font-medium">{franchiseeDetail.paiement.methode_paiement || 'N/A'}</span></p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Franchise</h3>
                            {franchiseeDetail.franchise ? (
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-600">Nom:</span> <span className="font-medium">{franchiseeDetail.franchise.nom}</span></p>
                                    <p><span className="text-gray-600">Adresse:</span> <span className="font-medium">{franchiseeDetail.franchise.adresse}</span></p>
                                    <p><span className="text-gray-600">Ville:</span> <span className="font-medium">{franchiseeDetail.franchise.ville}</span></p>
                                    <p><span className="text-gray-600">Active:</span> <span className="font-medium">{franchiseeDetail.franchise.active ? 'Oui' : 'Non'}</span></p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 mb-3">Aucune franchise assignée</p>
                                    {franchiseeDetail.paiement.statut === 'franchise_payment_completed' && (
                                        <button
                                            onClick={() => setShowCreateFranchiseModal(true)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Créer une franchise
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Vue liste des franchisés
    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements et Franchises</h1>
                <p className="text-gray-600">Suivi des paiements complets (50k€) et assignation des franchises</p>
                <div className="mt-2 flex items-center space-x-4">
                    <button
                        onClick={loadFranchiseesData}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? 'Chargement...' : 'Actualiser'}
                    </button>
                    <span className="text-sm text-gray-500">
                        {franchisees.length} utilisateur{franchisees.length > 1 ? 's' : ''} trouvé{franchisees.length > 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={loadGlobalStats}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Voir statistiques
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email ou zone..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="franchise_assignee">Franchise assignée</option>
                            <option value="paiement_complete_non_assigne">Payé - Non assigné</option>
                            <option value="contract_signe_attente_paiement">Attente paiement</option>
                            <option value="en_attente">En attente</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Liste des franchisés */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFranchisees.map((franchisee) => (
                            <tr
                                key={franchisee.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleFranchiseeClick(franchisee.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                                            {franchisee.franchisee_name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{franchisee.franchisee_name}</div>
                                            <div className="text-sm text-gray-500">{franchisee.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {franchisee.paiement.montant_paye.toLocaleString()}€
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {franchisee.paiement.date_paiement ?
                                            new Date(franchisee.paiement.date_paiement).toLocaleDateString('fr-FR') :
                                            'En attente'
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {franchisee.franchise.existe ? franchisee.franchise.nom : 'Non assignée'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {franchisee.franchise.existe ?
                                            (franchisee.franchise.active ? 'Active' : 'Inactive') :
                                            'Aucune franchise'
                                        }
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {franchisee.assigned_zone || 'Non assignée'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                        style={{ backgroundColor: getStatutColor(franchisee.statut_global) }}
                                    >
                                        {getStatutLabel(franchisee.statut_global)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFranchiseeClick(franchisee.id);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        title="Voir détails"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {franchisee.actions_requises.peut_assigner_franchise && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const selectedUser = franchisees.find(f => f.id === franchisee.id);
                                                if (selectedUser) {
                                                    setFranchiseFormData({
                                                        ...franchiseFormData,
                                                        email: selectedUser.email,
                                                        phone: selectedUser.phone || ''
                                                    });
                                                    setSelectedFranchisee(franchisee.id);
                                                    setShowCreateFranchiseModal(true);
                                                }
                                            }}
                                            className="text-green-600 hover:text-green-900 mr-3"
                                            title="Créer franchise"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newZone = prompt('Nouvelle zone pour ' + franchisee.franchisee_name + ':', franchisee.assigned_zone);
                                            if (newZone && newZone.trim()) {
                                                updateZone(franchisee.id, newZone.trim());
                                            }
                                        }}
                                        className="text-purple-600 hover:text-purple-900"
                                        title="Modifier zone"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredFranchisees.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filterStatus !== "all" ? "Modifiez vos filtres pour voir plus de résultats." : "Aucun utilisateur n'a encore été créé."}
                        </p>
                    </div>
                )}
            </div>

            {/* Résumé global */}
            {filteredFranchisees.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {(() => {
                        const totalPayes = filteredFranchisees.filter(f => f.paiement.montant_paye > 0).length;
                        const totalAssignes = filteredFranchisees.filter(f => f.franchise.existe).length;
                        const totalRevenus = filteredFranchisees.reduce((sum, f) => sum + f.paiement.montant_paye, 0);
                        const enAttenteAssignation = filteredFranchisees.filter(f => f.actions_requises.peut_assigner_franchise).length;

                        return [
                            {
                                label: "Utilisateurs payés",
                                value: `${totalPayes}/${filteredFranchisees.length}`,
                                color: "#5C95FF",
                                subtitle: `${totalPayes > 0 ? Math.round((totalPayes/filteredFranchisees.length)*100) : 0}% ont payé`
                            },
                            {
                                label: "Franchises assignées",
                                value: `${totalAssignes}/${totalPayes}`,
                                color: "#28a745",
                                subtitle: `${totalPayes > 0 ? Math.round((totalAssignes/totalPayes)*100) : 0}% assignées`
                            },
                            {
                                label: "Revenus collectés",
                                value: `${totalRevenus.toLocaleString()}€`,
                                color: "#FFA9A3",
                                subtitle: "Total des paiements"
                            },
                            {
                                label: "En attente assignation",
                                value: `${enAttenteAssignation}`,
                                color: "#ffc107",
                                subtitle: `${enAttenteAssignation} franchise${enAttenteAssignation > 1 ? 's' : ''} à créer`
                            }
                        ].map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                                    <p className="text-xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}

            {/* Modal de création de franchise */}
            {showCreateFranchiseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Créer une franchise</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la franchise *</label>
                                <input
                                    type="text"
                                    value={franchiseFormData.name}
                                    onChange={(e) => setFranchiseFormData({...franchiseFormData, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: Driv'n Cook Paris Centre"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                                <input
                                    type="text"
                                    value={franchiseFormData.address}
                                    onChange={(e) => setFranchiseFormData({...franchiseFormData, address: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="123 Rue de la République"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                                    <input
                                        type="text"
                                        value={franchiseFormData.city}
                                        onChange={(e) => setFranchiseFormData({...franchiseFormData, city: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Paris"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                                    <input
                                        type="text"
                                        value={franchiseFormData.postal_code}
                                        onChange={(e) => setFranchiseFormData({...franchiseFormData, postal_code: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="75001"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={franchiseFormData.email}
                                    onChange={(e) => setFranchiseFormData({...franchiseFormData, email: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={franchiseFormData.phone}
                                    onChange={(e) => setFranchiseFormData({...franchiseFormData, phone: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCreateFranchiseModal(false);
                                    setFranchiseFormData({
                                        name: '',
                                        address: '',
                                        city: '',
                                        postal_code: '',
                                        email: '',
                                        phone: ''
                                    });
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedFranchisee && franchiseFormData.name.trim() && franchiseFormData.address.trim() && franchiseFormData.city.trim()) {
                                        createFranchise(selectedFranchisee);
                                    } else {
                                        alert('Veuillez remplir tous les champs obligatoires (*)');
                                    }
                                }}
                                disabled={!franchiseFormData.name.trim() || !franchiseFormData.address.trim() || !franchiseFormData.city.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Créer la franchise
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionFinanciere;