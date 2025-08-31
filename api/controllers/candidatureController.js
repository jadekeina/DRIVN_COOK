const db = require('../config/db');
const emailService = require('../services/email.Service');

const CandidatureController = {
  // Créer une nouvelle candidature avec choix de franchise
  create: async (req, res) => {
    try {
      const {
        // Informations personnelles
        prenom,
        nom,
        email,
        telephone,

        // Informations de candidature
        ville,
        zone,
        franchise_souhaitee_id, // NOUVEAU : ID de la franchise souhaitée

        // Expérience
        experience_resto,
        commentaire_resto,
        ancien_franchise,
        commentaire_franchise,

        // Financier
        capital,

        // Motivation
        motivation,

        // Consentements
        accept_terms,
        read_contract
      } = req.body;

      console.log('[CANDIDATURE] Création candidature avec franchise:', {
        email,
        ville,
        franchise_souhaitee_id
      });

      // Validations de base
      if (!prenom || !nom || !email || !telephone || !ville || !zone || !motivation) {
        return res.status(400).json({
          success: false,
          message: "Tous les champs obligatoires doivent être remplis"
        });
      }

      if (!accept_terms || !read_contract) {
        return res.status(400).json({
          success: false,
          message: "Vous devez accepter les conditions et confirmer avoir lu le contrat"
        });
      }

      // Vérifier que la franchise souhaitée est disponible (si spécifiée)
      if (franchise_souhaitee_id) {
        const checkFranchiseQuery = `
                    SELECT id, name, city, owner_id 
                    FROM franchises 
                    WHERE id = ? AND is_active = TRUE
                `;

        db.query(checkFranchiseQuery, [franchise_souhaitee_id], (checkErr, checkResults) => {
          if (checkErr) {
            console.error('Erreur vérification franchise:', checkErr);
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la vérification de la franchise"
            });
          }

          if (!checkResults || checkResults.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Franchise sélectionnée introuvable"
            });
          }

          const franchise = checkResults[0];
          if (franchise.owner_id !== null) {
            return res.status(400).json({
              success: false,
              message: "Désolé, cette franchise n'est plus disponible"
            });
          }

          // Franchise valide et disponible, continuer avec la création
          createCandidature();
        });
      } else {
        // Aucune franchise spécifiée, créer directement
        createCandidature();
      }

      function createCandidature() {
        // Vérifier si une candidature existe déjà pour cet email
        db.query('SELECT id FROM franchise_candidatures WHERE email = ?', [email], (err, existing) => {
          if (err) {
            console.error('Erreur vérification candidature existante:', err);
            return res.status(500).json({
              success: false,
              message: "Erreur serveur"
            });
          }

          if (existing && existing.length > 0) {
            return res.status(409).json({
              success: false,
              message: "Une candidature existe déjà pour cette adresse email"
            });
          }

          // Créer la candidature
          const insertQuery = `
                        INSERT INTO franchise_candidatures (
                            prenom, nom, email, telephone, ville, zone,
                            franchise_souhaitee_id,
                            experience_resto, commentaire_resto,
                            ancien_franchise, commentaire_franchise,
                            capital, motivation,
                            accept_terms, read_contract
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

          const values = [
            prenom, nom, email, telephone, ville, zone,
            franchise_souhaitee_id || null,
            experience_resto, commentaire_resto || null,
            ancien_franchise, commentaire_franchise || null,
            capital, motivation,
            accept_terms, read_contract
          ];

          db.query(insertQuery, values, async (insertErr, result) => {
            if (insertErr) {
              console.error('Erreur création candidature:', insertErr);
              return res.status(500).json({
                success: false,
                message: "Erreur lors de la création de la candidature"
              });
            }

            console.log(`[CANDIDATURE] Candidature créée avec ID: ${result.insertId}`);

            // Préparer les données pour l'email
            const candidatureData = {
              prenom,
              nom,
              email,
              telephone,
              ville,
              zone,
              franchise_souhaitee: franchise_souhaitee_id ?
                  `Franchise spécifique demandée (ID: ${franchise_souhaitee_id})` :
                  `Toute franchise disponible à ${ville}`
            };

            // Envoyer email de confirmation
            try {
              await emailService.sendCandidatureConfirmation(candidatureData);
              console.log(`[EMAIL] Confirmation candidature envoyée à ${email}`);
            } catch (emailError) {
              console.error('[EMAIL] Erreur envoi confirmation:', emailError);
              // Ne pas faire échouer la candidature si l'email échoue
            }

            res.status(201).json({
              success: true,
              message: "Candidature soumise avec succès ! Vous recevrez une réponse sous 48h.",
              data: {
                candidature_id: result.insertId,
                email,
                franchise_souhaitee_id
              }
            });
          });
        });
      }

    } catch (error) {
      console.error('Erreur dans create candidature:', error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Méthode pour récupérer toutes les candidatures (admin)
  getAll: (req, res) => {
    try {
      const query = `
                SELECT 
                    fc.*,
                    f.name as franchise_souhaitee_nom,
                    f.city as franchise_souhaitee_ville
                FROM franchise_candidatures fc
                LEFT JOIN franchises f ON fc.franchise_souhaitee_id = f.id
                ORDER BY fc.created_at DESC
            `;

      db.query(query, (err, results) => {
        if (err) {
          console.error('Erreur récupération candidatures:', err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des candidatures"
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });
    } catch (error) {
      console.error('Erreur dans getAll candidatures:', error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  getById: (req, res) => {
    try {
      const { id } = req.params;
      const sql = `
        SELECT 
          fc.*,
          f.name AS franchise_souhaitee_nom,
          f.city AS franchise_souhaitee_ville
        FROM franchise_candidatures fc
        LEFT JOIN franchises f ON fc.franchise_souhaitee_id = f.id
        WHERE fc.id = ?
      `;
      db.query(sql, [id], (err, rows) => {
        if (err) {
          console.error("Erreur getById candidature:", err);
          return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
        if (!rows || rows.length === 0) {
          return res.status(404).json({ success: false, message: "Candidature non trouvée" });
        }
        res.json({ success: true, data: rows[0] });
      });
    } catch (error) {
      console.error("Erreur dans getById:", error);
      res.status(500).json({ success: false, message: "Erreur interne du serveur" });
    }
  },

  // Accepter une candidature et envoyer le contrat
  accept: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes_internes } = req.body;

      console.log(`[CANDIDATURE] Acceptation candidature ${id}`);

      // Récupérer la candidature
      const candidatureQuery = `
                SELECT fc.*, f.name as franchise_nom
                FROM franchise_candidatures fc
                LEFT JOIN franchises f ON fc.franchise_souhaitee_id = f.id
                WHERE fc.id = ?
            `;

      db.query(candidatureQuery, [id], async (err, results) => {
        if (err) {
          console.error('Erreur récupération candidature:', err);
          return res.status(500).json({
            success: false,
            message: "Erreur serveur"
          });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Candidature non trouvée"
          });
        }

        const candidature = results[0];

        if (candidature.statut !== 'en_attente') {
          return res.status(400).json({
            success: false,
            message: "Cette candidature a déjà été traitée"
          });
        }

        // Vérifier que la franchise est toujours disponible (si spécifiée)
        if (candidature.franchise_souhaitee_id) {
          const checkQuery = `
                        SELECT owner_id FROM franchises 
                        WHERE id = ? AND is_active = TRUE
                    `;

          db.query(checkQuery, [candidature.franchise_souhaitee_id], (checkErr, checkResult) => {
            if (checkErr || !checkResult || checkResult.length === 0) {
              return res.status(400).json({
                success: false,
                message: "La franchise souhaitée n'est plus disponible"
              });
            }

            if (checkResult[0].owner_id !== null) {
              return res.status(400).json({
                success: false,
                message: "La franchise souhaitée a déjà été attribuée"
              });
            }

            // Continuer avec l'acceptation
            proceedWithAcceptance();
          });
        } else {
          proceedWithAcceptance();
        }

        async function proceedWithAcceptance() {
          // Générer token d'activation
          const crypto = require('crypto');
          const activationToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

          // Mettre à jour le statut et créer le token
          db.beginTransaction(async (transErr) => {
            if (transErr) {
              console.error('Erreur transaction:', transErr);
              return res.status(500).json({
                success: false,
                message: "Erreur serveur"
              });
            }

            // Mettre à jour la candidature
            const updateQuery = `
                            UPDATE franchise_candidatures 
                            SET statut = 'acceptee', notes_internes = ?, updated_at = NOW()
                            WHERE id = ?
                        `;

            db.query(updateQuery, [notes_internes || '', id], (updateErr) => {
              if (updateErr) {
                return db.rollback(() => {
                  console.error('Erreur mise à jour candidature:', updateErr);
                  res.status(500).json({
                    success: false,
                    message: "Erreur lors de la mise à jour"
                  });
                });
              }

              // Créer le token d'activation
              const tokenQuery = `
                                INSERT INTO user_activations (
                                    candidature_id, token, email, expires_at
                                ) VALUES (?, ?, ?, ?)
                            `;

              db.query(tokenQuery, [id, activationToken, candidature.email, expiresAt], async (tokenErr) => {
                if (tokenErr) {
                  return db.rollback(() => {
                    console.error('Erreur création token:', tokenErr);
                    res.status(500).json({
                      success: false,
                      message: "Erreur lors de la création du token"
                    });
                  });
                }

                db.commit(async (commitErr) => {
                  if (commitErr) {
                    console.error('Erreur commit:', commitErr);
                    return res.status(500).json({
                      success: false,
                      message: "Erreur serveur"
                    });
                  }

                  // Envoyer l'email d'acceptation avec le contrat
                  try {
                    await emailService.sendAcceptanceEmail({
                      ...candidature,
                      activationToken,
                      franchise_demandee: candidature.franchise_nom || `Franchise à ${candidature.ville}`
                    });

                    console.log(`[EMAIL] Email d'acceptation envoyé à ${candidature.email}`);

                    res.json({
                      success: true,
                      message: "Candidature acceptée et contrat envoyé par email",
                      data: {
                        candidature_id: id,
                        activation_token: activationToken,
                        expires_at: expiresAt
                      }
                    });

                  } catch (emailError) {
                    console.error('Erreur envoi email:', emailError);
                    res.status(500).json({
                      success: false,
                      message: "Candidature acceptée mais erreur d'envoi email"
                    });
                  }
                });
              });
            });
          });
        }
      });

    } catch (error) {
      console.error('Erreur acceptation candidature:', error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  },

  // Refuser une candidature
  reject: (req, res) => {
    try {
      const { id } = req.params;
      const { notes_internes } = req.body;

      console.log(`[CANDIDATURE] Refus candidature ${id}`);

      const updateQuery = `
                UPDATE franchise_candidatures 
                SET statut = 'refusee', notes_internes = ?, updated_at = NOW()
                WHERE id = ? AND statut = 'en_attente'
            `;

      db.query(updateQuery, [notes_internes || '', id], (err, result) => {
        if (err) {
          console.error('Erreur refus candidature:', err);
          return res.status(500).json({
            success: false,
            message: "Erreur lors du refus"
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Candidature non trouvée ou déjà traitée"
          });
        }

        res.json({
          success: true,
          message: "Candidature refusée avec succès"
        });
      });

    } catch (error) {
      console.error('Erreur dans reject:', error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
};


module.exports = CandidatureController;