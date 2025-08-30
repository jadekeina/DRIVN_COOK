// models/contract.js
const db = require("../config/db");

const Contract = {
    getCandidatureByToken: async (token, cb) => {
        try {
            const [rows] = await db.execute(`
                SELECT c.*, ua.token, ua.expires_at, ua.used, ua.candidature_id
                FROM user_activations ua
                         INNER JOIN franchise_candidatures c ON ua.candidature_id = c.id
                WHERE ua.token = ?
                  AND ua.used = FALSE
                  AND ua.expires_at > NOW()
            `, [token]);

            cb(null, rows[0] || null);
        } catch (err) {
            console.error('getCandidatureByToken error:', err);
            cb(err);
        }
    },

    markTokenAsUsed: async (token, cb) => {
        try {
            const [result] = await db.execute(`
                UPDATE user_activations SET used = TRUE, used_at = NOW()
                WHERE token = ?
            `, [token]);
            cb(null, result);
        } catch (err) {
            console.error('markTokenAsUsed error:', err);
            cb(err);
        }
    },

    createFranchiseUser: async (userData, cb) => {
        const { email, password, first_name, last_name, phone, assigned_zone } = userData;
        try {
            const [result] = await db.execute(`
                INSERT INTO users (
                    email, password, first_name, last_name, role, phone,
                    is_verified, payment_status, contract_signed_at,
                    deposit_paid_at, assigned_zone, franchise_payment_completed_at,
                    franchise_payment_method, created_at
                ) VALUES (?, ?, ?, ?, 'franchise_owner', ?, TRUE,
                          'franchise_payment_completed', NOW(), NOW(), ?, NOW(), 'stripe', NOW())
            `, [email, password, first_name, last_name, phone, assigned_zone]);

            cb(null, result);
        } catch (err) {
            console.error('createFranchiseUser error:', err);
            cb(err);
        }
    },

    checkUserExists: async (email, cb) => {
        try {
            const [rows] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email]);
            cb(null, rows.length > 0);
        } catch (err) {
            console.error('checkUserExists error:', err);
            cb(err);
        }
    },

    updatePaymentStatus: async (token, paymentCompleted, cb) => {
        try {
            const [col] = await db.execute(`SHOW COLUMNS FROM user_activations LIKE 'payment_completed'`);
            if (col.length === 0) return cb(null, { affectedRows: 0 });

            const [res] = await db.execute(
                `UPDATE user_activations SET payment_completed = ? WHERE token = ?`,
                [paymentCompleted, token]
            );
            cb(null, res);
        } catch (err) {
            console.error('updatePaymentStatus error:', err);
            cb(err);
        }
    }
};

module.exports = Contract;
