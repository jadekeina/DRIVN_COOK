const db = require('../config/db');

const Contract = {
    // Récupérer une candidature par token
    getCandidatureByToken: (token, callback) => {
        const query = `
            SELECT ua.*, fc.*
            FROM user_activations ua
                     JOIN franchise_candidatures fc ON ua.candidature_id = fc.id
            WHERE ua.token = ? AND ua.expires_at > NOW() AND ua.used = FALSE
        `;
        db.query(query, [token], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    // Vérifier si un utilisateur existe déjà
    checkUserExists: (email, callback) => {
        const query = 'SELECT id FROM users WHERE email = ?';
        db.query(query, [email], (err, results) => {
            if (err) return callback(err);
            callback(null, results.length > 0);
        });
    },

    // NOUVELLE MÉTHODE : Récupérer la franchise souhaitée d'une candidature
    getFranchiseSouhaitee: (candidatureId, callback) => {
        const query = `
            SELECT f.id, f.name, f.city, f.owner_id
            FROM franchise_candidatures fc
                     LEFT JOIN franchises f ON fc.franchise_souhaitee_id = f.id
            WHERE fc.id = ?
        `;
        db.query(query, [candidatureId], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    // NOUVELLE MÉTHODE : Trouver une franchise disponible dans une ville
    findAvailableFranchiseInCity: (city, callback) => {
        const query = `
            SELECT id, name, city
            FROM franchises
            WHERE city = ? AND owner_id IS NULL AND is_active = TRUE
            ORDER BY created_at ASC
                LIMIT 1
        `;
        db.query(query, [city], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0] || null);
        });
    },

    // MÉTHODE CORRIGÉE : Créer un utilisateur franchise avec attribution automatique
    createFranchiseUser: (userData, callback) => {
        // Utiliser pool.getConnection pour obtenir une connexion du pool
        db.pool.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.error('Erreur récupération connexion:', connectionErr);
                return callback(connectionErr);
            }

            // Démarrer une transaction sur cette connexion spécifique
            connection.beginTransaction((transactionErr) => {
                if (transactionErr) {
                    console.error('Erreur transaction:', transactionErr);
                    connection.release();
                    return callback(transactionErr);
                }

                // Créer l'utilisateur
                const userQuery = `
                    INSERT INTO users (
                        email, password, first_name, last_name, phone, 
                        role, is_verified, date_franchise, droit_entree_paye,
                        pourcentage_ca, assigned_zone
                    ) VALUES (?, ?, ?, ?, ?, 'franchise_owner', TRUE, CURDATE(), TRUE, 4.00, ?)
                `;

                connection.query(userQuery, [
                    userData.email,
                    userData.password,
                    userData.first_name,
                    userData.last_name,
                    userData.phone,
                    userData.assigned_zone
                ], (userErr, userResult) => {
                    if (userErr) {
                        console.error('Erreur création utilisateur:', userErr);
                        return connection.rollback(() => {
                            connection.release();
                            callback(userErr);
                        });
                    }

                    const userId = userResult.insertId;

                    // Récupérer les informations de candidature pour trouver la franchise souhaitée
                    const candidatureQuery = `
                        SELECT fc.franchise_souhaitee_id, fc.ville, f.city as franchise_city
                        FROM user_activations ua
                        JOIN franchise_candidatures fc ON ua.candidature_id = fc.id
                        LEFT JOIN franchises f ON fc.franchise_souhaitee_id = f.id
                        WHERE ua.email = ?
                        ORDER BY ua.created_at DESC
                        LIMIT 1
                    `;

                    connection.query(candidatureQuery, [userData.email], (candidatureErr, candidatureResult) => {
                        if (candidatureErr) {
                            console.error('Erreur récupération candidature:', candidatureErr);
                            return connection.rollback(() => {
                                connection.release();
                                callback(candidatureErr);
                            });
                        }

                        let franchiseToAssign = null;

                        if (candidatureResult && candidatureResult.length > 0) {
                            const candidature = candidatureResult[0];

                            // Si une franchise spécifique était souhaitée, essayer de l'attribuer
                            if (candidature.franchise_souhaitee_id) {
                                franchiseToAssign = candidature.franchise_souhaitee_id;
                            } else {
                                // Sinon, chercher une franchise disponible dans la ville souhaitée
                                const cityToSearch = candidature.ville;

                                const availableQuery = `
                                    SELECT id FROM franchises 
                                    WHERE city LIKE ? AND owner_id IS NULL AND is_active = TRUE
                                    ORDER BY created_at ASC
                                    LIMIT 1
                                `;

                                connection.query(availableQuery, [`%${cityToSearch}%`], (availableErr, availableResult) => {
                                    if (!availableErr && availableResult && availableResult.length > 0) {
                                        franchiseToAssign = availableResult[0].id;
                                    }

                                    // Continuer avec l'attribution (ou sans si aucune franchise trouvée)
                                    assignFranchiseToUser(franchiseToAssign);
                                });
                                return; // Sortir pour éviter d'exécuter assignFranchiseToUser deux fois
                            }
                        }

                        // Fonction interne pour attribuer la franchise
                        function assignFranchiseToUser(franchiseId) {
                            if (franchiseId) {
                                // Attribuer la franchise
                                const assignQuery = `
                                    UPDATE franchises 
                                    SET owner_id = ?, date_attribution = NOW() 
                                    WHERE id = ? AND owner_id IS NULL
                                `;

                                connection.query(assignQuery, [userId, franchiseId], (assignErr, assignResult) => {
                                    if (assignErr) {
                                        console.error('Erreur attribution franchise:', assignErr);
                                        return connection.rollback(() => {
                                            connection.release();
                                            callback(assignErr);
                                        });
                                    }

                                    // Vérifier que l'attribution a réussi
                                    if (assignResult.affectedRows === 0) {
                                        console.warn('Franchise déjà attribuée, utilisateur créé sans franchise');
                                    }

                                    // Commit de la transaction
                                    connection.commit((commitErr) => {
                                        if (commitErr) {
                                            console.error('Erreur commit:', commitErr);
                                            return connection.rollback(() => {
                                                connection.release();
                                                callback(commitErr);
                                            });
                                        }

                                        // Récupérer les infos de la franchise attribuée
                                        if (assignResult.affectedRows > 0) {
                                            const franchiseInfoQuery = `
                                                SELECT name, city FROM franchises WHERE id = ?
                                            `;

                                            connection.query(franchiseInfoQuery, [franchiseId], (infoErr, infoResult) => {
                                                connection.release(); // Libérer la connexion
                                                callback(null, {
                                                    insertId: userId,
                                                    franchiseAttribuee: infoResult && infoResult[0] ? infoResult[0] : null,
                                                    message: infoResult && infoResult[0]
                                                        ? `Franchise ${infoResult[0].name} à ${infoResult[0].city} attribuée avec succès`
                                                        : 'Utilisateur créé avec succès'
                                                });
                                            });
                                        } else {
                                            connection.release(); // Libérer la connexion
                                            callback(null, {
                                                insertId: userId,
                                                franchiseAttribuee: null,
                                                message: 'Utilisateur créé avec succès, aucune franchise disponible'
                                            });
                                        }
                                    });
                                });
                            } else {
                                // Pas de franchise à attribuer, juste créer l'utilisateur
                                connection.commit((commitErr) => {
                                    if (commitErr) {
                                        console.error('Erreur commit:', commitErr);
                                        return connection.rollback(() => {
                                            connection.release();
                                            callback(commitErr);
                                        });
                                    }

                                    connection.release(); // Libérer la connexion
                                    callback(null, {
                                        insertId: userId,
                                        franchiseAttribuee: null,
                                        message: 'Utilisateur créé avec succès, aucune franchise disponible dans cette ville'
                                    });
                                });
                            }
                        }

                        // Appeler la fonction d'attribution
                        assignFranchiseToUser(franchiseToAssign);
                    });
                });
            });
        });
    },

    // Marquer le token comme utilisé
    markTokenAsUsed: (token, callback) => {
        const query = `
            UPDATE user_activations
            SET used = TRUE, used_at = NOW()
            WHERE token = ?
        `;
        db.query(query, [token], callback);
    },
};

module.exports = Contract;