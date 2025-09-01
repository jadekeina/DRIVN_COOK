import React, { useState, useEffect } from "react";
import FranchiseHeader from "../components/headers/FranchiseHeader";
import {
    Package,
    ShoppingCart,
    Plus,
    Minus,
    AlertCircle,
    CheckCircle,
    Timer,
    Eye,
    RefreshCw,
    X,
    CreditCard,
    Download,
    Mail,
} from "lucide-react";

const MesCommandes = () => {
    const [user, setUser] = useState(null);
    const [articles, setArticles] = useState([]);
    const [commandes, setCommandes] = useState([]);
    const [panier, setPanier] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCommandeModal, setShowCommandeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [franchiseActive, setFranchiseActive] = useState(false);
    const [error, setError] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [commandeEnCours, setCommandeEnCours] = useState(null);

    // Configuration API
    const API_BASE_URL = 'http://localhost:3002/api';

    // Récupérer le token d'authentification
    const getAuthToken = () => {
        return localStorage.getItem("token") || localStorage.getItem("authToken") || '';
    };

    // Fonction utilitaire pour les appels API
    const apiCall = async (endpoint, options = {}) => {
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

            console.log(`[API] Réponse: ${response.status} ${response.statusText}`);

            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Endpoint non trouvé (${response.status}). Vérifiez que l'API est démarrée.`);
                }
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Réponse non-JSON reçue. Content-Type: ${contentType}`);
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

    const loadUserData = async () => {
        console.log('=== DEBUG TOKEN ===');
        console.log('localStorage complet:', localStorage);
        console.log('sessionStorage complet:', sessionStorage);
        console.log('token direct:', localStorage.getItem('token'));
        console.log('authToken direct:', localStorage.getItem('authToken'));
        try {
            console.log('[USER] Chargement des données utilisateur...');
            const userData = await apiCall('/auth/profile');

            if (userData && userData.data) {
                setUser(userData.data);

                // >>> Franchise toujours active (on supprime la vérification des 50k)
                setFranchiseActive(true);

                console.log('[USER] Utilisateur chargé:', userData.data.email);
            }
        } catch (error) {
            console.error('[USER] Erreur chargement utilisateur:', error);
            // Utiliser des données par défaut si erreur
            setUser({
                first_name: "Test",
                last_name: "User",
                email: "test@drivncook.fr",
                id: 13, // Utiliser l'ID de l'utilisateur de test créé
                payment_status: 'pending'
            });
            setFranchiseActive(true); // Toujours actif aussi en fallback
        }
    };

    // Charger les données initiales
    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('[COMMANDES] Chargement des données...');

            // 1. D'abord charger les données utilisateur
            await loadUserData();

            let articlesFormattes = [];
            let commandesFormatees = [];

            // 2. Charger les articles
            try {
                console.log('[COMMANDES] Chargement des articles...');
                const articlesData = await apiCall('/stocks/articles');

                articlesFormattes = articlesData.articles.map(article => ({
                    id: article.id,
                    nom: article.nom,
                    description: article.description || '',
                    prix_unitaire: parseFloat(article.prix_unitaire || 0),
                    stock_central: article.stock_actuel || 0,
                    stock_franchise: Math.floor(Math.random() * 50) + 1,
                    stock_minimum: article.seuil_alerte || 5,
                    categorie: article.categorie || 'autre'
                }));

                console.log(`[COMMANDES] ${articlesFormattes.length} articles chargés`);
            } catch (apiError) {
                console.error('[COMMANDES] Erreur API articles:', apiError.message);
                setError(`Impossible de charger les articles: ${apiError.message}`);
            }

            // 3. Charger l'historique des commandes
            try {
                console.log('[COMMANDES] Chargement des commandes...');
                const commandesData = await apiCall('/commandes/my-commandes');

                // Filtrer uniquement les commandes de cette franchise
                commandesFormatees = commandesData.commandes
                    .map(commande => ({
                        id: commande.id,
                        date_commande: commande.date_commande,
                        statut: commande.statut,
                        total: commande.montant_total,
                        articles: commande.articles.map(article => ({
                            nom: article.nom_article,
                            quantite: article.quantite,
                            prix_unitaire: article.prix_unitaire
                        })),
                        bon_commande_url: commande.bon_commande_url
                    }));

                console.log(`[COMMANDES] ${commandesFormatees.length} commandes chargées`);
            } catch (apiError) {
                console.error('[COMMANDES] Erreur API commandes:', apiError.message);
                commandesFormatees = [];
            }

            // 4. Mettre à jour les états
            setArticles(articlesFormattes);
            setCommandes(commandesFormatees);

        } catch (error) {
            console.error("Erreur chargement données:", error);
            setError(`Erreur lors du chargement: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Créer une session de paiement Stripe
    const initierPaiementStripe = async (commande) => {
        try {
            setProcessingPayment(true);
            console.log('[STRIPE] Initialisation du paiement pour la commande:', commande);

            const response = await apiCall('/commandes/create-payment-session', {
                method: 'POST',
                body: JSON.stringify({
                    commande_id: commande.id,
                    montant_total: commande.montant_total,
                    franchise_id: user.id,
                    franchise_email: user.email,
                    articles: commande.articles
                })
            });

            if (response.checkout_url) {
                // Rediriger vers Stripe Checkout
                window.location.href = response.checkout_url;
            } else {
                throw new Error('URL de paiement non reçue');
            }

        } catch (error) {
            console.error('[STRIPE] Erreur paiement:', error);
            alert(`Erreur lors de l'initialisation du paiement: ${error.message}`);
        } finally {
            setProcessingPayment(false);
        }
    };

    // Télécharger le bon de commande
// Dans MesCommandes.jsx, remplacer la fonction telechargerBonCommande par celle-ci :

// Télécharger le bon de commande - NOUVELLE VERSION inspirée de CandidatureDetails
    const telechargerBonCommande = async (commandeId) => {
        try {
            console.log('[BON] Téléchargement du bon de commande:', commandeId);

            // URL pour télécharger le bon de commande
            const downloadUrl = `${API_BASE_URL}/commandes/${commandeId}/bon-commande-download`;

            // Récupérer le token pour l'authentification
            const token = getAuthToken();

            console.log('[BON] URL de téléchargement:', downloadUrl);

            // Faire l'appel avec fetch pour récupérer le fichier
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[BON] Statut réponse:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    alert('Bon de commande non trouvé. Il sera généré lors du prochain paiement.');
                    return;
                }
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            // Récupérer les headers pour le nom du fichier
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `bon-commande-${commandeId}.pdf`;

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1];
                }
            }

            console.log('[BON] Nom du fichier:', fileName);

            // Convertir la réponse en blob
            const blob = await response.blob();
            console.log('[BON] Taille du blob:', blob.size, 'bytes');

            // Créer un URL temporaire pour le blob
            const url = window.URL.createObjectURL(blob);

            // Créer un lien de téléchargement temporaire
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none'; // Masquer le lien

            // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Nettoyer l'URL temporaire
            window.URL.revokeObjectURL(url);

            console.log('[BON] Téléchargement terminé avec succès');

        } catch (error) {
            console.error('[BON] Erreur téléchargement:', error);
            alert(`Erreur lors du téléchargement du bon de commande: ${error.message}`);
        }
    };

    // Ajouter un article au panier
    const ajouterAuPanier = (articleId, quantite = 1) => {
        if (!franchiseActive) {
            alert('Votre franchise doit être activée pour passer des commandes. Veuillez effectuer le paiement initial.');
            return;
        }

        const article = articles.find(a => a.id === articleId);
        if (!article) {
            alert('Article non trouvé');
            return;
        }

        const quantiteActuelle = panier[articleId] || 0;
        const nouvelleQuantite = quantiteActuelle + quantite;

        if (nouvelleQuantite > article.stock_central) {
            alert(`Stock insuffisant. Stock disponible: ${article.stock_central}`);
            return;
        }

        setPanier(prev => ({
            ...prev,
            [articleId]: nouvelleQuantite
        }));

        console.log(`[PANIER] +${quantite} ${article.nom} (Total: ${nouvelleQuantite})`);
    };

    // Retirer un article du panier
    const retirerDuPanier = (articleId, quantite = 1) => {
        setPanier(prev => {
            const nouvelleQuantite = Math.max(0, (prev[articleId] || 0) - quantite);
            if (nouvelleQuantite === 0) {
                const { [articleId]: removed, ...rest } = prev;
                return rest;
            }
            return { ...prev, [articleId]: nouvelleQuantite };
        });
    };

    // Vider le panier
    const viderPanier = () => {
        setPanier({});
        console.log('[PANIER] Panier vidé');
    };

    // Passer une commande
    const passerCommande = async () => {
        if (Object.keys(panier).length === 0) {
            alert('Votre panier est vide');
            return;
        }

        try {
            setLoading(true);
            console.log('[COMMANDES] Création de la commande...');

            // Préparer les données
            const articlesCommande = Object.entries(panier).map(([articleId, quantite]) => {
                const article = articles.find(a => a.id === parseInt(articleId));
                if (!article) throw new Error(`Article ${articleId} non trouvé`);

                return {
                    id_article: `ART-${String(article.id).padStart(3, '0')}`,
                    nom_article: article.nom,
                    quantite: quantite,
                    prix_unitaire: article.prix_unitaire,
                    sous_total: quantite * article.prix_unitaire
                };
            });

            const montantTotal = articlesCommande.reduce((sum, a) => sum + a.sous_total, 0);

            const commandeData = {
                franchise_id: user?.id || 13, // Utiliser l'ID de l'utilisateur de test créé
                articles: articlesCommande,
                montant_total: montantTotal,
                notes: `Commande depuis l'interface franchise`
            };

            console.log('[COMMANDES] Données de commande:', commandeData);

            // Créer la commande
            const result = await apiCall('/commandes', {
                method: 'POST',
                body: JSON.stringify(commandeData)
            });

            console.log('[COMMANDES] Commande créée:', result.commande);

            // Stocker la commande pour le paiement
            setCommandeEnCours(result.commande);

            // Fermer la modal de commande et ouvrir celle de paiement
            setShowCommandeModal(false);
            setShowPaymentModal(true);

        } catch (error) {
            console.error("Erreur lors de la commande:", error);
            alert(`Erreur lors de la création de la commande: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Procéder au paiement
    const procederAuPaiement = async () => {
        if (!commandeEnCours) {
            alert('Aucune commande en cours');
            return;
        }

        await initierPaiementStripe(commandeEnCours);
    };

    // Fonctions utilitaires pour l'affichage
    const getStatutColor = (statut) => {
        switch (statut) {
            case "en_attente": return { backgroundColor: "#FFA9A3", color: "#7E6C6C" };
            case "confirmee": return { backgroundColor: "#B9E6FF", color: "#5C95FF" };
            case "payee": return { backgroundColor: "#90EE90", color: "#228B22" };
            case "en_preparation": return { backgroundColor: "#FFA9A3", color: "#7E6C6C" };
            case "livree": return { backgroundColor: "#B9E6FF", color: "#5C95FF" };
            case "annulee": return { backgroundColor: "#F87575", color: "white" };
            default: return { backgroundColor: "#FFA9A3", color: "#7E6C6C" };
        }
    };

    const getStatutIcon = (statut) => {
        switch (statut) {
            case "en_attente": return <Timer className="w-4 h-4" />;
            case "confirmee": return <CheckCircle className="w-4 h-4" />;
            case "payee": return <CreditCard className="w-4 h-4" />;
            case "en_preparation": return <RefreshCw className="w-4 h-4" />;
            case "livree": return <CheckCircle className="w-4 h-4" />;
            case "annulee": return <AlertCircle className="w-4 h-4" />;
            default: return <Timer className="w-4 h-4" />;
        }
    };

    // Calculer le total du panier
    const totalPanier = Object.entries(panier).reduce((total, [articleId, quantite]) => {
        const article = articles.find(a => a.id === parseInt(articleId));
        return total + (article ? article.prix_unitaire * quantite : 0);
    }, 0);

    // Actualiser les données
    const actualiserDonnees = async () => {
        console.log('[COMMANDES] Actualisation...');
        await loadData();
    };

    // Charger les données au montage
    useEffect(() => {
        console.log('[COMMANDES] Initialisation du composant');
        loadData();
    }, []);

    // Vérifier le statut de paiement au retour de Stripe
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const commandeId = urlParams.get('commande_id');

        if (paymentSuccess === 'true' && commandeId) {
            console.log('[PAYMENT] Paiement réussi pour la commande:', commandeId);

            // Afficher un message de succès
            alert(`Paiement réussi ! Votre commande ${commandeId} a été confirmée. Un bon de commande vous a été envoyé par email.`);

            // Vider le panier
            viderPanier();

            // Recharger les données
            loadData();

            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Affichage du loading
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
                        <p className="text-gray-600">Chargement des données...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <FranchiseHeader />

            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: "#7E6C6C" }}>
                                <Package className="w-8 h-8 mr-3 inline" style={{ color: "#5C95FF" }} />
                                Mes Commandes
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Gérez vos approvisionnements et consultez vos commandes
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={actualiserDonnees}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>

                            {franchiseActive && (
                                <button
                                    onClick={() => setShowCommandeModal(true)}
                                    className="px-6 py-3 rounded-lg font-semibold text-white flex items-center hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: "#5C95FF" }}
                                    disabled={Object.keys(panier).length === 0}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Panier ({Object.keys(panier).length})
                                    {totalPanier > 0 && (
                                        <span className="ml-2 px-2 py-1 bg-white text-blue-600 rounded text-sm">
                                            {totalPanier.toFixed(2)}€
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>



                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Articles disponibles */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-6" style={{ color: "#7E6C6C" }}>
                            Articles disponibles ({articles.length})
                        </h2>

                        {articles.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-gray-600 font-medium">Aucun article disponible</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Les articles apparaîtront ici une fois configurés.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead style={{ backgroundColor: "#B9E6FF" }}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#7E6C6C" }}>
                                                Article
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#7E6C6C" }}>
                                                Prix unitaire
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#7E6C6C" }}>
                                                Stock central
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#7E6C6C" }}>
                                                Quantité
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#7E6C6C" }}>
                                                Actions
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {articles.map((article) => (
                                            <tr key={article.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{article.nom}</div>
                                                        <div className="text-sm text-gray-500">{article.description}</div>
                                                        <div className="text-xs text-gray-400 mt-1">{article.categorie}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold" style={{ color: "#5C95FF" }}>
                                                        {article.prix_unitaire.toFixed(2)}€
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{article.stock_central}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {franchiseActive ? (
                                                        <div className="flex items-center border rounded-lg w-28">
                                                            <button
                                                                onClick={() => retirerDuPanier(article.id)}
                                                                className="p-1 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                                                                disabled={!panier[article.id]}
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </button>
                                                            <span className="px-2 py-1 border-x flex-1 text-center text-sm">
                                                                {panier[article.id] || 0}
                                                            </span>
                                                            <button
                                                                onClick={() => ajouterAuPanier(article.id)}
                                                                className="p-1 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                                                                disabled={article.stock_central === 0}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Non disponible</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {franchiseActive ? (
                                                        <button
                                                            onClick={() => ajouterAuPanier(article.id, 5)}
                                                            className="px-3 py-1 rounded text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:bg-gray-300"
                                                            style={{ backgroundColor: "#5C95FF" }}
                                                            disabled={article.stock_central < 5}
                                                        >
                                                            +5 rapide
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Historique des commandes */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6" style={{ color: "#7E6C6C" }}>
                            Historique ({commandes.length})
                        </h2>

                        <div className="space-y-4">
                            {commandes.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                                    <Timer className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-gray-600 font-medium">Aucune commande</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Vos commandes apparaîtront ici.
                                    </p>
                                </div>
                            ) : (
                                commandes.map((commande) => {
                                    const statutStyle = getStatutColor(commande.statut);
                                    return (
                                        <div key={commande.id} className="bg-white rounded-lg shadow-sm border p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium text-gray-900">Commande {commande.id}</span>
                                                <div
                                                    className="flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                    style={statutStyle}
                                                >
                                                    {getStatutIcon(commande.statut)}
                                                    <span className="ml-1 capitalize">{commande.statut.replace('_', ' ')}</span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-2">
                                                {new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>

                                            <div className="space-y-1 mb-3">
                                                {commande.articles.map((article, index) => (
                                                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                                                        <span>{article.quantite}x {article.nom}</span>
                                                        <span>{(article.quantite * article.prix_unitaire).toFixed(2)}€</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <span className="font-bold text-lg" style={{ color: "#5C95FF" }}>
                                                    {commande.total.toFixed(2)}€
                                                </span>
                                                <div className="flex gap-2">
                                                    {commande.bon_commande_url && (
                                                        <button
                                                            onClick={() => telechargerBonCommande(commande.id)}
                                                            className="text-sm font-medium flex items-center hover:opacity-80 transition-opacity"
                                                            style={{ color: "#5C95FF" }}
                                                            title="Télécharger le bon de commande"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-sm font-medium flex items-center hover:opacity-80 transition-opacity"
                                                        style={{ color: "#5C95FF" }}
                                                        title="Voir les détails"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmation de commande */}
            {showCommandeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold" style={{ color: "#7E6C6C" }}>
                                    Confirmer la commande
                                </h3>
                                <button
                                    onClick={() => setShowCommandeModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                {Object.entries(panier).map(([articleId, quantite]) => {
                                    const article = articles.find(a => a.id === parseInt(articleId));
                                    if (!article) return null;

                                    return (
                                        <div key={articleId} className="flex justify-between items-center py-2 border-b">
                                            <div className="flex-1">
                                                <span className="font-medium">{article.nom}</span>
                                                <div className="text-sm text-gray-500">
                                                    {article.prix_unitaire.toFixed(2)}€ x {quantite}
                                                </div>
                                            </div>
                                            <span className="font-medium text-blue-600">
                                                {(article.prix_unitaire * quantite).toFixed(2)}€
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t pt-4 mb-6">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span style={{ color: "#5C95FF" }}>{totalPanier.toFixed(2)}€</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {Object.keys(panier).length} article{Object.keys(panier).length > 1 ? 's' : ''} • {Object.values(panier).reduce((a, b) => a + b, 0)} unité{Object.values(panier).reduce((a, b) => a + b, 0) > 1 ? 's' : ''}
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                <h4 className="font-medium text-blue-900 mb-2">Information importante</h4>
                                <p className="text-sm text-blue-800">
                                    Après confirmation, vous serez redirigé vers notre page de paiement sécurisée Stripe.
                                    Le stock sera mis à jour et un bon de commande vous sera envoyé par email.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCommandeModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={passerCommande}
                                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: "#5C95FF" }}
                                    disabled={loading}
                                >
                                    {loading ? 'Traitement...' : 'Confirmer et payer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de paiement */}
            {showPaymentModal && commandeEnCours && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold" style={{ color: "#7E6C6C" }}>
                                    Paiement de la commande
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setCommandeEnCours(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                    <h4 className="font-medium text-green-900">Commande créée avec succès !</h4>
                                </div>
                                <p className="text-sm text-green-800">
                                    Numéro de commande : <strong>{commandeEnCours.id}</strong>
                                </p>
                                <p className="text-sm text-green-800 mt-1">
                                    Montant total : <strong>{commandeEnCours.montant_total.toFixed(2)}€</strong>
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center mb-2">
                                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                                    <h4 className="font-medium text-blue-900">Paiement sécurisé</h4>
                                </div>
                                <p className="text-sm text-blue-800">
                                    Vous allez être redirigé vers notre page de paiement sécurisée Stripe.
                                </p>
                                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                                    <li>• Paiement par carte bancaire</li>
                                    <li>• Transaction 100% sécurisée</li>
                                    <li>• Bon de commande envoyé par email</li>
                                    <li>• Notification envoyée à l'administrateur</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setCommandeEnCours(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={procederAuPaiement}
                                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                                    style={{ backgroundColor: "#5C95FF" }}
                                    disabled={processingPayment}
                                >
                                    {processingPayment ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Redirection...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Procéder au paiement
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MesCommandes;