const db = require("../config/db");

const Finance = {
    /**
     * Récupérer tous les utilisateurs avec leur statut de paiement
     * Focus sur les nouveaux franchisés qui ont payé les 50k
     */
    getAllFranchisesFinance: async (callback) => {
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution as assigned_zone,
                u.phone,
                u.created_at as date_creation,
                u.payment_status,
                u.contract_signed_at,
                u.deposit_paid_at,
                u.franchise_payment_completed_at,
                u.franchise_payment_method,
                u.assigned_zone,
                
                -- Vérifier si une franchise existe déjà
                f.id as franchise_id,
                f.name as franchise_name,
                f.is_active as franchise_active,
                
                -- Statut calculé basé sur le paiement et l'assignation
                CASE 
                    WHEN u.payment_status = 'franchise_payment_completed' AND f.id IS NOT NULL THEN 'franchise_assignee'
                    WHEN u.payment_status = 'franchise_payment_completed' AND f.id IS NULL THEN 'paiement_complete_non_assigne'
                    WHEN u.payment_status = 'contract_signed' THEN 'contrat_signe_attente_paiement'
                    ELSE 'en_attente'
                END as statut_global
                
            FROM users u
            LEFT JOIN franchises f ON u.id = f.owner_id
            WHERE u.role = 'franchise_owner'
            ORDER BY u.franchise_payment_completed_at DESC, u.created_at DESC
        `;

        try {
            const [results] = await db.execute(query);
            callback(null, results);
        } catch (err) {
            callback(err);
        }
    },

    /**
     * Récupérer les détails d'un franchisé avec ses informations de paiement et franchise
     */
    getFranchiseDetail: async (franchiseId, callback) => {
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                CONCAT(u.first_name, ' ', u.last_name) as franchisee_name,
                u.email,
                u.zone_attribution,
                u.phone,
                u.created_at as date_creation,
                u.payment_status,
                u.contract_signed_at,
                u.deposit_paid_at,
                u.franchise_payment_completed_at,
                u.franchise_payment_method,
                u.assigned_zone,
                
                -- Informations franchise si elle existe
                f.id as franchise_id,
                f.name as franchise_name,
                f.address as franchise_address,
                f.city as franchise_city,
                f.postal_code as franchise_postal_code,
                f.is_active as franchise_active,
                f.created_at as franchise_created_at
                
            FROM users u
            LEFT JOIN franchises f ON u.id = f.owner_id
            WHERE u.id = ? AND u.role = 'franchise_owner'
        `;

        try {
            const [results] = await db.execute(query, [franchiseId]);

            if (results.length === 0) {
                return callback(null, null);
            }

            const userData = results[0];

            // Structure de réponse simplifiée
            const detailResponse = {
                id: userData.id,
                franchisee_name: userData.franchisee_name,
                email: userData.email,
                phone: userData.phone,
                assigned_zone: userData.assigned_zone,
                date_creation: userData.date_creation,

                // Statut de paiement
                paiement: {
                    statut: userData.payment_status,
                    contrat_signe: userData.contract_signed_at,
                    paiement_complete: userData.franchise_payment_completed_at,
                    methode_paiement: userData.franchise_payment_method,
                    montant_paye: userData.payment_status === 'franchise_payment_completed' ? 50000 : 0
                },

                // Informations franchise
                franchise: userData.franchise_id ? {
                    id: userData.franchise_id,
                    nom: userData.franchise_name,
                    adresse: userData.franchise_address,
                    ville: userData.franchise_city,
                    code_postal: userData.franchise_postal_code,
                    active: userData.franchise_active,
                    date_creation: userData.franchise_created_at
                } : null
            };

            callback(null, { franchise: detailResponse });
        } catch (err) {
            callback(err);
        }
    },

    /**
     * Créer une franchise pour un utilisateur qui a payé
     */
    createFranchiseForUser: async (userId, franchiseData, callback) => {
        try {
            // Vérifier que l'utilisateur a bien payé et n'a pas déjà de franchise
            const checkQuery = `
                SELECT u.id, u.payment_status, f.id as franchise_exists
                FROM users u 
                LEFT JOIN franchises f ON u.id = f.owner_id
                WHERE u.id = ? AND u.role = 'franchise_owner'
            `;

            const [userCheck] = await db.execute(checkQuery, [userId]);

            if (userCheck.length === 0) {
                return callback(new Error('Utilisateur non trouvé'));
            }

            if (userCheck[0].payment_status !== 'franchise_payment_completed') {
                return callback(new Error('L\'utilisateur n\'a pas encore payé les droits de franchise'));
            }

            if (userCheck[0].franchise_exists) {
                return callback(new Error('Une franchise existe déjà pour cet utilisateur'));
            }

            // Créer la franchise
            const insertQuery = `
                INSERT INTO franchises (name, email, phone, owner_id, address, city, postal_code, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
            `;

            const [result] = await db.execute(insertQuery, [
                franchiseData.name,
                franchiseData.email,
                franchiseData.phone,
                userId,
                franchiseData.address,
                franchiseData.city,
                franchiseData.postal_code
            ]);

            callback(null, { insertId: result.insertId });
        } catch (err) {
            callback(err);
        }
    },

    /**
     * Mettre à jour les informations d'assignation de zone
     */
    updateZoneAssignment: async (userId, zoneData, callback) => {
        const query = `
            UPDATE users 
            SET assigned_zone = ?, updated_at = NOW()
            WHERE id = ? AND role = 'franchise_owner'
        `;

        try {
            const [result] = await db.execute(query, [zoneData.zone, userId]);
            callback(null, result);
        } catch (err) {
            callback(err);
        }
    },

    /**
     * Statistiques globales simplifiées
     */
    getGlobalFinanceStats: async (callback) => {
        const query = `
            SELECT 
                -- Nombre total de franchisés
                COUNT(DISTINCT u.id) as total_franchises,
                
                -- Franchisés ayant payé leurs droits de franchise (50k)
                COUNT(DISTINCT CASE WHEN u.payment_status = 'franchise_payment_completed' THEN u.id END) as franchises_payes,
                
                -- Franchisés avec franchise assignée
                COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN u.id END) as franchises_assignees,
                
                -- Montant total collecté (50k par franchisé payé)
                COUNT(DISTINCT CASE WHEN u.payment_status = 'franchise_payment_completed' THEN u.id END) * 50000 as montant_total_collecte,
                
                -- Nouveaux paiements ce mois
                COUNT(DISTINCT CASE 
                    WHEN u.payment_status = 'franchise_payment_completed' 
                    AND MONTH(u.franchise_payment_completed_at) = MONTH(CURRENT_DATE())
                    AND YEAR(u.franchise_payment_completed_at) = YEAR(CURRENT_DATE())
                    THEN u.id 
                END) as nouveaux_paiements_ce_mois
                
            FROM users u
            LEFT JOIN franchises f ON u.id = f.owner_id
            WHERE u.role = 'franchise_owner'
        `;

        try {
            const [results] = await db.execute(query);
            callback(null, results[0]);
        } catch (err) {
            callback(err);
        }
    },

    /**
     * Vérifier qu'un utilisateur existe et récupérer ses infos de base
     */
    findById: async (userId, callback) => {
        const query = `
            SELECT id, first_name, last_name, email, payment_status, assigned_zone
            FROM users 
            WHERE id = ? AND role = 'franchise_owner'
        `;

        try {
            const [results] = await db.execute(query, [userId]);
            callback(null, results[0]);
        } catch (err) {
            callback(err);
        }
    }
};

module.exports = Finance;