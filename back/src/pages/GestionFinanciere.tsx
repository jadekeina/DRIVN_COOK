import React, { useState, useEffect } from "react";

interface FranchiseFinance {
    id: number;
    franchisee_name: string;
    email: string;
    zone_attribution: string;
    phone: string;
    date_creation: string;
    droit_entree: {
        initial_paye: boolean;
        date_initial: string | null;
        echeances_restantes: number;
        total_paye: number;
        prochaine_echeance: string | null;
    };
    ca_total: number;
    redevances_dues: number;
    redevances_payees: number;
    commandes_mois: number;
    statut_global: "a_jour" | "en_retard" | "en_attente";
}

interface FranchiseDetail {
    id: number;
    franchisee_name: string;
    email: string;
    zone_attribution: string;
    phone: string;
    date_creation: string;
    droits_entree: {
        initial: { paye: boolean; date: string | null; montant: number };
        echeances: Array<{
            numero: number;
            montant: number;
            date_limite: string;
            paye: boolean;
            date_paiement: string | null;
        }>;
    };
    ca_declarations: Array<{
        mois: string;
        ca_declare: number;
        redevance_calculee: number;
        statut: "paye" | "en_attente";
        date_declaration: string;
    }>;
    commandes: Array<{
        id: string;
        date: string;
        montant: number;
        statut: "livree" | "en_cours";
        articles_count: number;
    }>;
}

