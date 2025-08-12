const db = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  // Créer un nouvel utilisateur
  create: (userData, callback) => {
    const {
      email,
      password,
      first_name,
      last_name,
      role = "customer",
      phone,
    } = userData;

    // Hash du mot de passe
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err);

      db.query(
        "INSERT INTO users (email, password, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)",
        [email, hashedPassword, first_name, last_name, role, phone],
        callback,
      );
    });
  },

  // Trouver un utilisateur par email
  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  // Trouver un utilisateur par ID
  findById: (id, callback) => {
    db.query(
      "SELECT id, email, first_name, last_name, role, phone, is_verified, created_at FROM users WHERE id = ?",
      [id],
      (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
      },
    );
  },

  // Vérifier le mot de passe
  verifyPassword: (plainPassword, hashedPassword, callback) => {
    bcrypt.compare(plainPassword, hashedPassword, callback);
  },

  // Mettre à jour le statut de vérification
  markAsVerified: (id, callback) => {
    db.query(
      "UPDATE users SET is_verified = TRUE WHERE id = ?",
      [id],
      callback,
    );
  },

  // Obtenir tous les utilisateurs (admin only)
  getAll: (callback) => {
    db.query(
      "SELECT id, email, first_name, last_name, role, phone, is_verified, created_at FROM users ORDER BY created_at DESC",
      callback,
    );
  },

  // Mettre à jour un utilisateur
  update: (id, userData, callback) => {
    const { first_name, last_name, phone } = userData;
    db.query(
      "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?",
      [first_name, last_name, phone, id],
      callback,
    );
  },

  // Supprimer un utilisateur
  delete: (id, callback) => {
    db.query("DELETE FROM users WHERE id = ?", [id], callback);
  },
};

module.exports = User;
