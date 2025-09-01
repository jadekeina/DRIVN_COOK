// controllers/Commande/commandeController.js
const Commande = require('../../models/Commande');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Construit les line_items Stripe à partir des articles
 */
function buildLineItems(articles = []) {
    return articles.map(a => ({
        price_data: {
            currency: 'eur',
            product_data: { name: a.nom_article || a.id_article || 'Article' },
            unit_amount: Math.round(parseFloat(a.prix_unitaire) * 100),
        },
        quantity: Math.round(parseFloat(a.quantite)),
    }));
}

/**
 * Extrait l'ID numérique de commande à partir de "CMD-xxx" ou d'un nombre
 */
function parseCommandeIdNum(commande_id) {
    if (typeof commande_id === 'number') return commande_id;
    if (typeof commande_id === 'string' && commande_id.startsWith('CMD-')) {
        return parseInt(commande_id.replace('CMD-', ''), 10);
    }
    return parseInt(commande_id, 10);
}

const commandeController = {
    /**
     * GET /api/commandes/list
     * Récupérer toutes les commandes pour la page Suivi Commandes
     */
    getAllCommandes: (req, res) => {
        console.log('[COMMANDES] Récupération de toutes les commandes...');

        Commande.getAllCommandes((err, commandes) => {
            if (err) {
                console.error('[COMMANDES] Erreur récupération:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur lors de la récupération des commandes'
                });
            }

            res.json({
                success: true,
                commandes,
                count: commandes.length,
                message: 'Commandes récupérées avec succès'
            });
        });
    },

    // Récupérer les commandes d'une franchise spécifique
    getMyCommandes: (req, res) => {
        console.log('[COMMANDES] Récupération des commandes de la franchise...');
        
        // Récupérer l'ID de la franchise depuis le token utilisateur
        const franchiseId = req.user?.id;
        
        if (!franchiseId) {
            return res.status(400).json({
                success: false,
                message: 'ID de franchise requis'
            });
        }

        console.log('[COMMANDES] Franchise ID:', franchiseId);

        Commande.getCommandesByFranchise(franchiseId, (err, commandes) => {
            if (err) {
                console.error('[COMMANDES] Erreur récupération commandes franchise:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur lors de la récupération des commandes'
                });
            }

            res.json({
                success: true,
                commandes,
                count: commandes.length,
                message: 'Commandes de la franchise récupérées avec succès'
            });
        });
    },

    /**
     * POST /api/commandes
     * Créer une nouvelle commande
     * NOTE: on force franchise_id depuis le token (req.user.id) pour éviter les FK errors
     */
    createCommande: (req, res) => {
        console.log('[COMMANDES] Création d\'une nouvelle commande:', req.body);

        // 1) Prend l'ID franchisé du token si présent, sinon du body (fallback)
        const franchiseIdFromToken = req?.user?.id;
        const franchiseIdFromBody  = parseInt(req.body.franchise_id, 10);
        const franchiseId = franchiseIdFromToken || franchiseIdFromBody;

        if (!franchiseId) {
            return res.status(400).json({
                success: false,
                message: 'franchise_id introuvable (token ou body)'
            });
        }

        const { articles, notes } = req.body;

        if (!Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Au moins un article est requis pour créer une commande'
            });
        }

        for (let i = 0; i < articles.length; i++) {
            const a = articles[i];
            if (!a.id_article && !a.produit_id) {
                return res.status(400).json({ success: false, message: `Article ${i + 1}: id_article ou produit_id requis` });
            }
            if (a.quantite == null || a.prix_unitaire == null) {
                return res.status(400).json({ success: false, message: `Article ${i + 1}: quantite et prix_unitaire requis` });
            }
            if (parseFloat(a.quantite) <= 0 || parseFloat(a.prix_unitaire) <= 0) {
                return res.status(400).json({ success: false, message: `Article ${i + 1}: quantite et prix_unitaire doivent être > 0` });
            }
        }

        const montant_total = articles.reduce((sum, a) => {
            const st = parseFloat(a.quantite) * parseFloat(a.prix_unitaire);
            a.sous_total = Number.isNaN(st) ? 0 : st;
            return sum + a.sous_total;
        }, 0);

        const commandeData = {
            franchise_id: franchiseId,                       // <-- fallback appliqué
            montant_total: Number(montant_total.toFixed(2)),
            articles,
            notes: (notes || "Commande depuis l'interface franchise").trim()
        };

        Commande.createCommande(commandeData, (err, nouvelleCommande) => {
            if (err) {
                console.error('[COMMANDES] Erreur création commande:', err);

                if (String(err.message || '').includes('ID article invalide')) {
                    return res.status(400).json({ success: false, message: err.message });
                }
                if (String(err.code) === 'ER_NO_REFERENCED_ROW_2' ||
                    String(err.message || '').includes('foreign key constraint')) {
                    return res.status(400).json({
                        success: false,
                        message: 'franchise_id invalide en base. Utilise un ID utilisateur existant.'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création de la commande'
                });
            }

            console.log(`[COMMANDES] Commande créée avec succès: ${nouvelleCommande.id}`);
            res.status(201).json({
                success: true,
                commande: nouvelleCommande,
                message: `Commande créée avec succès avec l'ID: ${nouvelleCommande.id}`
            });
        });
    },


