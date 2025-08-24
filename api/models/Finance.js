const db = require("../config/db");

const Finance = {
    /**
     * Récupérer toutes les données financières des franchisés (vue d'ensemble)
     */
    getAllFranchisesFinance: (callback) => {
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution,
                u.phone,
                u.date_franchise as date_creation,
                u.droit_entree_paye,
                u.pourcentage_ca,
                
                -- Calcul du CA total depuis les ventes
                COALESCE(SUM(v.chiffre_affaires), 0) as ca_total,
                
                -- Calcul des redevances dues (CA * pourcentage)
                COALESCE(SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100), 0) as redevances_dues,
                
                -- Nombre de commandes ce mois-ci
                COUNT(DISTINCT CASE 
                    WHEN MONTH(c.date_commande) = MONTH(CURRENT_DATE()) 
                    AND YEAR(c.date_commande) = YEAR(CURRENT_DATE()) 
                    THEN c.id 
                END) as commandes_mois,
                
                -- Statut global calculé
                CASE 
                    WHEN u.droit_entree_paye = FALSE THEN 'en_attente'
                    WHEN COALESCE(SUM(v.chiffre_affaires), 0) = 0 THEN 'en_attente'
                    WHEN DATE_ADD(MAX(v.date_vente), INTERVAL 30 DAY) < CURRENT_DATE() THEN 'en_retard'
                    ELSE 'a_jour'
                END as statut_global
                
            FROM users u
            LEFT JOIN ventes v ON u.id = v.franchisee_id
            LEFT JOIN commandes c ON u.id = c.franchisee_id
            WHERE u.role = 'franchise_owner'
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.zone_attribution, 
                     u.phone, u.date_franchise, u.droit_entree_paye, u.pourcentage_ca
            ORDER BY u.date_franchise DESC
        `;

        db.query(query, callback);
    },

    /**
     * Récupérer les détails financiers d'un franchisé spécifique
     */
    getFranchiseDetail: (franchiseId, callback) => {
        // Informations de base du franchisé
        const franchiseQuery = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution,
                u.phone,
                u.date_franchise as date_creation,
                u.droit_entree_paye,
                u.pourcentage_ca
            FROM users u
            WHERE u.id = ? AND u.role = 'franchise_owner'
        `;

        db.query(franchiseQuery, [franchiseId], (err, franchiseResults) => {
            if (err) return callback(err);

            if (franchiseResults.length === 0) {
                return callback(null, null); // Franchisé non trouvé
            }

            const franchise = franchiseResults[0];

            // Récupérer les ventes par mois pour calculer les redevances
            const ventesQuery = `
                SELECT 
                    DATE_FORMAT(date_vente, '%Y-%m') as mois,
                    SUM(chiffre_affaires) as ca_declare,
                    SUM(chiffre_affaires) * (? / 100) as redevance_calculee,
                    'paye' as statut,
                    MIN(date_vente) as date_declaration
                FROM ventes
                WHERE franchisee_id = ?
                GROUP BY DATE_FORMAT(date_vente, '%Y-%m')
                ORDER BY mois DESC
                LIMIT 12
            `;

            db.query(ventesQuery, [franchise.pourcentage_ca, franchiseId], (ventesErr, ventesResults) => {
                if (ventesErr) return callback(ventesErr);

                // Récupérer l'historique des commandes
                const commandesQuery = `
                    SELECT 
                        c.id,
                        c.date_commande as date,
                        c.total_ttc as montant,
                        c.statut,
                        COUNT(cd.id) as articles_count
                    FROM commandes c
                    LEFT JOIN commandes_detail cd ON c.id = cd.commande_id
                    WHERE c.franchisee_id = ?
                    GROUP BY c.id, c.date_commande, c.total_ttc, c.statut
                    ORDER BY c.date_commande DESC
                    LIMIT 50
                `;

                db.query(commandesQuery, [franchiseId], (cmdErr, commandesResults) => {
                    if (cmdErr) return callback(cmdErr);

                    // Retourner toutes les données combinées
                    callback(null, {
                        franchise: franchise,
                        ventes: ventesResults || [],
                        commandes: commandesResults || []
                    });
                });
            });
        });
    },

    /**
     * Générer un rapport financier pour un franchisé
     */
    generateFinanceReport: (franchiseId, callback) => {
        // Récupérer les informations du franchisé
        const franchiseQuery = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.zone_attribution,
                u.pourcentage_ca,
                u.date_franchise
            FROM users u
            WHERE u.id = ? AND u.role = 'franchise_owner'
        `;

        db.query(franchiseQuery, [franchiseId], (err, franchiseResults) => {
            if (err) return callback(err);

            if (franchiseResults.length === 0) {
                return callback(null, null);
            }

            const franchise = franchiseResults[0];

            // Calculs financiers détaillés
            const ventesQuery = `
                SELECT 
                    SUM(chiffre_affaires) as ca_total,
                    COUNT(*) as nombre_ventes,
                    AVG(chiffre_affaires) as ca_moyen_par_jour,
                    MIN(date_vente) as premiere_vente,
                    MAX(date_vente) as derniere_vente
                FROM ventes
                WHERE franchisee_id = ?
            `;

            db.query(ventesQuery, [franchiseId], (ventesErr, ventesResults) => {
                if (ventesErr) return callback(ventesErr);

                const commandesQuery = `
                    SELECT 
                        SUM(total_ttc) as total_commandes,
                        COUNT(*) as nombre_commandes,
                        AVG(total_ttc) as panier_moyen
                    FROM commandes
                    WHERE franchisee_id = ? AND statut != 'annulee'
                `;

                db.query(commandesQuery, [franchiseId], (cmdErr, commandesResults) => {
                    if (cmdErr) return callback(cmdErr);

                    callback(null, {
                        franchise: franchise,
                        ventes: ventesResults[0] || {},
                        commandes: commandesResults[0] || {}
                    });
                });
            });
        });
    },

    /**
     * Mettre à jour le statut de paiement des droits d'entrée
     */
    updateDroitEntreePaiement: (franchiseId, paye, callback) => {
        const query = `
            UPDATE users 
            SET droit_entree_paye = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND role = 'franchise_owner'
        `;

        db.query(query, [paye, franchiseId], callback);
    },

    /**
     * Récupérer les statistiques globales financières
     */
    getGlobalFinanceStats: (callback) => {
        const query = `
            SELECT 
                -- Nombre total de franchisés
                COUNT(DISTINCT u.id) as total_franchises,
                
                -- Franchisés ayant payé leurs droits d'entrée
                COUNT(DISTINCT CASE WHEN u.droit_entree_paye = TRUE THEN u.id END) as franchises_droits_payes,
                
                -- CA total du réseau
                COALESCE(SUM(v.chiffre_affaires), 0) as ca_total_reseau,
                
                -- Total des redevances dues
                COALESCE(SUM(v.chiffre_affaires * (u.pourcentage_ca / 100)), 0) as redevances_totales,
                
                -- Total des commandes
                COALESCE(SUM(c.total_ttc), 0) as commandes_totales,
                
                -- Nombre de commandes ce mois
                COUNT(DISTINCT CASE 
                    WHEN MONTH(c.date_commande) = MONTH(CURRENT_DATE()) 
                    AND YEAR(c.date_commande) = YEAR(CURRENT_DATE()) 
                    THEN c.id 
                END) as commandes_ce_mois
                
            FROM users u
            LEFT JOIN ventes v ON u.id = v.franchisee_id
            LEFT JOIN commandes c ON u.id = c.franchisee_id
            WHERE u.role = 'franchise_owner'
        `;

        db.query(query, (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    /**
     * Vérifier qu'un franchisé existe
     */
    findById: (franchiseId, callback) => {
        const query = `
            SELECT id, first_name, last_name, email 
            FROM users 
            WHERE id = ? AND role = 'franchise_owner'
        `;

        db.query(query, [franchiseId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    }
};

module.exports = Finance;