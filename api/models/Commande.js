const { pool } = require('../config/db');

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
                COALESCE(quantite_stock, 0) AS stock_actuel
            FROM produits
            WHERE est_actif = 1
            ORDER BY created_at DESC
        `;

        pool.query(query, (err, results) => {
            if (err) return callback(err);

            const produits = results.map(produit => ({
                ...produit,
                seuil_alerte: 15,
                fournisseur: 'Fournisseur Standard',
                statut: produit.est_actif ? 'disponible' : 'indisponible'
            }));

            callback(null, produits);
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

        pool.query(query, [
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
                created_at as date_creation,
                COALESCE(quantite_stock, 0) AS stock_actuel
            FROM produits
            WHERE id = ? AND est_actif = 1
        `;

        pool.query(query, [id], (err, results) => {
            if (err) return callback(err);

            if (results.length > 0) {
                const produit = {
                    ...results[0],
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
     * Récupérer toutes les commandes avec leurs détails
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

        pool.query(query, (err, commandes) => {
            if (err) return callback(err);
            if (commandes.length === 0) return callback(null, []);

            let commandesCompletes = [];
            let processed = 0;

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

                pool.query(detailQuery, [commande.id], (detailErr, articles) => {
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

                    processed++;
                    if (processed === commandes.length) {
                        const resultats = commandesCompletes.filter(c => c);
                        callback(null, resultats);
                    }
                });
            });
        });
    },

    getProduitStock: (produitId, callback) => {
        const q = `SELECT quantite_stock FROM produits WHERE id = ?`;
        pool.query(q, [produitId], (err, rows) => {
            if (err) return callback(err);
            const qty = rows.length ? parseFloat(rows[0].quantite_stock) : 0;
            callback(null, qty);
        });
    },

    decrementProduitStock: (produitId, quantite, reference, callback) => {
        pool.getConnection((connErr, conn) => {
            if (connErr) return callback(connErr);

            conn.beginTransaction(txErr => {
                if (txErr) { conn.release(); return callback(txErr); }

                const selectQ = `SELECT quantite_stock FROM produits WHERE id = ? FOR UPDATE`;
                conn.query(selectQ, [produitId], (selErr, rows) => {
                    if (selErr) return conn.rollback(() => { conn.release(); callback(selErr); });
                    if (!rows.length) return conn.rollback(() => { conn.release(); callback(new Error('Produit introuvable')); });

                    const current = parseFloat(rows[0].quantite_stock);
                    const qte = parseFloat(quantite);
                    if (current < qte) {
                        return conn.rollback(() => { conn.release(); callback(new Error('Stock insuffisant')); });
                    }

                    const updateQ = `UPDATE produits SET quantite_stock = quantite_stock - ? WHERE id = ?`;
                    conn.query(updateQ, [qte, produitId], (updErr) => {
                        if (updErr) return conn.rollback(() => { conn.release(); callback(updErr); });

                        conn.commit(commitErr => {
                            if (commitErr) return conn.rollback(() => { conn.release(); callback(commitErr); });
                            conn.release();
                            callback(null, true);
                        });
                    });
                });
            });
        });
    },

    /**
     * Créer une nouvelle commande avec ses articles
     */
    createCommande: (commandeData, callback) => {
        pool.getConnection((connErr, conn) => {
            if (connErr) return callback(connErr);

            conn.beginTransaction((transactionErr) => {
                if (transactionErr) { conn.release(); return callback(transactionErr); }

                const insertCommandeQuery = `
                    INSERT INTO commandes (
                        franchisee_id,
                        entrepot_id,
                        date_commande,
                        total_ttc,
                        statut,
                        notes
                    ) VALUES (?, 1, CURDATE(), ?, 'en_attente', ?)
                `;

                conn.query(insertCommandeQuery, [
                    commandeData.franchise_id,
                    commandeData.montant_total,
                    commandeData.notes || ''
                ], (cmdErr, cmdResult) => {
                    if (cmdErr) return conn.rollback(() => { conn.release(); callback(cmdErr); });

                    const commandeId = cmdResult.insertId;
                    if (!Array.isArray(commandeData.articles) || commandeData.articles.length === 0) {
                        return conn.rollback(() => { conn.release(); callback(new Error('Aucun article dans la commande')); });
                    }

                    let inserted = 0;
                    let failed = false;

                    for (const article of commandeData.articles) {
                        if (failed) break;

                        const produitId = article.produit_id
                            ? parseInt(article.produit_id, 10)
                            : parseInt(String(article.id_article || '').replace('ART-', ''), 10);

                        if (Number.isNaN(produitId)) {
                            failed = true;
                            return conn.rollback(() => { conn.release(); callback(new Error(`ID article invalide: ${article.id_article || article.produit_id}`)); });
                        }

                        const qte = parseFloat(article.quantite);
                        const pu  = parseFloat(article.prix_unitaire);
                        const total = parseFloat(article.sous_total ?? (qte * pu));

                        const insertDetailQuery = `
                            INSERT INTO commandes_detail (commande_id, produit_id, quantite, prix_unitaire, total)
                            VALUES (?, ?, ?, ?, ?)
                        `;

                        conn.query(insertDetailQuery, [commandeId, produitId, qte, pu, total], (detailErr) => {
                            if (detailErr) {
                                failed = true;
                                return conn.rollback(() => { conn.release(); callback(detailErr); });
                            }
                            inserted++;
                            if (inserted === commandeData.articles.length) {
                                conn.commit((commitErr) => {
                                    if (commitErr) return conn.rollback(() => { conn.release(); callback(commitErr); });
                                    conn.release();

                                    const nouvelleCommande = {
                                        id: `CMD-${String(commandeId).padStart(3, '0')}`,
                                        commande_id_num: commandeId,
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
                    }
                });
            });
        });
    },

    /**
     * Mettre à jour le statut d'une commande
     */
    updateStatutCommande: (commandeId, nouveauStatut, callback) => {
        const statutBdd = Commande.mapStatutToBdd(nouveauStatut);
        const query = `UPDATE commandes SET statut = ?, updated_at = NOW() WHERE id = ?`;

        pool.query(query, [statutBdd, commandeId], (err, result) => {
            if (err) return callback(err);
            if (result.affectedRows === 0) return callback(new Error('Commande non trouvée'));

            callback(null, {
                commandeId,
                nouveauStatut,
                statutBdd,
                affectedRows: result.affectedRows
            });
        });
    },

    /**
     * Récupérer tous les franchisés
     */
    getAllFranchises: (callback) => {
        const query = `
            SELECT id, CONCAT(first_name, ' ', last_name) as nom, email, zone_attribution
            FROM users
            WHERE role = 'franchise_owner' AND is_verified = 1
            ORDER BY last_name, first_name
        `;
        pool.query(query, callback);
    },

    // ===== MÉTHODES UTILITAIRES =====

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
    },

    updateProduit: (id, produitData, callback) => {
        const query = `
            UPDATE produits
            SET nom = ?, description = ?, prix_unitaire = ?,
                unite = ?, categorie = ?, est_obligatoire = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND est_actif = 1
        `;

        pool.query(query, [
            produitData.nom,
            produitData.description || '',
            produitData.prix_unitaire,
            produitData.unite || 'piece',
            produitData.categorie || 'autre',
            produitData.est_obligatoire || false,
            id
        ], (err, result) => {
            if (err) return callback(err);
            if (result.affectedRows === 0) return callback(new Error('Produit non trouvé'));

            Commande.getProduitById(id, callback);
        });
    },

    deleteProduit: (id, callback) => {
        const query = `
            UPDATE produits
            SET est_actif = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND est_actif = 1
        `;

        pool.query(query, [id], (err, result) => {
            if (err) return callback(err);
            if (result.affectedRows === 0) return callback(new Error('Produit non trouvé'));

            callback(null, { id, message: 'Produit désactivé avec succès', affectedRows: result.affectedRows });
        });
    },

    addMouvementStock: (mouvementData, callback) => {
        const nouveauMouvement = {
            id: Date.now(),
            produit_id: mouvementData.article_id,
            type: mouvementData.type,
            quantite: mouvementData.quantite,
            motif: mouvementData.motif,
            date: new Date().toISOString(),
            utilisateur: 'Admin'
        };
        console.log('[STOCK] Simulation ajout mouvement:', nouveauMouvement);
        callback(null, nouveauMouvement);
    },

    getMouvementsStock: (options = {}, callback) => {
        const { limit = 50, offset = 0, produit_id } = options;
        const mouvementsTest = [
            { id: 1, produit_id: 1, article_nom: "Pain de mie complet", type: "entree", quantite: 50, motif: "Livraison fournisseur", date: new Date(Date.now() - 86400000).toISOString(), utilisateur: "Admin" },
            { id: 2, produit_id: 2, article_nom: "Farine T65", type: "sortie", quantite: 20, motif: "Commande Franchise Paris", date: new Date(Date.now() - 172800000).toISOString(), utilisateur: "Admin" },
            { id: 3, produit_id: 1, article_nom: "Pain de mie complet", type: "sortie", quantite: 5, motif: "Vente directe", date: new Date(Date.now() - 259200000).toISOString(), utilisateur: "Caissier" }
        ];

        let mouvementsFiltres = mouvementsTest;
        if (produit_id) {
            mouvementsFiltres = mouvementsTest.filter(m => m.produit_id === parseInt(produit_id));
        }

        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const mouvementsPagines = mouvementsFiltres.slice(startIndex, endIndex);

        callback(null, { mouvements: mouvementsPagines, total: mouvementsFiltres.length, page: Math.floor(offset / limit) + 1, pages: Math.ceil(mouvementsFiltres.length / limit) });
    },

    /**
     * Récupérer les commandes d'une franchise spécifique
     */
    getCommandesByFranchise: (franchiseId, callback) => {
        const query = `
            SELECT 
                c.id,
                c.code as code_commande,
                c.date_commande,
                c.statut,
                c.montant_total,
                c.franchise_id,
                c.notes,
                c.bon_commande_url,
                c.created_at,
                c.updated_at,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'id_article', cd.id_article,
                        'nom_article', cd.nom_article,
                        'quantite', cd.quantite,
                        'prix_unitaire', cd.prix_unitaire,
                        'sous_total', cd.sous_total
                    )
                ) as articles_json
            FROM commandes c
            LEFT JOIN commandes_detail cd ON c.id = cd.commande_id
            WHERE c.franchise_id = ?
            GROUP BY c.id
            ORDER BY c.date_commande DESC
        `;

        pool.query(query, [franchiseId], (err, results) => {
            if (err) {
                console.error('[COMMANDE MODEL] Erreur getCommandesByFranchise:', err);
                return callback(err);
            }

            // Formatter les résultats
            const commandes = results.map(commande => {
                let articles = [];
                
                if (commande.articles_json) {
                    try {
                        // Parse les articles JSON
                        const articlesStr = `[${commande.articles_json}]`;
                        articles = JSON.parse(articlesStr);
                    } catch (parseErr) {
                        console.error('[COMMANDE MODEL] Erreur parse articles:', parseErr);
                        articles = [];
                    }
                }

                return {
                    id: commande.id,
                    code_commande: commande.code_commande,
                    date_commande: commande.date_commande,
                    statut: commande.statut,
                    montant_total: parseFloat(commande.montant_total),
                    franchise_id: commande.franchise_id,
                    notes: commande.notes,
                    bon_commande_url: commande.bon_commande_url,
                    articles: articles,
                    created_at: commande.created_at,
                    updated_at: commande.updated_at
                };
            });

            callback(null, commandes);
        });
    }
};

module.exports = Commande;