createPaymentSession: async (req, res) => {
        try {
            // 1) Pré-requis Stripe
            if (!process.env.STRIPE_SECRET_KEY) {
                return res.status(500).json({ success: false, message: 'STRIPE_SECRET_KEY manquante' });
            }

            // 2) Récupération des données requises
            const { commande_id, montant_total, franchise_email, articles } = req.body;

            if (!commande_id || !montant_total || !Array.isArray(articles) || articles.length === 0) {
                return res.status(400).json({ success: false, message: 'Données paiement incomplètes' });
            }

            // 3) ID commande numérique tolérant "CMD-xxx" ou nombre pur
            const idNum = (() => {
                if (typeof commande_id === 'number') return commande_id;
                if (typeof commande_id === 'string' && commande_id.startsWith('CMD-')) {
                    return parseInt(commande_id.replace('CMD-', ''), 10);
                }
                return parseInt(commande_id, 10);
            })();

            if (Number.isNaN(idNum)) {
                return res.status(400).json({ success: false, message: 'commande_id invalide' });
            }

            // 4) ID franchisé: token si dispo, sinon body en fallback (pour tes tests)
            const franchiseIdFromToken = req?.user?.id;
            const franchiseIdFromBody  = parseInt(req.body.franchise_id, 10);
            const franchiseIdForPayment = franchiseIdFromToken || franchiseIdFromBody || 0;

            // 5) Construction des line_items Stripe
            const line_items = articles.map(a => ({
                price_data: {
                    currency: 'eur',
                    product_data: { name: a.nom_article || a.id_article || 'Article' },
                    unit_amount: Math.round(Number(a.prix_unitaire) * 100),
                },
                quantity: Math.round(Number(a.quantite)),
            }));

            // 6) URLs de retour (aligne avec ta page front réelle)
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const successUrl = `${baseUrl}/mes-commandes?payment_success=true&commande_id=${encodeURIComponent(commande_id)}`;
            const cancelUrl  = `${baseUrl}/mes-commandes?payment_success=false&commande_id=${encodeURIComponent(commande_id)}`;

            // 7) Création de la session Stripe (email optionnel)
            const params = {
                mode: 'payment',
                payment_method_types: ['card'],
                line_items,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    type: 'commande',
                    commande_id_num: String(idNum),
                    commande_id_pretty: String(commande_id),
                    franchise_id: String(franchiseIdForPayment),
                },
            };
            if (franchise_email) params.customer_email = franchise_email;

            const session = await stripe.checkout.sessions.create(params);

            return res.json({ success: true, checkout_url: session.url, session_id: session.id });
        } catch (err) {
            console.error('[STRIPE COMMANDE] createPaymentSession error:', err);
            return res.status(500).json({ success: false, message: 'Erreur création session paiement' });
        }
    },
    // Ajoutez cette méthode dans votre commandeController.js :

    /**
     * GET /api/commandes/:id/bon-commande-download
     * Télécharger directement le bon de commande (comme pour les candidatures)
     */
    getBonCommandeDownload: async (req, res) => {
        try {
            const commandeId = req.params.id;
            const franchiseId = req.user?.id;

            console.log(`[BON DOWNLOAD] Téléchargement bon de commande: ${commandeId} pour franchise: ${franchiseId}`);

            if (!franchiseId) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié'
                });
            }

            // Vérifier que la commande appartient à cette franchise
            const Commande = require('../../models/Commande');

            const checkCommande = () => {
                return new Promise((resolve, reject) => {
                    Commande.getCommandesByFranchise(franchiseId, (err, commandes) => {
                        if (err) return reject(err);
                        const commande = commandes.find(c => c.id === commandeId);
                        if (!commande) return reject(new Error('Commande non trouvée ou accès non autorisé'));
                        resolve(commande);
                    });
                });
            };

            const commande = await checkCommande();
            console.log('[BON DOWNLOAD] Commande trouvée:', commande.id);

            // Vérifier si le bon existe déjà
            const bonCommandeService = require('../../services/bonCommandeService');
            let bonInfo = bonCommandeService.getBonCommandePath(commandeId);

            // Si le bon n'existe pas, le générer
            if (!bonInfo) {
                console.log('[BON DOWNLOAD] Bon non trouvé, génération...');

                const generateBon = () => {
                    return new Promise((resolve, reject) => {
                        bonCommandeService.generateBonCommande(commande, (bonErr, bonData) => {
                            if (bonErr) return reject(bonErr);
                            resolve(bonData);
                        });
                    });
                };

                bonInfo = await generateBon();
                console.log('[BON DOWNLOAD] Bon généré:', bonInfo.fileName);
            }

            // Vérifier que le fichier existe physiquement
            const fs = require('fs');
            if (!fs.existsSync(bonInfo.filePath)) {
                console.error('[BON DOWNLOAD] Fichier physique non trouvé:', bonInfo.filePath);
                return res.status(404).json({
                    success: false,
                    message: 'Fichier de bon de commande non trouvé'
                });
            }

            console.log('[BON DOWNLOAD] Envoi du fichier:', bonInfo.filePath);

            // Configurer les headers pour le téléchargement
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${bonInfo.fileName}"`);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            // Envoyer le fichier
            const fileStream = fs.createReadStream(bonInfo.filePath);

            fileStream.on('error', (streamError) => {
                console.error('[BON DOWNLOAD] Erreur lecture fichier:', streamError);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Erreur lors de la lecture du fichier'
                    });
                }
            });

            fileStream.on('end', () => {
                console.log('[BON DOWNLOAD] Téléchargement terminé avec succès');
            });

            // Pipe le fichier vers la réponse
            fileStream.pipe(res);

        } catch (error) {
            console.error('[BON DOWNLOAD] Erreur:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du téléchargement du bon de commande',
                error: error.message
            });
        }
    },


    /**
     * PUT /api/commandes/:id/statut
     * Mettre à jour le statut d'une commande
     */
    updateStatutCommande: (req, res) => {
        const { statut } = req.body;
        const commandeId = req.params.id;

        console.log(`[COMMANDES] Mise à jour statut commande ${commandeId}: ${statut}`);

        const statutsValides = ['en_attente', 'confirmee', 'preparee', 'en_livraison', 'livree', 'annulee'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Statuts valides: ' + statutsValides.join(', ')
            });
        }

        const id = parseCommandeIdNum(commandeId);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID commande invalide' });
        }

        Commande.updateStatutCommande(id, statut, (err, result) => {
            if (err) {
                console.error('[COMMANDES] Erreur mise à jour statut:', err);

                if (err.message === 'Commande non trouvée') {
                    return res.status(404).json({ success: false, message: 'Commande non trouvée' });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du statut',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] Statut mis à jour avec succès: ${commandeId} -> ${statut}`);

            res.json({
                success: true,
                message: `Statut de la commande ${commandeId} mis à jour: ${statut}`,
                data: {
                    commande_id: commandeId,
                    nouveau_statut: statut,
                    statut_bdd: result.statutBdd
                }
            });
        });
    },

    /**
     * GET /api/commandes/franchises
     * Récupérer la liste des franchises pour les formulaires
     */
    getFranchises: (req, res) => {
        console.log('[COMMANDES] Récupération de la liste des franchises...');

        Commande.getAllFranchises((err, franchises) => {
            if (err) {
                console.error('[COMMANDES] Erreur récupération franchises:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des franchises',
                    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
                });
            }

            console.log(`[COMMANDES] ${franchises.length} franchises récupérées`);

            res.json({
                success: true,
                franchises,
                count: franchises.length,
                message: 'Franchises récupérées avec succès'
            });
        });
    }
};

module.exports = commandeController;
