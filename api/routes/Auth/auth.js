const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/authController");
const { authenticateToken } = require("../../middleware/auth");
const validators = require("../../middleware/validators");

// AJOUT DES IMPORTS MANQUANTS POUR LES ROUTES DEBUG
const bcrypt = require('bcryptjs');

// Import de la base de données avec gestion d'erreur
let db;
try {
  db = require('../../config/db');
  console.log('✅ Module DB importé avec succès');
} catch (error) {
  console.error('❌ Erreur import DB:', error.message);
  console.error('Assurez-vous que le fichier config/db.js existe');
}

// Routes publiques
router.post("/register", validators.register, AuthController.register);
router.post("/login", validators.login, AuthController.login);

// Routes protégées
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put(
    "/profile",
    authenticateToken,
    validators.updateProfile,
    AuthController.updateProfile,
);

// Route pour vérifier si le token est valide
router.get("/verify-token", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token valide",
    userId: req.userId,
  });
});

// Route de déconnexion (côté client, supprimer le token)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
});

// ===== ROUTES DE DEBUG =====

// Route pour diagnostiquer le problème DB
router.get("/debug/db-info", (req, res) => {
  const path = require('path');
  const fs = require('fs');

  // Vérifier les fichiers possibles
  const possiblePaths = [
    '../../config/db.js',
    '../../config/database.js',
    '../../../config/db.js'
  ];

  const fileChecks = possiblePaths.map(filePath => {
    const absolutePath = path.resolve(__dirname, filePath);
    return {
      path: filePath,
      absolutePath: absolutePath,
      exists: fs.existsSync(absolutePath)
    };
  });

  res.json({
    success: true,
    message: "Diagnostic DB",
    data: {
      db_imported: !!db,
      db_type: typeof db,
      current_dir: __dirname,
      file_checks: fileChecks,
      working_directory: process.cwd()
    }
  });
});

// 1. Test de connexion à la base de données (corrigé)
router.get("/debug/db-test", async (req, res) => {
  // Vérifier que db est disponible
  if (!db) {
    return res.status(500).json({
      success: false,
      message: "Module DB non disponible",
      error: "db is not defined - Vérifiez que config/db.js existe et est correct"
    });
  }

  try {
    console.log('Test connexion DB...');
    const result = await db.execute('SELECT 1 as test');
    console.log('Résultat brut DB:', result);

    // Gestion des différents formats de retour
    let data;
    if (Array.isArray(result)) {
      data = result[0]; // Si c'est déjà un tableau
    } else if (result[0]) {
      data = result[0]; // Si c'est [rows, fields]
    } else {
      data = result; // Si c'est directement les données
    }

    res.json({
      success: true,
      message: "Connexion DB OK",
      data: data,
      debug: {
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultKeys: Object.keys(result)
      }
    });
  } catch (error) {
    console.error('Erreur DB test:', error);
    res.status(500).json({
      success: false,
      message: "Erreur DB",
      error: error.message
    });
  }
});

// 2. Lister tous les utilisateurs (corrigé)
router.get("/debug/users", async (req, res) => {
  if (!db) {
    return res.status(500).json({
      success: false,
      message: "Module DB non disponible",
      error: "db is not defined"
    });
  }

  try {
    console.log('Récupération des utilisateurs...');
    const result = await db.execute(`
      SELECT id, email, first_name, last_name, role, is_verified, 
             LEFT(password, 20) as password_preview,
             LENGTH(password) as password_length,
             created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log('Résultat brut users:', result);

    // Gestion du format de retour
    let users;
    if (Array.isArray(result)) {
      users = result;
    } else if (result[0] && Array.isArray(result[0])) {
      users = result[0];
    } else {
      users = [result];
    }

    res.json({
      success: true,
      data: users,
      count: users.length,
      debug: {
        resultType: typeof result,
        isArray: Array.isArray(result),
        hasSubArray: result[0] && Array.isArray(result[0])
      }
    });
  } catch (error) {
    console.error('Erreur récupération users:', error);
    res.status(500).json({
      success: false,
      message: "Erreur récupération users",
      error: error.message,
      stack: error.stack
    });
  }
});

// 3. Créer un utilisateur admin de test (corrigé)
router.post("/debug/create-admin", async (req, res) => {
  if (!db) {
    return res.status(500).json({
      success: false,
      message: "Module DB non disponible",
      error: "db is not defined"
    });
  }

  try {
    console.log('🔄 Création utilisateur admin de test...');

    // Supprimer l'ancien admin s'il existe
    console.log('Suppression ancien admin...');
    await db.execute('DELETE FROM users WHERE email = ?', ['admin@drivncook.com']);

    // Créer le nouveau hash
    console.log('Génération hash...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Nouveau hash créé:', hashedPassword.substring(0, 30) + '...');

    // Insérer le nouvel admin
    console.log('Insertion nouvel admin...');
    const insertResult = await db.execute(`
      INSERT INTO users (email, password, first_name, last_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, ['admin@drivncook.com', hashedPassword, 'Admin', 'System', 'admin', 1]);

    console.log('Résultat insertion:', insertResult);

    // Gérer le format de retour
    let insertId;
    if (insertResult && insertResult.insertId) {
      insertId = insertResult.insertId;
    } else if (Array.isArray(insertResult) && insertResult[0] && insertResult[0].insertId) {
      insertId = insertResult[0].insertId;
    } else {
      insertId = 'ID non récupéré';
    }

    console.log('Admin créé avec ID:', insertId);

    // Vérifier que ça marche
    const testCompare = await bcrypt.compare('admin123', hashedPassword);
    console.log('Test hash:', testCompare);

    res.json({
      success: true,
      message: "Admin créé avec succès",
      data: {
        insertId: insertId,
        hashedPassword: hashedPassword,
        testCompare: testCompare,
        debug: {
          insertResultType: typeof insertResult,
          insertResult: insertResult
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({
      success: false,
      message: "Erreur création admin",
      error: error.message,
      stack: error.stack
    });
  }
});

// 4. Login debug avec logs détaillés (corrigé)
router.post("/debug/login", async (req, res) => {
  if (!db) {
    return res.status(500).json({
      success: false,
      message: "Module DB non disponible",
      error: "db is not defined"
    });
  }

  try {
    const { email, password } = req.body;

    console.log('=== DEBUG LOGIN START ===');
    console.log('Email:', email);
    console.log('Password:', password);

    // Étape 1: Vérifier les données
    if (!email || !password) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis"
      });
    }

    // Étape 2: Chercher l'utilisateur
    console.log('🔍 Recherche utilisateur...');
    const userResult = await db.execute(
        'SELECT id, email, password, first_name, last_name, role, is_verified FROM users WHERE email = ?',
        [email]
    );

    console.log('Résultat brut recherche:', userResult);

    // Gérer le format de retour
    let users;
    if (Array.isArray(userResult)) {
      users = userResult;
    } else if (userResult[0] && Array.isArray(userResult[0])) {
      users = userResult[0];
    } else {
      users = userResult ? [userResult] : [];
    }

    console.log('👥 Utilisateurs trouvés:', users.length);

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    const user = users[0];
    console.log('👤 Utilisateur:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Étape 3: Vérifier le mot de passe
    console.log('🔐 Vérification mot de passe...');
    console.log('Hash en BDD (30 premiers chars):', user.password ? user.password.substring(0, 30) + '...' : 'NULL');

    let isPasswordValid = false;

    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('✅ Résultat bcrypt.compare:', isPasswordValid);
    } catch (bcryptError) {
      console.log('❌ Erreur bcrypt:', bcryptError.message);
      return res.status(500).json({
        success: false,
        message: "Erreur de vérification du mot de passe",
        error: bcryptError.message
      });
    }

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');

      // Test supplémentaire pour debug
      console.log('🧪 Test génération nouveau hash...');
      try {
        const newHash = await bcrypt.hash(password, 10);
        const newTest = await bcrypt.compare(password, newHash);
        console.log('🧪 Nouveau hash fonctionne:', newTest);
      } catch (e) {
        console.log('🧪 Erreur test hash:', e.message);
      }

      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
        debug: {
          passwordProvided: password,
          hashPreview: user.password ? user.password.substring(0, 30) + '...' : 'NULL'
        }
      });
    }

    // Étape 4: Vérifier si vérifié
    if (!user.is_verified) {
      console.log('❌ Utilisateur non vérifié');
      return res.status(401).json({
        success: false,
        message: "Compte non vérifié"
      });
    }

    // Étape 5: Générer le token
    console.log('🎫 Génération token...');
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'driv-n-cook-secret-key-2024',
        { expiresIn: '24h' }
    );

    console.log('✅ LOGIN RÉUSSI');
    console.log('=== DEBUG LOGIN END ===');

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.log('❌ ERREUR GLOBALE:', error);
    console.log('=== DEBUG LOGIN END (ERROR) ===');
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
      stack: error.stack
    });
  }
});

// Route de test de connexion manuelle sans config/db.js
router.post("/debug/manual-db-test", async (req, res) => {
  try {
    const mysql = require('mysql2/promise');

    // Configuration directe depuis les variables d'environnement
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'driv_n_cook',
      port: process.env.DB_PORT || 3306
    };

    console.log('Test connexion manuelle avec config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('SELECT 1 as test');
    await connection.end();

    res.json({
      success: true,
      message: "Connexion DB manuelle réussie",
      data: result,
      config_used: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur connexion DB manuelle",
      error: error.message
    });
  }
});

// Instructions d'utilisation
console.log('🔧 ROUTES DEBUG DISPONIBLES :');
console.log('1. GET  /api/auth/debug/db-info     - Diagnostic fichiers DB');
console.log('2. GET  /api/auth/debug/db-test     - Test connexion DB');
console.log('3. GET  /api/auth/debug/users       - Lister utilisateurs');
console.log('4. POST /api/auth/debug/create-admin - Créer admin');
console.log('5. POST /api/auth/debug/login       - Test login debug');
console.log('6. POST /api/auth/debug/manual-db-test - Test DB manuel');

module.exports = router;