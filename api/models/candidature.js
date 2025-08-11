// models/candidature.js - CORRECT
const db = require('../config/db');

const Candidature = {
  // Créer une nouvelle candidature
  create: (candidatureData, callback) => {
    const {
      prenom, nom, email, telephone, ville, zone,
      experience_resto, commentaire_resto, ancien_franchise, commentaire_franchise,
      capital, motivation, cv_filename, lettre_filename, carte_filename,
      accept_terms, read_contract
    } = candidatureData;

    const query = `
            INSERT INTO franchise_candidatures (
                prenom, nom, email, telephone, ville, zone,
                experience_resto, commentaire_resto, ancien_franchise, commentaire_franchise,
                capital, motivation, cv_filename, lettre_filename, carte_filename,
                accept_terms, read_contract, statut
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
        `;

    db.query(query, [
      prenom, nom, email, telephone, ville, zone,
      experience_resto, commentaire_resto, ancien_franchise, commentaire_franchise,
      capital, motivation, cv_filename, lettre_filename, carte_filename,
      accept_terms, read_contract
    ], callback);
  },

  // Obtenir toutes les candidatures
  getAll: (callback) => {
    const query = `
            SELECT * FROM franchise_candidatures 
            ORDER BY created_at DESC
        `;
    db.query(query, callback);
  },

  // Obtenir les candidatures par statut
  getByStatus: (statut, callback) => {
    const query = `
            SELECT * FROM franchise_candidatures 
            WHERE statut = ? 
            ORDER BY created_at DESC
        `;
    db.query(query, [statut], callback);
  },

  // Obtenir une candidature par ID
  findById: (id, callback) => {
    const query = `
            SELECT * FROM franchise_candidatures WHERE id = ?
        `;
    db.query(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // Obtenir une candidature par email
  findByEmail: (email, callback) => {
    const query = `
            SELECT * FROM franchise_candidatures 
            WHERE email = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
    db.query(query, [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // Mettre à jour le statut d'une candidature
  updateStatus: (id, statut, notes_internes, callback) => {
    const query = `
            UPDATE franchise_candidatures 
            SET statut = ?, notes_internes = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
    db.query(query, [statut, notes_internes, id], callback);
  },

  // Supprimer une candidature (admin seulement)
  delete: (id, callback) => {
    db.query("DELETE FROM franchise_candidatures WHERE id = ?", [id], callback);
  },

  // Statistiques des candidatures
  getStats: (callback) => {
    const query = `
            SELECT 
                statut,
                COUNT(*) as count
            FROM franchise_candidatures 
            GROUP BY statut
        `;
    db.query(query, (err, results) => {
      if (err) return callback(err);

      // Transformer en objet pour faciliter l'usage
      const stats = {
        en_attente: 0,
        en_cours: 0,
        acceptee: 0,
        refusee: 0,
        total: 0
      };

      results.forEach(row => {
        stats[row.statut] = row.count;
        stats.total += row.count;
      });

      callback(null, stats);
    });
  }
};

module.exports = Candidature;