const db = require("../config/db");

const Commande = {
    // ===== GESTION DES PRODUITS/ARTICLES =====

    /**
     * Récupérer tous les produits pour la page Gestion Stocks
     */
    getAllProduits: (callback) => {
        const query = `
            SELECT
                id,
                CONCAT('ART-', LPAD(id, 3, '0')) as id_article,
                nom,
                description,
                prix_unitaire,
                unite,
                categorie,
                est_obligatoire,
                est_actif,
                created_at as date_creation,
                CASE
                    WHEN est_actif = 1 THEN 'disponible'
                    ELSE 'indisponible'
                    END as statut
            FROM produits
            WHERE est_actif = 1
            ORDER BY created_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) return callback(err);

            // Ajouter des données simulées pour stock et seuil
            const produitsAvecStock = results.map(produit => ({
                ...produit,
                stock_actuel: Math.floor(Math.random() * 100) + 10,
                seuil_alerte: 15,
                fournisseur: 'Fournisseur Standard',
                date_creation: produit.date_creation
            }));

            callback(null, produitsAvecStock);
        });
    },

    /**
     * Créer un nouveau produit
     */
    createProduit: (produitData, callback) => {
        const query = `
            INSERT INTO produits (
                nom, description, prix_unitaire, unite,
                categorie, est_obligatoire, est_actif
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        db.query(query, [
            produitData.nom,
            produitData.description || '',
            produitData.prix_unitaire,
            produitData.unite || 'piece',
            produitData.categorie || 'autre',
            produitData.est_obligatoire || false
        ], (err, result) => {
            if (err) return callback(err);

            const nouveauProduit = {
                id: result.insertId,
                id_article: `ART-${String(result.insertId).padStart(3, '0')}`,
                ...produitData,
                stock_actuel: produitData.stock_actuel || 0,
                seuil_alerte: produitData.seuil_alerte || 15,
                date_creation: new Date().toISOString().split('T')[0],
                statut: 'disponible'
            };

            callback(null, nouveauProduit);
        });
    },

    /**
     * Récupérer un produit par ID
     */
    getProduitById: (id, callback) => {
        const query = `
            SELECT
                id,
                CONCAT('ART-', LPAD(id, 3, '0')) as id_article,
                nom,
                description,
                prix_unitaire,
                unite,
                categorie,
                est_obligatoire,
                est_actif,
                created_at as date_creation
            FROM produits
            WHERE id = ? AND est_actif = 1
        `;

        db.query(query, [id], (err, results) => {
            if (err) return callback(err);

            if (results.length > 0) {
                const produit = {
                    ...results[0],
                    stock_actuel: Math.floor(Math.random() * 100) + 10,
                    seuil_alerte: 15,
                    fournisseur: 'Fournisseur Standard',
                    statut: 'disponible'
                };
                callback(null, produit);
            } else {
                callback(null, null);
            }
        });
    },

    // ===== GESTION DES COMMANDES =====

    /**
     * Récupérer toutes les commandes avec leurs détails pour la page Suivi Commandes
     */
    getAllCommandes: (callback) => {
        const query = `
            SELECT
                c.id,
                CONCAT('CMD-', LPAD(c.id, 3, '0')) as commande_id,
                c.franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchise_nom,
                u.zone_attribution as franchise_zone,
                c.date_commande,
                c.statut,
                c.total_ttc as montant_total,
                c.notes,
                c.created_at
            FROM commandes c
                     INNER JOIN users u ON c.franchisee_id = u.id
            WHERE u.role = 'franchise_owner'
            ORDER BY c.created_at DESC
        `;

        db.query(query, (err, commandes) => {
            if (err) return callback(err);

            if (commandes.length === 0) {
                return callback(null, []);
            }

            // Pour chaque commande, récupérer ses articles
            let commandesCompletes = [];
            let commandesProcessed = 0;

            commandes.forEach((commande, index) => {
                const detailQuery = `
                    SELECT
                        cd.produit_id,
                        CONCAT('ART-', LPAD(cd.produit_id, 3, '0')) as id_article,
                        p.nom as nom_article,
                        cd.quantite,
                        cd.prix_unitaire,
                        cd.total as sous_total
                    FROM commandes_detail cd
                             INNER JOIN produits p ON cd.produit_id = p.id
                    WHERE cd.commande_id = ?
                    ORDER BY cd.id
                `;

                db.query(detailQuery, [commande.id], (detailErr, articles) => {
                    if (detailErr) return callback(detailErr);

                    commandesCompletes[index] = {
                        id: commande.commande_id,
                        franchise_id: commande.franchisee_id,
                        franchise_nom: commande.franchise_nom,
                        franchise_zone: commande.franchise_zone || 'Non définie',
                        date_commande: commande.date_commande || commande.created_at,
                        statut: Commande.mapStatutToReact(commande.statut),
                        montant_total: parseFloat(commande.montant_total || 0),
                        articles: articles || [],
                        notes: commande.notes
                    };

                    commandesProcessed++;
                    if (commandesProcessed === commandes.length) {
                        const resultats = commandesCompletes.filter(cmd => cmd !== undefined);
                        callback(null, resultats);
                    }
                });
            });
        });
    },

    /**
     * Créer une nouvelle commande avec ses articles
     */
    createCommande: (commandeData, callback) => {
        db.beginTransaction((transactionErr) => {
            if (transactionErr) return callback(transactionErr);

            const insertCommandeQuery = `
                INSERT INTO commandes (
                    franchisee_id,
                    entrepot_id,
                    date_commande,
                    total_ttc,
                    statut,
                    notes
                ) VALUES (?, 1, NOW(), ?, 'en_attente', ?)
            `;

            db.query(insertCommandeQuery, [
                commandeData.franchise_id,
                commandeData.montant_total,
                commandeData.notes || ''
            ], (cmdErr, cmdResult) => {
                if (cmdErr) {
                    return db.rollback(() => callback(cmdErr));
                }

                const commandeId = cmdResult.insertId;

                if (!commandeData.articles || commandeData.articles.length === 0) {
                    return db.rollback(() => callback(new Error('Aucun article dans la commande')));
                }

                let articlesInserted = 0;
                let hasError = false;

                commandeData.articles.forEach(article => {
                    if (hasError) return;

                    const insertDetailQuery = `
                        INSERT INTO commandes_detail (
                            commande_id, produit_id, quantite, prix_unitaire, total
                        ) VALUES (?, ?, ?, ?, ?)
                    `;

                    const produitId = parseInt(article.id_article.replace('ART-', ''));

                    if (isNaN(produitId)) {
                        hasError = true;
                        return db.rollback(() => callback(new Error(`ID article invalide: ${article.id_article}`)));
                    }

                    db.query(insertDetailQuery, [
                        commandeId,
                        produitId,
                        article.quantite,
                        article.prix_unitaire,
                        article.sous_total
                    ], (detailErr) => {
                        if (detailErr) {
                            hasError = true;
                            return db.rollback(() => callback(detailErr));
                        }

                        articlesInserted++;
                        if (articlesInserted === commandeData.articles.length) {
                            db.commit((commitErr) => {
                                if (commitErr) {
                                    return db.rollback(() => callback(commitErr));
                                }

                                const nouvelleCommande = {
                                    id: `CMD-${String(commandeId).padStart(3, '0')}`,
                                    franchise_id: commandeData.franchise_id,
                                    montant_total: commandeData.montant_total,
                                    articles: commandeData.articles,
                                    notes: commandeData.notes,
                                    statut: 'en_attente'
                                };

                                callback(null, nouvelleCommande);
                            });
                        }
                    });
                });
            });
        });
    },

    /**
     * Mettre à jour le statut d'une commande
     */
    updateStatutCommande: (commandeId, nouveauStatut, callback) => {
        const statutBdd = Commande.mapStatutToBdd(nouveauStatut);

        const query = `
            UPDATE commandes
            SET statut = ?, updated_at = NOW()
            WHERE id = ?
        `;

        db.query(query, [statutBdd, commandeId], (err, result) => {
            if (err) return callback(err);

            if (result.affectedRows === 0) {
                return callback(new Error('Commande non trouvée'));
            }

            callback(null, {
                commandeId,
                nouveauStatut,
                statutBdd,
                affectedRows: result.affectedRows
            });
        });
    },

    /**
     * Récupérer tous les franchisés pour les listes déroulantes
     */
    getAllFranchises: (callback) => {
        const query = `
            SELECT
                id,
                CONCAT(first_name, ' ', last_name) as nom,
                email,
                zone_attribution
            FROM users
            WHERE role = 'franchise_owner'
              AND is_verified = 1
            ORDER BY last_name, first_name
        `;

        db.query(query, callback);
    },

    // ===== MÉTHODES UTILITAIRES =====

    /**
     * Mapper les statuts de la BDD vers ceux attendus par React
     */
    mapStatutToReact: (statutBdd) => {
        const mapping = {
            'en_attente': 'en_attente',
            'validee': 'confirmee',
            'preparee': 'preparee',
            'livree': 'livree',
            'annulee': 'annulee'
        };
        return mapping[statutBdd] || 'en_attente';
    },

    /**
     * Mapper les statuts React vers ceux de la BDD
     */
    mapStatutToBdd: (statutReact) => {
        const mapping = {
            'en_attente': 'en_attente',
            'confirmee': 'validee',
            'preparee': 'preparee',
            'en_livraison': 'preparee',
            'livree': 'livree',
            'annulee': 'annulee'
        };
        return mapping[statutReact] || 'en_attente';
    }
};

module.exports = Commande;