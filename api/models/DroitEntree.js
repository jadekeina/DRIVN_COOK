const db = require("../config/db");

const DroitEntree = {
    /**
     * Récupérer tous les franchisés avec leurs informations de droits d'entrée
     */
    getAll: (callback) => {
        const query = `
            SELECT 
                u.id as franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.phone,
                u.zone_attribution,
                u.date_franchise,
                u.droit_entree_paye,
                
                -- Calcul des jours depuis la création
                DATEDIFF(CURRENT_DATE(), u.date_franchise) as jours_depuis_creation,
                
                -- Statut calculé
                CASE 
                    WHEN u.droit_entree_paye = TRUE THEN 'paye_complet'
                    WHEN DATEDIFF(CURRENT_DATE(), u.date_franchise) <= 30 THEN 'en_cours'
                    WHEN DATEDIFF(CURRENT_DATE(), u.date_franchise) > 30 AND DATEDIFF(CURRENT_DATE(), u.date_franchise) <= 150 THEN 'echeances_en_cours'
                    ELSE 'en_retard'
                END as statut_paiement
                
            FROM users u
            WHERE u.role = 'franchise_owner'
            ORDER BY u.date_franchise DESC
        `;

        db.query(query, callback);
    },

    /**
     * Récupérer un franchisé par son ID
     */
    findById: (franchiseeId, callback) => {
        const query = `
            SELECT 
                id, 
                first_name, 
                last_name, 
                email,
                phone,
                zone_attribution,
                date_franchise,
                droit_entree_paye
            FROM users 
            WHERE id = ? AND role = 'franchise_owner'
        `;

        db.query(query, [franchiseeId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    /**
     * Mettre à jour le statut de paiement du droit d'entrée initial
     */
    updateDroitEntreeInitial: (franchiseeId, paye, callback) => {
        const query = `
            UPDATE users 
            SET droit_entree_paye = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND role = 'franchise_owner'
        `;

        db.query(query, [paye, franchiseeId], callback);
    },

    /**
     * Récupérer les franchisés en retard pour leurs droits d'entrée
     */
    getEnRetard: (callback) => {
        const query = `
            SELECT 
                u.id as franchisee_id,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.phone,
                u.zone_attribution,
                u.date_franchise,
                u.droit_entree_paye,
                
                -- Calcul du retard
                CASE 
                    WHEN u.droit_entree_paye = FALSE AND DATEDIFF(CURRENT_DATE(), u.date_franchise) > 30 THEN 
                        DATEDIFF(CURRENT_DATE(), u.date_franchise) - 30
                    ELSE 0
                END as jours_retard_initial,
                
                DATEDIFF(CURRENT_DATE(), u.date_franchise) as jours_depuis_creation
                
            FROM users u
            WHERE u.role = 'franchise_owner'
            AND (
                (u.droit_entree_paye = FALSE AND DATEDIFF(CURRENT_DATE(), u.date_franchise) > 30)
                OR DATEDIFF(CURRENT_DATE(), u.date_franchise) > 150
            )
            ORDER BY jours_depuis_creation DESC
        `;

        db.query(query, callback);
    },

    /**
     * Récupérer les statistiques globales des droits d'entrée
     */
    getStats: (callback) => {
        const query = `
            SELECT 
                COUNT(*) as total_franchises,
                SUM(CASE WHEN droit_entree_paye = TRUE THEN 1 ELSE 0 END) as franchises_payes,
                SUM(CASE WHEN droit_entree_paye = FALSE AND DATEDIFF(CURRENT_DATE(), date_franchise) > 30 THEN 1 ELSE 0 END) as franchises_en_retard
            FROM users 
            WHERE role = 'franchise_owner'
        `;

        db.query(query, (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    /**
     * Insérer un paiement d'échéance (simulation pour le moment)
     */
    insertPaiementEcheance: (paiementData, callback) => {
        // TODO: Implémenter quand la table paiements_droits_entree sera créée
        // Pour le moment, on simule un succès
        const simulatedResult = {
            insertId: Date.now(),
            affectedRows: 1
        };

        // Appel asynchrone simulé
        setTimeout(() => {
            callback(null, simulatedResult);
        }, 10);
    },

    /**
     * Récupérer l'historique des paiements d'un franchisé
     */
    getHistoriquePaiements: (franchiseeId, callback) => {
        // TODO: Implémenter quand la table paiements_droits_entree sera créée
        // Pour le moment, on retourne un tableau vide
        setTimeout(() => {
            callback(null, []);
        }, 10);
    }
};

module.exports = DroitEntree;