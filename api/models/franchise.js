const db = require("../config/db");
// Commenté temporairement si pas de service email
// const emailService = require("../services/franchiseAssignmentEmail");

const Franchise = {
  // Méthodes existantes conservées avec mise à jour pour inclure assigned_to_user_id
  getAll: (callback) => {
    const query = `
      SELECT f.*,
             owner.first_name as owner_first_name,
             owner.last_name as owner_last_name,
             owner.email as owner_email,
             owner.payment_status as owner_payment_status,
             assigned.first_name as assigned_first_name,
             assigned.last_name as assigned_last_name,
             assigned.email as assigned_email,
             assigned.phone as assigned_phone,
             assigned.assigned_zone,
             CASE
               WHEN f.owner_id IS NULL THEN 'disponible'
               ELSE 'assignee'
               END as statut_assignation
      FROM franchises f
             LEFT JOIN users owner ON f.owner_id = owner.id
             LEFT JOIN users assigned ON f.assigned_to_user_id = assigned.id
      WHERE f.is_active = TRUE
      ORDER BY f.created_at DESC
    `;
    db.query(query, callback);
  },

  findById: (id, callback) => {
    const query = `
      SELECT f.*,
             owner.first_name as owner_first_name,
             owner.last_name as owner_last_name,
             owner.email as owner_email,
             owner.payment_status as owner_payment_status,
             assigned.first_name as assigned_first_name,
             assigned.last_name as assigned_last_name,
             assigned.email as assigned_email,
             assigned.phone as assigned_phone,
             assigned.assigned_zone
      FROM franchises f
             LEFT JOIN users owner ON f.owner_id = owner.id
             LEFT JOIN users assigned ON f.assigned_to_user_id = assigned.id
      WHERE f.id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  findByOwnerId: (ownerId, callback) => {
    const query = `
      SELECT * FROM franchises
      WHERE owner_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    db.query(query, [ownerId], callback);
  },

  create: (data, callback) => {
    const { name, email, phone, address, city, postal_code, owner_id } = data;
    const query = `
      INSERT INTO franchises (name, email, phone, address, city, postal_code, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [name, email, phone, address, city, postal_code, owner_id],
        callback,
    );
  },

  update: (id, data, callback) => {
    const { name, email, phone, address, city, postal_code } = data;
    const query = `
      UPDATE franchises
      SET name = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.query(
        query,
        [name, email, phone, address, city, postal_code, id],
        callback,
    );
  },

  delete: (id, callback) => {
    db.query(
        "UPDATE franchises SET is_active = FALSE WHERE id = ?",
        [id],
        callback,
    );
  },

  hardDelete: (id, callback) => {
    db.query("DELETE FROM franchises WHERE id = ?", [id], callback);
  },

  // NOUVELLES MÉTHODES pour la gestion des assignations

  // Obtenir les franchises disponibles (non assignées)
  getAvailableFranchises: (callback) => {
    const query = `
      SELECT * FROM franchises
      WHERE owner_id IS NULL
        AND is_active = TRUE
      ORDER BY city, name
    `;
    db.query(query, callback);
  },

  // Obtenir les utilisateurs éligibles (qui ont payé leurs 50K)
  getEligibleUsers: (callback) => {
    const query = `
      SELECT id, first_name, last_name, email, phone, assigned_zone, payment_status,
             franchise_payment_completed_at
      FROM users
      WHERE payment_status = 'franchise_payment_completed'
        AND role = 'franchise_owner'
        AND id NOT IN (SELECT owner_id FROM franchises WHERE owner_id IS NOT NULL)
      ORDER BY franchise_payment_completed_at DESC
    `;
    db.query(query, callback);
  },

  // Assigner une franchise à un utilisateur (VERSION SIMPLE SANS EMAIL POUR L'INSTANT)
  assignFranchiseToUser: (franchiseId, userId, callback) => {
    console.log(`[FRANCHISE] Assignation franchise ${franchiseId} à utilisateur ${userId}`);

    // Obtenir une connexion du pool pour faire une vraie transaction
    db.pool.getConnection((err, connection) => {
      if (err) {
        console.error('[FRANCHISE] Erreur connexion pool:', err);
        return callback(err);
      }

      // Commencer la transaction
      connection.beginTransaction((err) => {
        if (err) {
          console.error('[FRANCHISE] Erreur début transaction:', err);
          connection.release();
          return callback(err);
        }

        // Étape 1: Vérifier que la franchise est disponible et récupérer ses détails
        const checkFranchiseQuery = `
          SELECT id, name, city, address, email, phone FROM franchises
          WHERE id = ? AND owner_id IS NULL AND is_active = TRUE
        `;

        connection.query(checkFranchiseQuery, [franchiseId], (err, franchiseResults) => {
          if (err) {
            console.error('[FRANCHISE] Erreur vérification franchise:', err);
            return connection.rollback(() => {
              connection.release();
              callback(err);
            });
          }

          if (franchiseResults.length === 0) {
            console.log('[FRANCHISE] Franchise non disponible');
            return connection.rollback(() => {
              connection.release();
              callback(new Error("Franchise non disponible"));
            });
          }

          const franchiseData = franchiseResults[0];
          console.log('[FRANCHISE] Franchise trouvée:', franchiseData);

          // Étape 2: Vérifier que l'utilisateur est éligible et récupérer ses détails
          const checkUserQuery = `
            SELECT id, first_name, last_name, email, phone, payment_status FROM users
            WHERE id = ? AND payment_status = 'franchise_payment_completed' AND role = 'franchise_owner'
          `;

          connection.query(checkUserQuery, [userId], (err, userResults) => {
            if (err) {
              console.error('[FRANCHISE] Erreur vérification utilisateur:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            if (userResults.length === 0) {
              console.log('[FRANCHISE] Utilisateur non éligible');
              return connection.rollback(() => {
                connection.release();
                callback(new Error("Utilisateur non éligible"));
              });
            }

            const userData = userResults[0];
            console.log('[FRANCHISE] Utilisateur trouvé:', userData);

            // Étape 3: Assigner la franchise (owner_id ET assigned_to_user_id)
            const assignQuery = `
              UPDATE franchises
              SET owner_id = ?, assigned_to_user_id = ?, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND owner_id IS NULL
            `;

            connection.query(assignQuery, [userId, userId, franchiseId], (err, assignResult) => {
              if (err) {
                console.error('[FRANCHISE] Erreur assignation:', err);
                return connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
              }

              if (assignResult.affectedRows === 0) {
                console.log('[FRANCHISE] Aucune ligne affectée lors de l\'assignation');
                return connection.rollback(() => {
                  connection.release();
                  callback(new Error("Échec de l'assignation - franchise déjà prise"));
                });
              }

              console.log('[FRANCHISE] Assignation réussie');

              // Étape 4: Mettre à jour le statut de l'utilisateur
              const assignedZone = `${franchiseData.city} - ${franchiseData.name}`;

              const updateUserQuery = `
                UPDATE users
                SET payment_status = 'franchise_active', assigned_zone = ?
                WHERE id = ?
              `;

              connection.query(updateUserQuery, [assignedZone, userId], (err, updateResult) => {
                if (err) {
                  console.error('[FRANCHISE] Erreur mise à jour utilisateur:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }

                console.log('[FRANCHISE] Utilisateur mis à jour');

                // Tout s'est bien passé, on confirme la transaction
                connection.commit((err) => {
                  if (err) {
                    console.error('[FRANCHISE] Erreur commit transaction:', err);
                    return connection.rollback(() => {
                      connection.release();
                      callback(err);
                    });
                  }

                  console.log('[FRANCHISE] Transaction commitée avec succès');
                  connection.release();

                  // Étape 5: Email (commenté pour l'instant)
                  /*
                  const userDataForEmail = {
                    ...userData,
                    assigned_zone: assignedZone
                  };

                  setImmediate(async () => {
                    try {
                      const emailResult = await emailService.sendAssignmentEmail(userDataForEmail, franchiseData);
                      console.log('[FRANCHISE] Email assignation envoyé:', emailResult);
                      await emailService.sendAdminNotification(userDataForEmail, franchiseData);
                    } catch (emailError) {
                      console.error('[FRANCHISE] Erreur envoi email (non bloquante):', emailError);
                    }
                  });
                  */

                  // Retourner le succès immédiatement
                  callback(null, {
                    success: true,
                    message: "Franchise assignée avec succès",
                    franchiseId,
                    userId,
                    assignedZone,
                    emailSent: false, // Changé à false pour l'instant
                    franchiseName: franchiseData.name,
                    userEmail: userData.email
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  // Désassigner une franchise (libérer) - VERSION CORRIGÉE
  unassignFranchise: (franchiseId, callback) => {
    console.log(`[FRANCHISE] Libération franchise ${franchiseId}`);

    // Obtenir une connexion du pool pour la transaction
    db.pool.getConnection((err, connection) => {
      if (err) {
        console.error('[FRANCHISE] Erreur connexion pool:', err);
        return callback(err);
      }

      connection.beginTransaction((err) => {
        if (err) {
          console.error('[FRANCHISE] Erreur début transaction:', err);
          connection.release();
          return callback(err);
        }

        // Récupérer l'ID du propriétaire actuel
        const getCurrentOwnerQuery = `
          SELECT owner_id FROM franchises WHERE id = ? AND owner_id IS NOT NULL
        `;

        connection.query(getCurrentOwnerQuery, [franchiseId], (err, results) => {
          if (err) {
            console.error('[FRANCHISE] Erreur récupération propriétaire:', err);
            return connection.rollback(() => {
              connection.release();
              callback(err);
            });
          }

          if (results.length === 0) {
            return connection.rollback(() => {
              connection.release();
              callback(new Error("Franchise déjà disponible ou introuvable"));
            });
          }

          const currentOwnerId = results[0].owner_id;
          console.log('[FRANCHISE] Propriétaire actuel:', currentOwnerId);

          // CORRECTION: Libérer AUSSI assigned_to_user_id et assigned_at
          const unassignQuery = `
            UPDATE franchises
            SET owner_id = NULL, assigned_to_user_id = NULL, assigned_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;

          connection.query(unassignQuery, [franchiseId], (err, unassignResult) => {
            if (err) {
              console.error('[FRANCHISE] Erreur libération:', err);
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            console.log('[FRANCHISE] Franchise libérée');

            // Remettre l'utilisateur en attente d'assignation
            const updateUserQuery = `
              UPDATE users
              SET payment_status = 'franchise_payment_completed', assigned_zone = NULL
              WHERE id = ?
            `;

            connection.query(updateUserQuery, [currentOwnerId], (err, updateResult) => {
              if (err) {
                console.error('[FRANCHISE] Erreur mise à jour utilisateur:', err);
                return connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
              }

              console.log('[FRANCHISE] Utilisateur remis en attente');

              // Commit de la transaction
              connection.commit((err) => {
                if (err) {
                  console.error('[FRANCHISE] Erreur commit transaction:', err);
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }

                console.log('[FRANCHISE] Transaction de libération commitée');
                connection.release();

                callback(null, {
                  success: true,
                  message: "Franchise libérée avec succès",
                  franchiseId,
                  previousOwnerId: currentOwnerId
                });
              });
            });
          });
        });
      });
    });
  },

  // Obtenir un résumé des assignations
  getAssignmentSummary: (callback) => {
    const query = `
      SELECT
        COUNT(*) as total_franchises,
        SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) as franchises_assignees,
        SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as franchises_disponibles
      FROM franchises
      WHERE is_active = TRUE
    `;
    db.query(query, callback);
  },

  // NOUVELLE MÉTHODE: Obtenir les détails d'assignation pour un utilisateur spécifique
  getUserAssignment: (userId, callback) => {
    console.log(`[FRANCHISE] Récupération assignation pour utilisateur ${userId}`);

    const query = `
      SELECT 
        f.*,
        f.assigned_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.assigned_zone,
        u.payment_status,
        u.franchise_payment_completed_at
      FROM franchises f
      INNER JOIN users u ON f.assigned_to_user_id = u.id
      WHERE f.assigned_to_user_id = ? AND f.is_active = TRUE
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('[FRANCHISE] Erreur récupération assignation utilisateur:', err);
        return callback(err);
      }

      console.log(`[FRANCHISE] Assignation trouvée pour utilisateur ${userId}:`, results.length > 0 ? results[0] : 'Aucune');
      callback(null, results[0] || null);
    });
  },

  // NOUVELLE MÉTHODE: Obtenir l'historique des assignations
  getAssignmentHistory: (callback) => {
    const query = `
      SELECT 
        f.id,
        f.name as franchise_name,
        f.city,
        f.assigned_at,
        u.first_name,
        u.last_name,
        u.email,
        u.assigned_zone,
        DATEDIFF(NOW(), f.assigned_at) as jours_depuis_assignation
      FROM franchises f
      INNER JOIN users u ON f.assigned_to_user_id = u.id
      WHERE f.assigned_at IS NOT NULL AND f.is_active = TRUE
      ORDER BY f.assigned_at DESC
      LIMIT 50
    `;

    db.query(query, callback);
  }
};

module.exports = Franchise;