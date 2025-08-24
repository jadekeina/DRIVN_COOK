import React, { useState, useEffect } from "react";

interface Article {
    id: number;
    id_article?: string; // ID formaté comme "ART-001" depuis l'API
    nom: string;
    description: string;
    stock_actuel: number;
    seuil_alerte: number;
    prix_unitaire: number;
    unite: string; // "kg", "piece", "litre"
    categorie: string;
    date_derniere_maj?: string;
    date_creation?: string; // Depuis l'API
    fournisseur?: string;
    statut: "disponible" | "rupture" | "alerte";
}

interface MouvementStock {
    id: number;
    article_id: number;
    article_nom: string;
    type: "entree" | "sortie";
    quantite: number;
    motif: string;
    date: string;
    utilisateur: string;
}

const GestionStocks: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMouvementModal, setShowMouvementModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategorie, setFilterCategorie] = useState("all");
    const [filterStatut, setFilterStatut] = useState("all");

    // Configuration API - j'utilise l'URL correcte selon tes routes
    const API_BASE_URL = '/api/stocks';

    // Fonction pour récupérer le token d'authentification
    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    };

    // Fonction utilitaire pour les appels API avec gestion d'erreur améliorée
    const apiCall = async (endpoint: string, options: RequestInit = {}) => {
        try {
            const token = getAuthToken();
            console.log(`[API] Appel vers: ${API_BASE_URL}${endpoint}`);

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers,
                },
            });

            console.log(`[API] Réponse reçue: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[API] Données reçues:', data);

            if (!data.success) {
                throw new Error(data.message || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('[API] Erreur:', error);
            throw error;
        }
    };

    // Fonction pour déterminer le statut d'un article basé sur son stock
    const determinerStatut = (article: any): "disponible" | "rupture" | "alerte" => {
        if (article.stock_actuel === 0) return "rupture";
        if (article.stock_actuel <= article.seuil_alerte) return "alerte";
        return "disponible";
    };

    // Charger les articles depuis l'API
    const loadArticles = async () => {
        try {
            setLoading(true);
            console.log('[STOCK] Chargement des articles...');

            const data = await apiCall('/articles');

            // Traitement des données reçues depuis l'API
            const articlesFormattes = data.articles.map((article: any) => ({
                id: article.id,
                id_article: article.id_article, // Format "ART-001"
                nom: article.nom,
                description: article.description || '',
                stock_actuel: article.stock_actuel || 0,
                seuil_alerte: article.seuil_alerte || 15,
                prix_unitaire: parseFloat(article.prix_unitaire) || 0,
                unite: article.unite || 'piece',
                categorie: article.categorie || 'Autre',
                date_derniere_maj: article.date_creation || new Date().toISOString().split('T')[0],
                fournisseur: article.fournisseur || 'Fournisseur Standard',
                statut: determinerStatut(article)
            }));

            console.log(`[STOCK] ${articlesFormattes.length} articles chargés avec succès`);
            setArticles(articlesFormattes);

        } catch (error) {
            console.error('[STOCK] Erreur chargement articles:', error);

            // Affichage d'un message d'erreur à l'utilisateur
            alert('Erreur lors du chargement des articles. Vérifiez votre connexion ou contactez l\'administrateur.');

            // En cas d'erreur, on peut optionnellement charger des données de test
            // pour permettre à l'utilisateur de continuer à utiliser l'interface
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    // Charger l'historique des mouvements (à implémenter côté API plus tard)
    const loadMouvements = async () => {
        try {
            console.log('[STOCK] Tentative de chargement des mouvements...');

            // Pour l'instant, l'API n'a pas cette route, on garde des données de test
            const mouvementsTest = [
                {
                    id: 1,
                    article_id: 1,
                    article_nom: "Pain de mie complet",
                    type: "entree" as const,
                    quantite: 50,
                    motif: "Livraison fournisseur",
                    date: "2025-01-20T10:30:00Z",
                    utilisateur: "Admin"
                },
                {
                    id: 2,
                    article_id: 2,
                    article_nom: "Farine T65",
                    type: "sortie" as const,
                    quantite: 20,
                    motif: "Commande Franchise Paris",
                    date: "2025-01-19T14:15:00Z",
                    utilisateur: "Admin"
                }
            ];

            setMouvements(mouvementsTest);
            console.log('[STOCK] Mouvements de test chargés');

        } catch (error) {
            console.error('[STOCK] Erreur chargement mouvements:', error);
            setMouvements([]);
        }
    };

    // Ajouter un mouvement de stock (à implémenter côté API)
    const ajouterMouvement = async (articleId: number, type: "entree" | "sortie", quantite: number, motif: string) => {
        try {
            console.log('[STOCK] Ajout mouvement:', { articleId, type, quantite, motif });

            // Cette route n'existe pas encore dans ton API, je la commente pour éviter les erreurs
            /*
            await apiCall('/mouvements', {
                method: 'POST',
                body: JSON.stringify({
                    article_id: articleId,
                    type,
                    quantite,
                    motif,
                    date: new Date().toISOString()
                })
            });
            */

            // Simulation de l'ajout pour l'instant
            alert('Fonctionnalité d\'ajout de mouvement à implémenter côté API');

            // Recharger les données après ajout
            // await loadArticles();
            // await loadMouvements();

        } catch (error) {
            console.error('[STOCK] Erreur ajout mouvement:', error);
            alert('Erreur lors de l\'ajout du mouvement');
        }
    };

    // Chargement initial des données
    useEffect(() => {
        console.log('[STOCK] Initialisation du composant');
        loadArticles();
        loadMouvements();
    }, []);

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case "disponible": return "#28a745";
            case "alerte": return "#ffc107";
            case "rupture": return "#dc3545";
            default: return "#6c757d";
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case "disponible": return "Disponible";
            case "alerte": return "Stock faible";
            case "rupture": return "Rupture";
            default: return statut;
        }
    };

    // Filtrage des articles
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategorie = filterCategorie === "all" || article.categorie === filterCategorie;
        const matchesStatut = filterStatut === "all" || article.statut === filterStatut;
        return matchesSearch && matchesCategorie && matchesStatut;
    });

    // Obtenir les catégories uniques
    const categories = Array.from(new Set(articles.map(a => a.categorie)));

    // Écran de chargement
    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des stocks...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header avec bouton de rechargement */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des Stocks & Articles</h1>
                        <p className="text-gray-600">Gérez votre inventaire et suivez les mouvements de stock</p>
                    </div>
                    <button
                        onClick={loadArticles}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
                        disabled={loading}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Total Articles</p>
                        <p className="text-2xl font-bold text-blue-600">{articles.length}</p>
                        <p className="text-xs text-gray-500">articles référencés</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Stock faible</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {articles.filter(a => a.statut === "alerte").length}
                        </p>
                        <p className="text-xs text-gray-500">alertes actives</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Ruptures</p>
                        <p className="text-2xl font-bold text-red-600">
                            {articles.filter(a => a.statut === "rupture").length}
                        </p>
                        <p className="text-xs text-gray-500">articles épuisés</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Valeur stock</p>
                        <p className="text-2xl font-bold text-green-600">
                            {articles.reduce((sum, a) => sum + (a.stock_actuel * a.prix_unitaire), 0).toLocaleString()}€
                        </p>
                        <p className="text-xs text-gray-500">estimation</p>
                    </div>
                </div>
            </div>

            {/* Filtres et actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher un article..."
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                    style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <select
                            value={filterCategorie}
                            onChange={(e) => setFilterCategorie(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        >
                            <option value="all">Toutes catégories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatut}
                            onChange={(e) => setFilterStatut(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        >
                            <option value="all">Tous statuts</option>
                            <option value="disponible">Disponible</option>
                            <option value="alerte">Stock faible</option>
                            <option value="rupture">Rupture</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 text-white rounded-lg font-medium hover:opacity-90"
                            style={{ backgroundColor: "#5C95FF" }}
                        >
                            + Nouvel Article
                        </button>
                        <button
                            onClick={() => setShowMouvementModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                        >
                            + Mouvement
                        </button>
                    </div>
                </div>
            </div>

            {/* Message d'information si pas de données */}
            {articles.length === 0 && !loading && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="text-yellow-800 font-medium">Aucun article trouvé</h3>
                            <p className="text-yellow-700 text-sm mt-1">
                                Vérifiez votre connexion à l'API ou ajoutez votre premier article.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des articles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière MAJ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredArticles.map((article) => (
                            <tr key={article.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{article.nom}</div>
                                        <div className="text-sm text-gray-500">{article.description}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {article.id_article} - {article.categorie}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        <span className="font-medium">{article.stock_actuel}</span> {article.unite}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Seuil: {article.seuil_alerte} {article.unite}
                                    </div>
                                    {article.stock_actuel <= article.seuil_alerte && (
                                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-red-500 h-1.5 rounded-full"
                                                style={{ width: `${Math.max(10, (article.stock_actuel / article.seuil_alerte) * 100)}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {article.prix_unitaire.toFixed(2)}€
                                    </div>
                                    <div className="text-xs text-gray-500">par {article.unite}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                            style={{ backgroundColor: getStatutColor(article.statut) }}
                                        >
                                            {getStatutLabel(article.statut)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(article.date_derniere_maj || article.date_creation || '').toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedArticle(article);
                                                setShowMouvementModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Ajouter mouvement"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </button>
                                        <button
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Modifier"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredArticles.length === 0 && articles.length > 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Modifiez vos filtres pour voir plus de résultats.
                        </p>
                    </div>
                )}
            </div>

            {/* Derniers mouvements */}

            {/* Modales - À implémenter plus tard */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Ajouter un article</h3>
                        <p className="text-gray-600 mb-4">Fonctionnalité à implémenter</p>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {showMouvementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Ajouter un mouvement</h3>
                        <p className="text-gray-600 mb-4">
                            {selectedArticle ? `Pour: ${selectedArticle.nom} (${selectedArticle.id_article})` : 'Fonctionnalité à implémenter'}
                        </p>
                        <button
                            onClick={() => {
                                setShowMouvementModal(false);
                                setSelectedArticle(null);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionStocks;