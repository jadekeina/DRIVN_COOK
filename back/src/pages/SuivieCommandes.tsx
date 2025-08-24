import React, { useState, useEffect } from "react";

// Interface pour un article commandé
interface CommandeItem {
    id_article: string;
    nom_article: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
}

// Interface pour une commande
interface Commande {
    id: string;
    franchise_id: number;
    franchise_nom: string;
    franchise_zone: string;
    date_commande: string;
    statut: "en_attente" | "confirmee" | "preparee" | "en_livraison" | "livree" | "annulee";
    montant_total: number;
    articles: CommandeItem[];
}

const SuiviCommandes: React.FC = () => {
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

    // Configuration API
    const API_BASE_URL = '/api/commandes';

    const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    };

    // Charger les commandes
    const loadCommandes = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/list`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCommandes(data.commandes || []);
            } else {
                throw new Error('Erreur API');
            }
        } catch (error) {
            console.error('Erreur chargement commandes:', error);
            // Données de test
            setCommandes([
                {
                    id: "CMD-2025-001",
                    franchise_id: 1,
                    franchise_nom: "Franchise Paris 15ème",
                    franchise_zone: "Paris 15ème",
                    date_commande: "2025-01-20T09:30:00Z",
                    statut: "livree",
                    montant_total: 1250.50,
                    articles: [
                        {
                            id_article: "ART-001",
                            nom_article: "Pain de mie complet",
                            quantite: 20,
                            prix_unitaire: 2.50,
                            sous_total: 50.00
                        },
                        {
                            id_article: "ART-002",
                            nom_article: "Farine T65 Bio 1kg",
                            quantite: 15,
                            prix_unitaire: 3.20,
                            sous_total: 48.00
                        },
                        {
                            id_article: "ART-003",
                            nom_article: "Chocolat noir 70%",
                            quantite: 8,
                            prix_unitaire: 12.50,
                            sous_total: 100.00
                        }
                    ]
                },
                {
                    id: "CMD-2025-002",
                    franchise_id: 2,
                    franchise_nom: "Franchise Lyon Centre",
                    franchise_zone: "Lyon Centre",
                    date_commande: "2025-01-21T14:20:00Z",
                    statut: "en_livraison",
                    montant_total: 850.75,
                    articles: [
                        {
                            id_article: "ART-001",
                            nom_article: "Pain de mie complet",
                            quantite: 10,
                            prix_unitaire: 2.50,
                            sous_total: 25.00
                        },
                        {
                            id_article: "ART-004",
                            nom_article: "Beurre demi-sel 250g",
                            quantite: 12,
                            prix_unitaire: 4.80,
                            sous_total: 57.60
                        }
                    ]
                },
                {
                    id: "CMD-2025-003",
                    franchise_id: 3,
                    franchise_nom: "Franchise Marseille",
                    franchise_zone: "Marseille Vieux Port",
                    date_commande: "2025-01-19T16:45:00Z",
                    statut: "confirmee",
                    montant_total: 450.25,
                    articles: [
                        {
                            id_article: "ART-002",
                            nom_article: "Farine T65 Bio 1kg",
                            quantite: 25,
                            prix_unitaire: 3.20,
                            sous_total: 80.00
                        },
                        {
                            id_article: "ART-005",
                            nom_article: "Sucre blanc 1kg",
                            quantite: 20,
                            prix_unitaire: 1.85,
                            sous_total: 37.00
                        }
                    ]
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCommandes();
    }, []);

    // Fonction pour obtenir la couleur du statut
    const getStatutColor = (statut: string) => {
        switch (statut) {
            case "en_attente": return "bg-gray-500";
            case "confirmee": return "bg-blue-500";
            case "preparee": return "bg-yellow-500";
            case "en_livraison": return "bg-orange-500";
            case "livree": return "bg-green-500";
            case "annulee": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case "en_attente": return "En attente";
            case "confirmee": return "Confirmée";
            case "preparee": return "Préparée";
            case "en_livraison": return "En livraison";
            case "livree": return "Livrée";
            case "annulee": return "Annulée";
            default: return statut;
        }
    };

    // Filtrer les commandes par recherche
    const filteredCommandes = commandes.filter(commande =>
        commande.franchise_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement...</span>
                </div>
            </div>
        );
    }

    // Affichage des détails d'une commande (vue Excel des articles)
    if (selectedCommande) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <button
                        onClick={() => setSelectedCommande(null)}
                        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour aux commandes
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Détail commande {selectedCommande.id}</h1>
                    <p className="text-gray-600">{selectedCommande.franchise_nom} - {new Date(selectedCommande.date_commande).toLocaleDateString('fr-FR')}</p>
                </div>

                {/* Tableau style Excel des articles */}
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">ID Article</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">Nom Article</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r">Quantité</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-r">Prix Unitaire</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sous-total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {selectedCommande.articles.map((article, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 border-r font-mono">{article.id_article}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 border-r">{article.nom_article}</td>
                                <td className="px-4 py-3 text-sm text-center text-gray-900 border-r">{article.quantite}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900 border-r">{article.prix_unitaire.toFixed(2)}€</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{article.sous_total.toFixed(2)}€</td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right border-r">Total commande:</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{selectedCommande.montant_total.toFixed(2)}€</td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    }

    // Affichage principal - Liste des commandes
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Commandes des Franchises</h1>
                <p className="text-gray-600">Liste des commandes passées par vos franchisés</p>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par franchise ou numéro de commande..."
                        className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Liste des commandes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchise</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommandes.map((commande) => (
                        <tr key={commande.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{commande.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{commande.franchise_nom}</div>
                                    <div className="text-sm text-gray-500">{commande.franchise_zone}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(commande.date_commande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {commande.montant_total.toFixed(2)}€
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatutColor(commande.statut)}`}>
                                        {getStatutLabel(commande.statut)}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => setSelectedCommande(commande)}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    Voir détails
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {filteredCommandes.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? "Modifiez votre recherche pour voir plus de résultats." : "Aucune commande disponible."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuiviCommandes;