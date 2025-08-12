const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "drivncook",
  database: process.env.DB_NAME || "drivncook",
  // Suppression des options invalides
  connectTimeout: 60000,
});

connection.connect((err) => {
  if (err) {
    console.error("Erreur de connexion MySQL :", err.message);
    console.error("Code d'erreur :", err.code);
    return;
  }
  console.log("Connexion MySQL réussie ");
});

// Gestion des erreurs de connexion perdues
connection.on("error", (err) => {
  console.error("Erreur de base de données :", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Reconnexion à la base de données...");
    connection.connect();
  } else {
    throw err;
  }
});

module.exports = connection;
