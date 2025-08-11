const db = require('../config/db');

const Franchise = {
    getAll: (callback) => {
        const query = `
            SELECT f.*, u.first_name, u.last_name, u.email as owner_email
            FROM franchises f
                     LEFT JOIN users u ON f.owner_id = u.id
            WHERE f.is_active = TRUE
            ORDER BY f.created_at DESC
        `;
        db.query(query, callback);
    },

    findById: (id, callback) => {
        const query = `
            SELECT f.*, u.first_name, u.last_name, u.email as owner_email
            FROM franchises f
                     LEFT JOIN users u ON f.owner_id = u.id
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
        db.query(query, [name, email, phone, address, city, postal_code, owner_id], callback);
    },

    update: (id, data, callback) => {
        const { name, email, phone, address, city, postal_code } = data;
        const query = `
            UPDATE franchises
            SET name = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        db.query(query, [name, email, phone, address, city, postal_code, id], callback);
    },

    delete: (id, callback) => {
        // Soft delete - marquer comme inactif au lieu de supprimer
        db.query("UPDATE franchises SET is_active = FALSE WHERE id = ?", [id], callback);
    },

    // Supprimer définitivement (admin seulement)
    hardDelete: (id, callback) => {
        db.query("DELETE FROM franchises WHERE id = ?", [id], callback);
    }
};

module.exports = Franchise;