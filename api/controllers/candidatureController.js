// controllers/candidatureController.js

const { pool } = require('../config/db');
const emailService = require('../services/email.Service');
const crypto = require('crypto');

const CandidatureController = {
  // Créer une candidature
  create: async (req, res) => {
    try {
      console.log('[CANDIDATURE] Nouvelle candidature:', req.body);

      const {
        prenom, nom, email, telephone, ville, zone,
        experience_resto, commentaire_resto,
        ancien_franchise, commentaire_franchise,
        capital, accept_terms, read_contract,
        siret, vat
      } = req.body;

      // Validation des champs obligatoires
      const requiredFields = { prenom, nom, email, telephone, ville, zone, capital, accept_terms };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(400).json({
            success: false,
            message: `Le champ ${field} est requis`
          });
        }
      }

      // Gestion des fichiers uploadés
      const files = req.files || {};
      const cv_filename = files.cv ? files.cv[0].filename : null;
      const lettre_filename = files.lettre ? files.lettre[0].filename : null;
      const carte_filename = files.carte ? files.carte[0].filename : null;

      // Insertion en base
      const insertQuery = `
                INSERT INTO franchise_candidatures (
                    prenom, nom, email, telephone, ville, zone,
                    experience_resto, commentaire_resto,
                    ancien_franchise, commentaire_franchise,
                    capital, accept_terms, read_contract,
                    cv_filename, lettre_filename, carte_filename,
                    siret, vat, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

      pool.query(insertQuery, [
        prenom, nom, email, telephone, ville, zone,
        experience_resto, commentaire_resto || null,
        ancien_franchise, commentaire_franchise || null,
        capital, accept_terms ? 1 : 0, read_contract ? 1 : 0,
        cv_filename, lettre_filename, carte_filename,
        siret, vat
      ], (err, result) => {
        if (err) {
          console.error('[CANDIDATURE] Erreur insertion:', err);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de la candidature'
          });
        }

        console.log('[CANDIDATURE] Candidature créée avec ID:', result.insertId);

        res.json({
          success: true,
          message: 'Candidature soumise avec succès',
          data: {
            candidature_id: result.insertId,
            email: email,
            prenom: prenom,
            nom: nom
          }
        });
      });

    } catch (error) {
      console.error('[CANDIDATURE] Erreur création:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  },

  // Récupérer toutes les candidatures (admin)
  getAll: (req, res) => {
    console.log('[CANDIDATURE] Récupération de toutes les candidatures');

    const query = `
            SELECT * FROM franchise_candidatures 
            ORDER BY created_at DESC
        `;

    pool.query(query, (err, results) => {
      if (err) {
        console.error('[CANDIDATURE] Erreur récupération:', err);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des candidatures'
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    });
  },

  // Récupérer une candidature par ID
  getById: (req, res) => {
    const candidatureId = req.params.id;
    console.log('[CANDIDATURE] Récupération candidature ID:', candidatureId);

    const query = `
            SELECT * FROM franchise_candidatures 
            WHERE id = ?
        `;

    pool.query(query, [candidatureId], (err, results) => {
      if (err) {
        console.error('[CANDIDATURE] Erreur récupération by ID:', err);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération de la candidature'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Candidature non trouvée'
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    });
  },

  // ACCEPTER une candidature
  accept: async (req, res) => {
    const candidatureId = req.params.id;
    console.log('[CANDIDATURE] Acceptation candidature ID:', candidatureId);

    try {
      // 1. Récupérer la candidature
      const getCandidatureQuery = `
                SELECT * FROM franchise_candidatures 
                WHERE id = ? AND statut = 'en_attente'
            `;

      pool.query(getCandidatureQuery, [candidatureId], async (err, candidatures) => {
        if (err) {
          console.error('[CANDIDATURE] Erreur récupération:', err);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la candidature'
          });
        }

        if (candidatures.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Candidature non trouvée ou déjà traitée'
          });
        }

        const candidature = candidatures[0];
        console.log('[CANDIDATURE] Candidature trouvée:', candidature.email);

        // 2. Mettre à jour le statut
        const updateQuery = `
                    UPDATE franchise_candidatures 
                    SET statut = 'acceptee', updated_at = NOW() 
                    WHERE id = ?
                `;

        pool.query(updateQuery, [candidatureId], async (updateErr) => {
          if (updateErr) {
            console.error('[CANDIDATURE] Erreur mise à jour:', updateErr);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de la mise à jour du statut'
            });
          }

          console.log('[CANDIDATURE] Statut mis à jour vers acceptée');

          // 3. Générer le token d'activation
          const activationToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

          console.log('[CANDIDATURE] Token généré:', activationToken.substring(0, 10) + '...');

          // 4. Insérer le token en base
          const insertTokenQuery = `
                        INSERT INTO user_activations (candidature_id, token, email, expires_at, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    `;

          pool.query(insertTokenQuery, [candidatureId, activationToken, candidature.email, expiresAt], async (tokenErr) => {
            if (tokenErr) {
              console.error('[CANDIDATURE] Erreur insertion token:', tokenErr);
              return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du token d\'activation'
              });
            }

            console.log('[CANDIDATURE] Token sauvegardé en base');

            // 5. Envoyer l'email avec le token
            try {
              await emailService.sendAcceptanceEmail(candidature, activationToken);
              console.log('[CANDIDATURE] Email d\'acceptation envoyé avec succès');

              res.json({
                success: true,
                message: `Candidature acceptée. Email envoyé à ${candidature.email}`,
                data: {
                  candidature_id: candidatureId,
                  email_sent: true,
                  contract_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${activationToken}`,
                  token_preview: activationToken.substring(0, 10) + '...',
                  expires_at: expiresAt
                }
              });

            } catch (emailError) {
              console.error('[CANDIDATURE] Erreur envoi email:', emailError);

              res.status(207).json({
                success: true,
                message: 'Candidature acceptée mais erreur d\'envoi email',
                warning: 'L\'email n\'a pas pu être envoyé automatiquement',
                data: {
                  candidature_id: candidatureId,
                  email_sent: false,
                  token: activationToken,
                  contract_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${activationToken}`,
                  email_error: emailError.message
                }
              });
            }
          });
        });
      });

    } catch (error) {
      console.error('[CANDIDATURE] Erreur globale acceptation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne lors de l\'acceptation'
      });
    }
  },

  // REFUSER une candidature
  reject: async (req, res) => {
    const candidatureId = req.params.id;
    console.log('[CANDIDATURE] Refus candidature ID:', candidatureId);

    try {
      // 1. Récupérer la candidature
      const getCandidatureQuery = `
                SELECT * FROM franchise_candidatures 
                WHERE id = ? AND statut = 'en_attente'
            `;

      pool.query(getCandidatureQuery, [candidatureId], async (err, candidatures) => {
        if (err) {
          console.error('[CANDIDATURE] Erreur récupération:', err);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la candidature'
          });
        }

        if (candidatures.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Candidature non trouvée ou déjà traitée'
          });
        }

        const candidature = candidatures[0];

        // 2. Mettre à jour le statut
        const updateQuery = `
                    UPDATE franchise_candidatures 
                    SET statut = 'refusee', updated_at = NOW() 
                    WHERE id = ?
                `;

        pool.query(updateQuery, [candidatureId], async (updateErr) => {
          if (updateErr) {
            console.error('[CANDIDATURE] Erreur mise à jour refus:', updateErr);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de la mise à jour du statut'
            });
          }

          // 3. Envoyer l'email de refus
          try {
            await emailService.sendRejectionEmail(candidature);
            console.log('[CANDIDATURE] Email de refus envoyé');

            res.json({
              success: true,
              message: `Candidature refusée. Email envoyé à ${candidature.email}`,
              data: {
                candidature_id: candidatureId,
                email_sent: true
              }
            });

          } catch (emailError) {
            console.error('[CANDIDATURE] Erreur envoi email refus:', emailError);

            res.status(207).json({
              success: true,
              message: 'Candidature refusée mais erreur d\'envoi email',
              data: {
                candidature_id: candidatureId,
                email_sent: false,
                email_error: emailError.message
              }
            });
          }
        });
      });

    } catch (error) {
      console.error('[CANDIDATURE] Erreur globale refus:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne lors du refus'
      });
    }
  }
};

module.exports = CandidatureController;