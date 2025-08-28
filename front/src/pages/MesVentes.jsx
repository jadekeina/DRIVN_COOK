import React, { useState, useEffect } from "react";
import FranchiseHeader from "../components/headers/FranchiseHeader";
import {
    ShoppingCart,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    TrendingUp,
    DollarSign,
    Users,
    Package,
    X,
    Check,
    AlertCircle,
    Timer,
} from "lucide-react";

const MesVentes = () => {
    const [user, setUser] = useState(null);
    const [articles, setArticles] = useState([]);
    const [ventes, setVentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaiementModal, setShowPaiementModal] = useState(false);
    const [selectedArticles, setSelectedArticles] = useState([]);
    const [modePaiement, setModePaiement] = useState("carte");
    const [montantRecu, setMontantRecu] = useState("");
    const [stats, setStats] = useState({
        venteJour: 0,
        venteMois: 0,
        clientsJour: 0,
        articlesPlusDemandes: []
    });

    // Simulation de données - à remplacer par les appels API
    const mockArticles = [
        {
            id: 1,
            nom: "Burger Classic",
            description: "Burger avec steak, salade, tomate, oignon",
            prix_vente: 15.90,
            stock_franchise: 8,
            categorie: "burgers",
            temps_preparation: "8-10 min"
        },
        {
            id: 2,
            nom: "Frites Maison",
            description: "Frites fraîches coupées à la main",
            prix_vente: 6.50,
            stock_franchise: 12,
            categorie: "accompagnements",
            temps_preparation: "5 min"
        },
        {
            id: 3,
            nom: "Coca Cola 33cl",
            description: "Canette de Coca Cola",
            prix_vente: 3.50,
            stock_franchise: 24,
            categorie: "boissons",
            temps_preparation: "Immédiat"
        },
        {
            id: 4,
            nom: "Wrap Poulet",
            description: "Wrap avec poulet grillé et légumes",
            prix_vente: 12.90,
            stock_franchise: 3,
            categorie: "wraps",
            temps_preparation: "6-8 min"
        },
    ];

    const mockVentes = [
        {
            id: 1,
            date_vente: "2024-08-24T14:30:00Z",
            total: 22.40,
            mode_paiement: "carte",
            articles: [
                { nom: "Burger Classic", quantite: 1, prix_vente: 15.90 },
                { nom: "Coca Cola 33cl", quantite: 2, prix_vente: 3.50 }
            ]
        },
        {
            id: 2,
            date_vente: "2024-08-24T13:15:00Z",
            total: 19.40,
            mode_paiement: "especes",
            articles: [
                { nom: "Wrap Poulet", quantite: 1, prix_vente: 12.90 },
                { nom: "Frites Maison", quantite: 1, prix_vente: 6.50 }
            ]
        }
    ];

    const modesPaiement = [
        { id: "carte", label: "Carte bancaire", icon: CreditCard },
        { id: "especes", label: "Espèces", icon: Banknote },
        { id: "mobile", label: "Paiement mobile", icon: Smartphone }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            setTimeout(() => {
                setArticles(mockArticles);
                setVentes(mockVentes);
                setStats({
                    venteJour: 127.80,
                    venteMois: 2450.30,
                    clientsJour: 8,
                    articlesPlusDemandes: [
                        { nom: "Burger Classic", quantite: 15 },
                        { nom: "Frites Maison", quantite: 12 }
                    ]
                });
                setUser({ first_name: "Jean", last_name: "Dupont" });
                setLoading(false);
            }, 1000);

        } catch (error) {
            console.error("Erreur chargement données:", error);
            setLoading(false);
        }
    };

    const ajouterArticle = (articleId, quantite = 1) => {
        const article = articles.find(a => a.id === articleId);
        if (!article || article.stock_franchise < quantite) return;

        const existingIndex = selectedArticles.findIndex(item => item.id === articleId);

        if (existingIndex >= 0) {
            const newQuantite = selectedArticles[existingIndex].quantite + quantite;
            if (newQuantite > article.stock_franchise) {
                alert(`Stock insuffisant. Stock disponible: ${article.stock_franchise}`);
                return;
            }

            setSelectedArticles(prev => prev.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantite: newQuantite }
                    : item
            ));
        } else {
            setSelectedArticles(prev => [...prev, {
                id: articleId,
                nom: article.nom,
                prix_vente: article.prix_vente,
                quantite: quantite
            }]);
        }
    };

    const retirerArticle = (articleId, quantite = 1) => {
        setSelectedArticles(prev => {
            const existingIndex = prev.findIndex(item => item.id === articleId);
            if (existingIndex >= 0) {
                const newQuantite = prev[existingIndex].quantite - quantite;
                if (newQuantite <= 0) {
                    return prev.filter((_, index) => index !== existingIndex);
                } else {
                    return prev.map((item, index) =>
                        index === existingIndex
                            ? { ...item, quantite: newQuantite }
                            : item
                    );
                }
            }
            return prev;
        });
    };

    const viderSelection = () => {
        setSelectedArticles([]);
    };

    const finaliserVente = async () => {
        if (selectedArticles.length === 0) return;

        const total = totalSelection;

        if (modePaiement === "especes") {
            const montant = parseFloat(montantRecu);
            if (isNaN(montant) || montant < total) {
                alert("Le montant reçu est insuffisant");
                return;
            }
        }

        try {
            const nouvelleVente = {
                id: Date.now(),
                date_vente: new Date().toISOString(),
                total: total,
                mode_paiement: modePaiement,
                articles: selectedArticles
            };

            setVentes(prev => [nouvelleVente, ...prev]);

            setArticles(prev => prev.map(article => {
                const articleVendu = selectedArticles.find(item => item.id === article.id);
                if (articleVendu) {
                    return {
                        ...article,
                        stock_franchise: article.stock_franchise - articleVendu.quantite
                    };
                }
                return article;
            }));

            alert("Vente enregistrée avec succès!");
            viderSelection();
            setShowPaiementModal(false);
            setMontantRecu("");

        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la vente:", error);
            alert("Erreur lors de l'enregistrement de la vente");
        }
    };

    const totalSelection = selectedArticles.reduce((total, item) =>
        total + (item.prix_vente * item.quantite), 0);

    const monnaieARendre = modePaiement === "especes" && montantRecu ?
        Math.max(0, parseFloat(montantRecu) - totalSelection) : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <FranchiseHeader />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div
                            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                            style={{ borderColor: "#5C95FF", borderTopColor: "transparent" }}
                        ></div>
                        <p className="text-gray-600">Chargement de l'interface de vente...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <FranchiseHeader />

            {/* Header avec stats rapides */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: "#7E6C6C" }}>
                                <ShoppingCart className="w-8 h-8 mr-3 inline" style={{ color: "#5C95FF" }} />
                                Mes Ventes
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Interface de vente pour vos clients
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPaiementModal(true)}
                            className="px-6 py-3 rounded-lg font-semibold text-white flex items-center hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "#5C95FF" }}
                            disabled={selectedArticles.length === 0}
                        >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Encaisser ({selectedArticles.length})
                        </button>
                    </div>

                    {/* Stats rapides */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg p-4" style={{ backgroundColor: "#B9E6FF" }}>
                            <div className="flex items-center">
                                <DollarSign className="w-8 h-8 mr-3" style={{ color: "#5C95FF" }} />
                                <div>
                                    <p className="text-sm" style={{ color: "#5C95FF" }}>Ventes aujourd'hui</p>
                                    <p className="text-xl font-bold" style={{ color: "#7E6C6C" }}>{stats.venteJour.toFixed(2)}€</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg p-4" style={{ backgroundColor: "#FFA9A3" }}>
                            <div className="flex items-center">
                                <TrendingUp className="w-8 h-8 mr-3" style={{ color: "#7E6C6C" }} />
                                <div>
                                    <p className="text-sm" style={{ color: "#7E6C6C" }}>Ventes ce mois</p>
                                    <p className="text-xl font-bold" style={{ color: "#7E6C6C" }}>{stats.venteMois.toFixed(2)}€</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg p-4" style={{ backgroundColor: "#B9E6FF" }}>
                            <div className="flex items-center">
                                <Users className="w-8 h-8 mr-3" style={{ color: "#5C95FF" }} />
                                <div>
                                    <p className="text-sm" style={{ color: "#5C95FF" }}>Clients aujourd'hui</p>
                                    <p className="text-xl font-bold" style={{ color: "#7E6C6C" }}>{stats.clientsJour}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg p-4" style={{ backgroundColor: "#FFA9A3" }}>
                            <div className="flex items-center">
                                <Package className="w-8 h-8 mr-3" style={{ color: "#7E6C6C" }} />
                                <div>
                                    <p className="text-sm" style={{ color: "#7E6C6C" }}>Articles en stock</p>
                                    <p className="text-xl font-bold" style={{ color: "#7E6C6C" }}>
                                        {articles.reduce((total, article) => total + article.stock_franchise, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Articles à vendre */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: "#7E6C6C" }}>Menu disponible</h2>
                            {selectedArticles.length > 0 && (
                                <button
                                    onClick={viderSelection}
                                    className="font-medium flex items-center hover:opacity-80 transition-opacity"
                                    style={{ color: "#F87575" }}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Vider la sélection
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {articles.filter(article => article.stock_franchise > 0).map((article) => {
                                const selectedItem = selectedArticles.find(item => item.id === article.id);
                                const quantiteSelectionnee = selectedItem ? selectedItem.quantite : 0;

                                return (
                                    <div key={article.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg text-gray-900">{article.nom}</h3>
                                                <span className="text-2xl font-bold" style={{ color: "#5C95FF" }}>
                          {article.prix_vente.toFixed(2)}€
                        </span>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-3">{article.description}</p>

                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span className="flex items-center">
                          <Timer className="w-3 h-3 mr-1" />
                            {article.temps_preparation}
                        </span>
                                                <span className={`flex items-center ${article.stock_franchise < 5 ? 'text-red-600' : 'text-green-600'}`}>
                          <Package className="w-3 h-3 mr-1" />
                          Stock: {article.stock_franchise}
                        </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center border rounded-lg">
                                                    <button
                                                        onClick={() => retirerArticle(article.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-l-lg"
                                                        disabled={quantiteSelectionnee === 0}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="px-3 py-2 border-x min-w-[3rem] text-center font-medium">
                            {quantiteSelectionnee}
                          </span>
                                                    <button
                                                        onClick={() => ajouterArticle(article.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-r-lg"
                                                        disabled={quantiteSelectionnee >= article.stock_franchise}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => ajouterArticle(article.id)}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center hover:opacity-90 transition-opacity"
                                                    style={{ backgroundColor: "#5C95FF" }}
                                                    disabled={quantiteSelectionnee >= article.stock_franchise}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Ajouter des articles
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {articles.filter(article => article.stock_franchise > 0).length === 0 && (
                                <div className="col-span-2 text-center py-12">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article disponible</h3>
                                    <p className="text-gray-600">Tous vos articles sont en rupture de stock</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ventes récentes */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: "#7E6C6C" }}>Ventes récentes</h2>

                        <div className="space-y-3">
                            {ventes.slice(0, 8).map((vente) => (
                                <div key={vente.id} className="bg-white rounded-lg shadow-sm border p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-900">Vente #{vente.id}</span>
                                        <span className="font-bold" style={{ color: "#5C95FF" }}>
                      {vente.total.toFixed(2)}€
                    </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>{new Date(vente.date_vente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="capitalize flex items-center">
                      {vente.mode_paiement === "carte" && <CreditCard className="w-3 h-3 mr-1" />}
                                            {vente.mode_paiement === "especes" && <Banknote className="w-3 h-3 mr-1" />}
                                            {vente.mode_paiement === "mobile" && <Smartphone className="w-3 h-3 mr-1" />}
                                            {vente.mode_paiement}
                    </span>
                                    </div>
                                </div>
                            ))}

                            {ventes.length === 0 && (
                                <div className="text-center py-4">
                                    <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">Aucune vente aujourd'hui</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sélection actuelle */}
                {selectedArticles.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-xl font-semibold mb-4" style={{ color: "#7E6C6C" }}>
                            Articles sélectionnés
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {selectedArticles.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.nom}</p>
                                        <p className="text-sm text-gray-600">
                                            {item.prix_vente.toFixed(2)}€ x {item.quantite}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: "#5C95FF" }}>
                      {(item.prix_vente * item.quantite).toFixed(2)}€
                    </span>
                                        <button
                                            onClick={() => retirerArticle(item.id, item.quantite)}
                                            className="text-gray-400 hover:text-red-600 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total:</span>
                                <span style={{ color: "#5C95FF" }}>{totalSelection.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de paiement */}
            {showPaiementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold" style={{ color: "#7E6C6C" }}>
                                    Finaliser la vente
                                </h3>
                                <button
                                    onClick={() => setShowPaiementModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Récapitulatif commande */}
                            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: "#B9E6FF" }}>
                                <h4 className="font-medium mb-3" style={{ color: "#7E6C6C" }}>Récapitulatif</h4>
                                <div className="space-y-2">
                                    {selectedArticles.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>{item.quantite}x {item.nom}</span>
                                            <span>{(item.prix_vente * item.quantite).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span>{totalSelection.toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mode de paiement */}
                            <div className="mb-6">
                                <h4 className="font-medium mb-3" style={{ color: "#7E6C6C" }}>Mode de paiement</h4>
                                <div className="space-y-2">
                                    {modesPaiement.map((mode) => {
                                        const Icon = mode.icon;
                                        return (
                                            <button
                                                key={mode.id}
                                                onClick={() => setModePaiement(mode.id)}
                                                className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                                                    modePaiement === mode.id
                                                        ? 'border-gray-300'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                style={modePaiement === mode.id ? {
                                                    borderColor: "#5C95FF",
                                                    backgroundColor: "#B9E6FF"
                                                } : {}}
                                            >
                                                <Icon className="w-5 h-5 mr-3 text-gray-600" />
                                                <span className="flex-1 text-left">{mode.label}</span>
                                                {modePaiement === mode.id && <Check className="w-5 h-5" style={{ color: "#5C95FF" }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Montant reçu pour espèces */}
                            {modePaiement === "especes" && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Montant reçu
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={montantRecu}
                                        onChange={(e) => setMontantRecu(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                        style={{
                                            focusRingColor: "#5C95FF",
                                            focusBorderColor: "#5C95FF"
                                        }}
                                    />
                                    {montantRecu && (
                                        <div className="mt-2 text-sm">
                                            <span className="text-gray-600">Monnaie à rendre: </span>
                                            <span className="font-bold" style={{ color: "#5C95FF" }}>
                        {monnaieARendre.toFixed(2)}€
                      </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPaiementModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={finaliserVente}
                                    className="flex-1 px-4 py-2 text-white rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: "#5C95FF" }}
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Encaisser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default MesVentes;