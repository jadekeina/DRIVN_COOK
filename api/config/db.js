// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Pool de connexions (recommandé en prod)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'drivncook',
  database: process.env.DB_NAME || 'drivncook',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
});

// Test rapide de connexion
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Erreur de connexion MySQL :', err.message);
    console.error('Code d\'erreur :', err.code);
  } else {
    console.log('Connexion MySQL via pool OK');
    conn.release();
  }
});

// Interface Promesse (mysql2/promise)
const promisePool = pool.promise();

// On expose les deux interfaces pour compatibilité
module.exports = {
  // Ancien code qui fait db.query(sql, params, cb) continue de marcher
  query: (...args) => pool.query(...args),

  // Nouveau code qui fait await db.execute(sql, params)
  execute: (...args) => promisePool.execute(...args),

  // Accès direct si besoin
  pool,
};