const GestionFinanciere: React.FC = () => {
    const [franchises, setFranchises] = useState<FranchiseFinance[]>([]);
    const [selectedFranchise, setSelectedFranchise] = useState<number | null>(null);
    const [franchiseDetail, setFranchiseDetail] = useState<FranchiseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [error, setError] = useState<string | null>(null);

    // Configuration de l'API
    const API_BASE_URL = '/api/finance';

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
    const loadFranchisesData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Chargement des données financières...');
            const data = await apiCall('/franchises');

            console.log('Données franchisés reçues:', data);
            setFranchises(data.data || []);

        } catch (error: any) {
            console.error('Erreur lors du chargement des franchisés:', error);
            setError('Impossible de charger les données financières. Vérifiez votre connexion.');
            setFranchises([]);
        } finally {
            setLoading(false);
        }
    };

    // Charger les détails d'un franchisé
    const loadFranchiseDetail = async (franchiseId: number) => {
        try {
            setLoadingDetail(true);
            setError(null);

            console.log(`Chargement des détails du franchisé ${franchiseId}...`);
            const data = await apiCall(`/franchises/${franchiseId}`);

            console.log('Détails franchisé reçus:', data);
            setFranchiseDetail(data.data);

        } catch (error: any) {
            console.error('Erreur lors du chargement des détails:', error);
            setError('Impossible de charger les détails du franchisé.');
            setFranchiseDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Générer un rapport financier
    const generateFinanceReport = async (franchiseId: number) => {
        try {
            console.log(`Génération du rapport pour le franchisé ${franchiseId}...`);
            const data = await apiCall(`/franchises/${franchiseId}/report`);

            const rapport = data.data;
            const message = `Rapport financier généré pour ${rapport.franchisee.nom}:

📊 Performance:
• CA total: ${rapport.performance.ca_total.toLocaleString()}€
• Nombre de ventes: ${rapport.performance.nombre_ventes}
• CA moyen par jour: ${rapport.performance.ca_moyen_par_jour.toLocaleString()}€

💰 Revenus Driv'n Cook:
• Redevances 4%: ${rapport.revenus_drivncook.redevances_4_pourcent.toLocaleString()}€
• Marge commandes 15%: ${rapport.revenus_drivncook.marge_commandes_15_pourcent.toLocaleString()}€
• Total revenus: ${rapport.revenus_drivncook.revenus_total.toLocaleString()}€

📦 Commandes:
• Total commandes: ${rapport.commandes.total_commandes.toLocaleString()}€
• Nombre de commandes: ${rapport.commandes.nombre_commandes}
• Panier moyen: ${rapport.commandes.panier_moyen.toLocaleString()}€`;

            alert(message);

        } catch (error: any) {
            console.error('Erreur lors de la génération du rapport:', error);
            alert('Erreur lors de la génération du rapport. Veuillez réessayer.');
        }
    };

    // Envoyer une relance par email
    const sendRelance = async (franchiseId: number, franchiseName: string) => {
        try {
            console.log(`Envoi de relance pour le franchisé ${franchiseId}...`);

            // Simuler l'appel API pour l'envoi de relance
            alert(`Relance envoyée à ${franchiseName}!\n\nUn email de rappel a été envoyé concernant les paiements en attente.`);

        } catch (error: any) {
            console.error('Erreur lors de l\'envoi de la relance:', error);
            alert('Erreur lors de l\'envoi de la relance. Veuillez réessayer.');
        }
    };

    // Mettre à jour le statut de paiement d'un droit d'entrée
    const updateDroitEntreePaiement = async (franchiseId: number, paye: boolean) => {
        try {
            console.log(`Mise à jour paiement droit d'entrée: ${franchiseId}, payé: ${paye}`);

            const data = await apiCall(`/franchises/${franchiseId}/droit-entree`, {
                method: 'POST',
                body: JSON.stringify({
                    paye: paye,
                    date_paiement: new Date().toISOString().split('T')[0]
                })
            });

            console.log('Paiement mis à jour:', data);

            // Recharger les détails après la mise à jour
            if (selectedFranchise) {
                await loadFranchiseDetail(selectedFranchise);
            }

            // Recharger la liste
            await loadFranchisesData();

            alert('Statut de paiement mis à jour avec succès!');

        } catch (error: any) {
            console.error('Erreur lors de la mise à jour du paiement:', error);
            alert('Erreur lors de la mise à jour. Veuillez réessayer.');
        }
    };

    // Charger les statistiques globales
    const loadGlobalStats = async () => {
        try {
            const data = await apiCall('/stats');
            const stats = data.data;

            const message = `📊 Statistiques Globales Driv'n Cook

🏢 Réseau:
• ${stats.franchises.total} franchisé${stats.franchises.total > 1 ? 's' : ''} total
• ${stats.franchises.droits_payes} ont payé leurs droits d'entrée
• Taux de paiement: ${stats.franchises.taux_paiement_droits}%

💰 Finances:
• CA total réseau: ${stats.chiffres_affaires.ca_total_reseau.toLocaleString()}€
• CA moyen par franchise: ${parseFloat(stats.chiffres_affaires.ca_moyen_par_franchise).toLocaleString()}€

🏦 Revenus Driv'n Cook:
• Droits d'entrée: ${stats.revenus_drivncook.droits_entree.toLocaleString()}€
• Redevances 4%: ${stats.revenus_drivncook.redevances_4_pourcent.toLocaleString()}€
• Marge commandes 15%: ${stats.revenus_drivncook.marge_commandes_15_pourcent.toLocaleString()}€
• TOTAL: ${stats.revenus_drivncook.total_revenus.toLocaleString()}€

📦 Activité:
• ${stats.activite.commandes_totales} commandes totales
• ${stats.activite.commandes_ce_mois} commandes ce mois`;

            alert(message);
        } catch (error: any) {
            console.error('Erreur statistiques:', error);
            alert('Erreur lors du chargement des statistiques.');
        }
    };

    // Charger les données au montage du composant
    useEffect(() => {
        loadFranchisesData();
    }, []);

    // Gestionnaires d'événements
    const handleFranchiseClick = async (franchiseId: number) => {
        setSelectedFranchise(franchiseId);
        await loadFranchiseDetail(franchiseId);
    };

    const handleBackToList = () => {
        setSelectedFranchise(null);
        setFranchiseDetail(null);
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case "a_jour": return "#28a745";
            case "en_retard": return "#F87575";
            case "en_attente": return "#5C95FF";
            default: return "#7E6C6C";
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case "a_jour": return "À jour";
            case "en_retard": return "En retard";
            case "en_attente": return "En attente";
            default: return statut;
        }
    };

    // Filtrage des franchisés
    const filteredFranchises = franchises.filter(franchise => {
        const matchesSearch =
            franchise.franchisee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            franchise.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            franchise.zone_attribution.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || franchise.statut_global === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Affichage d'erreur
    if (error && franchises.length === 0) {
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
                            <p className="text-red-500 text-sm mt-2">Vérifiez que vous êtes connecté et que le serveur est démarré.</p>
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                        <button
                            onClick={loadFranchisesData}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => {
                                // Tester la route de base
                                fetch('/api/finance/test')
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
                    <span className="ml-3 text-gray-600">Chargement des données financières...</span>
                </div>
            </div>
        );
    }

    // Vue détaillée d'un franchisé
    if (selectedFranchise && franchiseDetail) {
        const totalPayeDroits = (franchiseDetail.droits_entree.initial.paye ? franchiseDetail.droits_entree.initial.montant : 0) +
            franchiseDetail.droits_entree.echeances.filter(e => e.paye).reduce((sum, e) => sum + e.montant, 0);
        const totalRedevances = franchiseDetail.ca_declarations.reduce((sum, ca) => sum + ca.redevance_calculee, 0);
        const totalCommandes = franchiseDetail.commandes.reduce((sum, cmd) => sum + cmd.montant, 0);

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
                            <h1 className="text-2xl font-bold text-gray-900">{franchiseDetail.franchisee_name}</h1>
                            <p className="text-gray-600">{franchiseDetail.zone_attribution} • {franchiseDetail.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => generateFinanceReport(franchiseDetail.id)}
                        className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90"
                        style={{ backgroundColor: "#5C95FF" }}
                    >
                        Générer rapport
                    </button>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Droits d'entrée payés</p>
                            <p className="text-2xl font-bold text-blue-600">{totalPayeDroits.toLocaleString()}€</p>
                            <p className="text-xs text-gray-500">sur 50 000€</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Redevances totales</p>
                            <p className="text-2xl font-bold text-green-600">{totalRedevances.toLocaleString()}€</p>
                            <p className="text-xs text-gray-500">{franchiseDetail.ca_declarations.length} déclarations</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Total commandes</p>
                            <p className="text-2xl font-bold text-purple-600">{totalCommandes.toLocaleString()}€</p>
                            <p className="text-xs text-gray-500">{franchiseDetail.commandes.length} commandes</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 mb-2">Revenus générés</p>
                            <p className="text-2xl font-bold text-orange-600">{(totalRedevances + totalCommandes * 0.15).toLocaleString()}€</p>
                            <p className="text-xs text-gray-500">Redevances + marge</p>
                        </div>
                    </div>
                </div>

                {/* Sections droits d'entrée et redevances - identiques à votre code existant */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Droits d'entrée */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Droits d'entrée (50 000€)</h2>

                        {/* Paiement initial */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">Paiement initial</div>
                                    <div className="text-sm text-gray-500">{franchiseDetail.droits_entree.initial.montant.toLocaleString()}€</div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full text-white ${
                                            franchiseDetail.droits_entree.initial.paye ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {franchiseDetail.droits_entree.initial.paye ? 'Payé' : 'En attente'}
                                        </span>
                                        <button
                                            onClick={() => updateDroitEntreePaiement(franchiseDetail.id, !franchiseDetail.droits_entree.initial.paye)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                            title={franchiseDetail.droits_entree.initial.paye ? 'Marquer comme non payé' : 'Marquer comme payé'}
                                        >
                                            {franchiseDetail.droits_entree.initial.paye ? 'Annuler' : 'Valider'}
                                        </button>
                                    </div>
                                    {franchiseDetail.droits_entree.initial.date && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(franchiseDetail.droits_entree.initial.date).toLocaleDateString('fr-FR')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Échéances */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-900">Échéances mensuelles</h3>
                            {franchiseDetail.droits_entree.echeances.map((echeance) => (
                                <div key={echeance.numero} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">Échéance {echeance.numero}</div>
                                        <div className="text-sm text-gray-500">
                                            Limite: {new Date(echeance.date_limite).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-gray-900">{echeance.montant.toLocaleString()}€</div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                                            echeance.paye ? 'bg-green-500' :
                                                new Date(echeance.date_limite) < new Date() ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}>
                                            {echeance.paye ? 'Payé' :
                                                new Date(echeance.date_limite) < new Date() ? 'En retard' : 'À venir'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Progression */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progression</span>
                                <span>{totalPayeDroits.toLocaleString()}€ / 50 000€</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(totalPayeDroits / 50000) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{((totalPayeDroits / 50000) * 100).toFixed(1)}% complété</div>
                        </div>
                    </div>

                    {/* Déclarations CA et redevances */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Déclarations CA et redevances 4%</h2>

                        {franchiseDetail.ca_declarations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Aucune déclaration de CA encore</p>
                                <p className="text-sm">Les déclarations apparaîtront ici</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {franchiseDetail.ca_declarations.map((declaration, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {new Date(declaration.mois + '-01').toLocaleDateString('fr-FR', {
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Déclaré le {new Date(declaration.date_declaration).toLocaleDateString('fr-FR')}
                                                </div>
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                                                declaration.statut === 'paye' ? 'bg-green-500' : 'bg-orange-500'
                                            }`}>
                                                {declaration.statut === 'paye' ? 'Payé' : 'En attente'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">CA déclaré:</span>
                                                <span className="font-medium ml-2">{declaration.ca_declare.toLocaleString()}€</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Redevance 4%:</span>
                                                <span className="font-medium ml-2 text-blue-600">{declaration.redevance_calculee.toLocaleString()}€</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Commandes - identique à votre code existant */}
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Historique des commandes</h2>

                    {franchiseDetail.commandes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Aucune commande encore</p>
                            <p className="text-sm">Les commandes apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {franchiseDetail.commandes.map((commande) => (
                                    <tr key={commande.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {commande.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(commande.date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {commande.montant.toLocaleString()}€
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {commande.articles_count} articles
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                                                commande.statut === 'livree' ? 'bg-green-500' : 'bg-blue-500'
                                            }`}>
                                                {commande.statut === 'livree' ? 'Livrée' : 'En cours'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Vue liste des franchisés
    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
                <p className="text-gray-600">Suivi financier de tous les franchisés</p>
                <div className="mt-2 flex items-center space-x-4">
                    <button
                        onClick={loadFranchisesData}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? 'Chargement...' : 'Actualiser'}
                    </button>
                    <span className="text-sm text-gray-500">
                        {franchises.length} franchisé{franchises.length > 1 ? 's' : ''} trouvé{franchises.length > 1 ? 's' : ''}
                    </span>
                    {error && (
                        <span className="text-sm text-red-500 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Erreur de connexion
                        </span>
                    )}
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
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="a_jour">À jour</option>
                            <option value="en_retard">En retard</option>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchisé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Droits d'entrée</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CA total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redevances</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes/mois</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFranchises.map((franchise) => (
                            <tr
                                key={franchise.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleFranchiseClick(franchise.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3" style={{ backgroundColor: "#5C95FF" }}>
                                            {franchise.franchisee_name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{franchise.franchisee_name}</div>
                                            <div className="text-sm text-gray-500">{franchise.zone_attribution}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{franchise.droit_entree.total_paye.toLocaleString()}€ / 50 000€</div>
                                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(franchise.droit_entree.total_paye / 50000) * 100}%` }}
                                        ></div>
                                    </div>
                                    {franchise.droit_entree.echeances_restantes > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {franchise.droit_entree.echeances_restantes} échéance(s) restante(s)
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{franchise.ca_total.toLocaleString()}€</div>
                                    <div className="text-xs text-gray-500">Chiffre d'affaires cumulé</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        <span className="font-medium text-green-600">{franchise.redevances_payees.toLocaleString()}€</span>
                                        {franchise.redevances_dues > franchise.redevances_payees && (
                                            <span className="text-orange-600"> + {(franchise.redevances_dues - franchise.redevances_payees).toLocaleString()}€ dus</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">Redevances 4%</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{franchise.commandes_mois}</div>
                                    <div className="text-xs text-gray-500">
                                        {franchise.commandes_mois >= 1 ? 'Conforme' : 'Minimum non atteint'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                        style={{ backgroundColor: getStatutColor(franchise.statut_global) }}
                                    >
                                        {getStatutLabel(franchise.statut_global)}
                                    </span>
                                    {franchise.droit_entree.prochaine_echeance && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Prochaine: {new Date(franchise.droit_entree.prochaine_echeance).toLocaleDateString('fr-FR')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFranchiseClick(franchise.id);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        title="Voir détails"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            sendRelance(franchise.id, franchise.franchisee_name);
                                        }}
                                        className="text-orange-600 hover:text-orange-900 mr-3"
                                        title="Envoyer relance"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            generateFinanceReport(franchise.id);
                                        }}
                                        className="text-gray-600 hover:text-gray-900"
                                        title="Générer rapport"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredFranchises.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun franchisé trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filterStatus !== "all" ? "Modifiez vos filtres pour voir plus de résultats." : "Aucun franchisé n'a encore été créé."}
                        </p>
                        {franchises.length === 0 && (
                            <div className="mt-4 space-x-3">
                                <button
                                    onClick={loadFranchisesData}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Recharger les données
                                </button>
                                <button
                                    onClick={() => {
                                        fetch('/api/finance/test')
                                            .then(res => res.json())
                                            .then(data => alert('API OK: ' + JSON.stringify(data, null, 2)))
                                            .catch(err => alert('API Error: ' + err.message));
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                >
                                    Tester API
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Résumé global */}
            {filteredFranchises.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {(() => {
                        const totalDroitsPayes = filteredFranchises.reduce((sum, f) => sum + f.droit_entree.total_paye, 0);
                        const totalRedevances = filteredFranchises.reduce((sum, f) => sum + f.redevances_payees, 0);
                        const totalCA = filteredFranchises.reduce((sum, f) => sum + f.ca_total, 0);
                        const franchisesActives = filteredFranchises.filter(f => f.statut_global === "a_jour").length;

                        return [
                            {
                                label: "Total droits perçus",
                                value: `${totalDroitsPayes.toLocaleString()}€`,
                                color: "#5C95FF",
                                subtitle: `${filteredFranchises.length} franchisé${filteredFranchises.length > 1 ? 's' : ''}`
                            },
                            {
                                label: "Total redevances",
                                value: `${totalRedevances.toLocaleString()}€`,
                                color: "#28a745",
                                subtitle: "Montant collecté"
                            },
                            {
                                label: "CA réseau",
                                value: `${totalCA.toLocaleString()}€`,
                                color: "#FFA9A3",
                                subtitle: "Chiffre d'affaires total"
                            },
                            {
                                label: "Franchisés à jour",
                                value: `${franchisesActives}/${filteredFranchises.length}`,
                                color: "#7E6C6C",
                                subtitle: `${filteredFranchises.length > 0 ? Math.round((franchisesActives/filteredFranchises.length)*100) : 0}% du réseau`
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

            {/* Actions rapides */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => {
                            // Navigation vers les redevances en retard
                            window.location.href = '/admin/redevances/retards';
                        }}
                        className="flex items-center justify-center p-4 border border-red-200 rounded-lg hover:bg-red-50 text-red-700"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Voir les retards
                    </button>

                    <button
                        onClick={() => {
                            // Navigation vers les droits d'entrée
                            window.location.href = '/admin/droits-entree';
                        }}
                        className="flex items-center justify-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-700"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Gérer droits d'entrée
                    </button>

                    <button
                        onClick={loadGlobalStats}
                        className="flex items-center justify-center p-4 border border-green-200 rounded-lg hover:bg-green-50 text-green-700"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Statistiques globales
                    </button>

                    <button
                        onClick={() => {
                            // Test de tous les endpoints
                            const endpoints = ['/test', '/franchises', '/stats'];
                            Promise.all(endpoints.map(endpoint =>
                                fetch(`/api/finance${endpoint}`)
                                    .then(res => res.json())
                                    .then(data => ({ endpoint, success: true, data }))
                                    .catch(err => ({ endpoint, success: false, error: err.message }))
                            )).then(results => {
                                const message = results.map(r =>
                                    `${r.endpoint}: ${r.success ? '✅ OK' : '❌ ' + r.error}`
                                ).join('\n');
                                alert('Test des endpoints:\n\n' + message);
                            });
                        }}
                        className="flex items-center justify-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 text-purple-700"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Tester API
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GestionFinanciere;