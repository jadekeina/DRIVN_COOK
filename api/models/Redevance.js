const db = require("../config/db");

const Redevance = {
    /**
     * Récupérer toutes les redevances calculées pour tous les franchisés
     */
    getAll: (callback) => {
        const query = `
            SELECT 
                u.id as franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution,
                u.pourcentage_ca,
                
                -- Redevances par mois
                DATE_FORMAT(v.date_vente, '%Y-%m') as mois,
                SUM(v.chiffre_affaires) as ca_mensuel,
                SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100) as redevance_due,
                
                -- Statut de paiement (simulé pour le moment)
                CASE 
                    WHEN DATE_FORMAT(v.date_vente, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') THEN 'en_attente'
                    WHEN DATE_FORMAT(v.date_vente, '%Y-%m') < DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m') THEN 'paye'
                    ELSE 'en_attente'
                END as statut_paiement
                
            FROM users u
            INNER JOIN ventes v ON u.id = v.franchisee_id
            WHERE u.role = 'franchise_owner'
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.zone_attribution, 
                     u.pourcentage_ca, DATE_FORMAT(v.date_vente, '%Y-%m')
            ORDER BY mois DESC, u.last_name ASC
        `;

        db.query(query, callback);
    },

    /**
     * Récupérer les redevances d'un franchisé pour un mois spécifique
     */
    getByFranchiseeAndMonth: (franchiseeId, mois, callback) => {
        const query = `
            SELECT 
                u.id,
                CONCAT(u.first_name, ' ', u.last_name) as nom,
                SUM(v.chiffre_affaires) as ca_mois,
                SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100) as redevance_due
            FROM users u
            INNER JOIN ventes v ON u.id = v.franchisee_id
            WHERE u.id = ? 
            AND u.role = 'franchise_owner'
            AND DATE_FORMAT(v.date_vente, '%Y-%m') = ?
            GROUP BY u.id, u.first_name, u.last_name, u.pourcentage_ca
        `;

        db.query(query, [franchiseeId, mois], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    /**
     * Récupérer les redevances en retard
     */
    getEnRetard: (callback) => {
        const query = `
            SELECT 
                u.id as franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.phone,
                u.zone_attribution,
                
                DATE_FORMAT(v.date_vente, '%Y-%m') as mois,
                SUM(v.chiffre_affaires) as ca_mensuel,
                SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100) as redevance_due,
                
                -- Calcul du nombre de jours de retard
                DATEDIFF(CURRENT_DATE(), LAST_DAY(STR_TO_DATE(CONCAT(DATE_FORMAT(v.date_vente, '%Y-%m'), '-01'), '%Y-%m-%d'))) as jours_retard
                
            FROM users u
            INNER JOIN ventes v ON u.id = v.franchisee_id
            WHERE u.role = 'franchise_owner'
            AND DATE_FORMAT(v.date_vente, '%Y-%m') < DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.zone_attribution,
                     DATE_FORMAT(v.date_vente, '%Y-%m')
            HAVING jours_retard > 30
            ORDER BY jours_retard DESC, u.last_name ASC
        `;

        db.query(query, callback);
    },

    /**
     * Récupérer les données pour le rapport de redevances
     */
    getReportData: (periode = null, callback) => {
        let whereClause = '';
        let params = [];

        if (periode && periode !== 'all') {
            whereClause = 'AND DATE_FORMAT(v.date_vente, \'%Y-%m\') = ?';
            params.push(periode);
        }

        const query = `
            SELECT 
                -- Données par franchisé
                u.id as franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution,
                u.pourcentage_ca,
                u.date_franchise,
                
                -- Données financières
                DATE_FORMAT(v.date_vente, '%Y-%m') as mois,
                SUM(v.chiffre_affaires) as ca_mensuel,
                SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100) as redevance_due,
                COUNT(v.id) as nombre_ventes,
                AVG(v.chiffre_affaires) as ca_moyen_par_vente,
                
                -- Performance
                RANK() OVER (PARTITION BY DATE_FORMAT(v.date_vente, '%Y-%m') ORDER BY SUM(v.chiffre_affaires) DESC) as rang_ca,
                RANK() OVER (PARTITION BY DATE_FORMAT(v.date_vente, '%Y-%m') ORDER BY SUM(v.chiffre_affaires) * (u.pourcentage_ca / 100) DESC) as rang_redevance
                
            FROM users u
            INNER JOIN ventes v ON u.id = v.franchisee_id
            WHERE u.role = 'franchise_owner' ${whereClause}
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.zone_attribution,
                     u.pourcentage_ca, u.date_franchise, DATE_FORMAT(v.date_vente, '%Y-%m')
            ORDER BY mois DESC, redevance_due DESC
        `;

        db.query(query, params, callback);
    },

    /**
     * Marquer un paiement de redevance (simulation)
     */
    marquerPaiement: (franchiseeId, mois, paiementData, callback) => {
        // TODO: Implémenter une vraie table de paiements
        // Pour le moment, simulation
        const paiement = {
            franchisee_id: franchiseeId,
            mois: mois,
            montant_paye: paiementData.montant_paye,
            date_paiement: paiementData.date_paiement,
            methode_paiement: paiementData.methode_paiement,
            created_at: new Date()
        };

        // Simulation d'un succès
        setTimeout(() => {
            callback(null, { insertId: Date.now(), affectedRows: 1 });
        }, 10);
    }
};

module.exports = Redevance;