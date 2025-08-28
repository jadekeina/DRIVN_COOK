const express = require("express");
const cors = require("cors");
const path = require("path"); // AJOUT DE L'IMPORT PATH
const app = express();

require("dotenv").config();

// Middleware CORS pour permettre les requêtes depuis le frontend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000", // Ton site client
      "http://localhost:5173", // Ton admin (Vite par défaut)
      "http://localhost:5174", // Au cas où tu changes de port
      "http://localhost:4173", // Vite preview
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log("Début du chargement...");

// Logger global (à placer après l'initialisation d'app et avant les routes)
app.use((req, res, next) => {
  const start = Date.now();
  console.log("[REQ]", {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    origin: req.headers.origin,
  });
  res.on("finish", () => {
    console.log("[RES]", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

// Test de la connexion DB
try {
  console.log("Chargement de la config DB...");
  const db = require("./config/db");
  console.log("Config DB chargée");
} catch (error) {
  console.error("Erreur config DB:", error.message);
}

// Route de test
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Driv'n Cook - Serveur en fonctionnement",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      franchises: "/api/franchises",
      candidatures: "/api/candidatures",
    },
  });
});

app.get("/api/test-email", async (req, res) => {
  try {
    // Dans la route /api/test-email
    const emailService = require(
      path.join(__dirname, "services/email.Service"),
    );

    // Test avec une candidature fictive
    const testCandidature = {
      prenom: "Test",
      nom: "Utilisateur",
      email: "jade.keina@gmail.com", // REMPLACE par ton email
      zone: "urbaine",
      ville: "Paris",
      telephone: "0123456789",
    };

    await emailService.sendAcceptanceEmail(testCandidature);

    res.json({
      success: true,
      message: "Email de test envoyé ! Vérifie ta boîte mail.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur : " + error.message,
    });
  }
});

console.log("Chargement des routes...");

// ROUTES D'AUTHENTIFICATION
try {
  console.log("Chargement des routes d'authentification...");
  const authRoutes = require("./routes/Auth/auth");
  app.use("/api/auth", authRoutes);
  console.log("Routes d'authentification montées sur /api/auth");
} catch (error) {
  console.error("Erreur routes d'authentification:", error.message);
  console.error("Stack:", error.stack);
}

// ROUTES FRANCHISE
try {
  console.log("Chargement des routes franchise...");
  const franchiseRoutes = require("./routes/franchise");

  if (franchiseRoutes) {
    app.use(
      "/api/franchises",
      (req, res, next) => {
        console.log("[MOUNT]/api/franchises", req.method, req.originalUrl);
        next();
      },
      franchiseRoutes,
    );
    // Alias pour supporter l’URL utilisée
    app.use(
      "/api/franchise",
      (req, res, next) => {
        console.log("[MOUNT]/api/franchise", req.method, req.originalUrl);
        next();
      },
      franchiseRoutes,
    );
    console.log(
      "Routes franchise montées sur /api/franchises + alias /api/franchise",
    );
  } else {
    console.error("franchiseRoutes est undefined");
  }
} catch (error) {
  console.error("Erreur routes franchise:", error.message);
  console.error("Stack:", error.stack);
}

// ROUTES CANDIDATURES
try {
  console.log("Chargement des routes candidatures...");
  const candidatureRoutes = require("./routes/Auth/candidature");
  app.use("/api/candidatures", candidatureRoutes);
  console.log("Routes candidatures montées sur /api/candidatures");
} catch (error) {
  console.error("Erreur routes candidatures:", error.message);
  console.error("Stack:", error.stack);
}

try {
  console.log("Chargement des routes d'activation...");
  const activationRoutes = require("./routes/Auth/activation");
  app.use("/api/activation", activationRoutes);
  console.log("Routes d'activation montées sur /api/activation");
} catch (error) {
  console.error("Erreur routes activation:", error.message);
  console.error("Stack:", error.stack);
}

// ROUTES DE GESTION DES FRANCHISES (NOUVEAU)
try {
  console.log('Chargement des routes de gestion des franchises...');
  const franchiseManagementRoutes = require('./routes/Auth/franchiseManagement');
  app.use('/api/admin', franchiseManagementRoutes);
  console.log('Routes de gestion des franchises montées sur /api/admin');
} catch (error) {
  console.error('Erreur routes gestion franchises:', error.message);
  console.error('Stack:', error.stack);
}

// Routes de test simple (fallback)
app.get("/api/test-franchise", (req, res) => {
  res.json({
    success: true,
    message: "Route franchise de test",
    data: [],
  });
});

app.get("/api/test-candidature", (req, res) => {
  res.json({
    success: true,
    message: "Route candidature de test",
    data: [],
  });
});

try {
  console.log('Chargement des routes finance...');
  const financeRoutes = require('./routes/finance/index');
  app.use('/api/finance', financeRoutes);
  console.log('Routes finance montées sur /api/finance');
} catch (error) {
  console.error('Erreur routes finance:', error.message);
  console.error('Stack:', error.stack);
}

// ROUTES REDEVANCES (accès direct)
try {
  console.log('Chargement des routes redevances (accès direct)...');
  const redevancesRoutes = require('./routes/finance/redevanceRoutes');
  app.use('/api/redevances', redevancesRoutes);
  console.log('Routes redevances montées sur /api/redevances');
} catch (error) {
  console.error('Erreur routes redevances:', error.message);
}

// ROUTES DROITS D'ENTRÉE (accès direct)
try {
  console.log('Chargement des routes droits d\'entrée (accès direct)...');
  const droitsEntreeRoutes = require('./routes/finance/droitEntreeRoutes');
  app.use('/api/droits-entree', droitsEntreeRoutes);
  console.log('Routes droits d\'entrée montées sur /api/droits-entree');
} catch (error) {
  console.error('Erreur routes droits d\'entrée:', error.message);
}
// ==========================================
// AJOUTEZ CES LIGNES DANS VOTRE app.js
// ==========================================

// AJOUTEZ ce bloc APRÈS vos autres routes (après les routes finance) :

try {
  console.log('Chargement des routes commande et stock...');

  // Chargement des routes commandes
  const commandeRoutes = require('./routes/Commande/commandeRoutes');
  app.use('/api/commandes', commandeRoutes);
  console.log('Routes commandes montées sur /api/commandes');

  // Chargement des routes stocks
  const stockRoutes = require('./routes/Commande/stockRoutes');
  app.use('/api/stocks', stockRoutes);
  console.log('Routes stocks montées sur /api/stocks');

  console.log('Routes commande et stock montées avec succès');
} catch (error) {
  console.error('Erreur routes commande/stock:', error.message);
  console.error('Stack:', error.stack);
}


// Dans app.js, après les autres routes franchise
try {
  console.log('Chargement des routes d\'activation contrat...');
  const contractActivationRoutes = require('./routes/franchise/contractActivation');
  app.use('/api/franchise', contractActivationRoutes);
  console.log('Routes d\'activation contrat montées sur /api/franchise');
} catch (error) {
  console.error('Erreur routes activation contrat:', error.message);
}

// Ajoutez cette route pour tester que tout fonctionne :
app.get('/api/test-commande-stock', (req, res) => {
  res.json({
    success: true,
    message: 'APIs Commande et Stock opérationnelles',
    available_endpoints: {
      stocks: [
        'GET /api/stocks/test',
        'GET /api/stocks/articles',
        'POST /api/stocks/articles',
        'GET /api/stocks/articles/:id'
      ],
      commandes: [
        'GET /api/commandes/test',
        'GET /api/commandes/list',
        'POST /api/commandes',
        'PUT /api/commandes/:id/statut',
        'GET /api/commandes/franchises'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Afficher toutes les routes enregistrées (optionnel)
try {
  const listRoutes = require("express-list-endpoints");
  console.log("Routes enregistrées :");
  console.table(listRoutes(app));
} catch (error) {
  console.log("express-list-endpoints non installé (optionnel)");
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée: " + req.originalUrl,
    availableRoutes: [
      "GET /",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/profile",
      "PUT /api/auth/profile",
      "GET /api/auth/verify-token",
      "POST /api/auth/logout",
      "GET /api/franchises",
      "POST /api/franchises",
      "GET /api/franchises/my/franchises",
      "POST /api/candidatures",
      "GET /api/candidatures (admin)",
      "GET /api/candidatures/stats (admin)",
      "GET /api/candidatures/:id (admin)",
      "PUT /api/candidatures/:id/status (admin)",
      "GET /api/finance/test",
      "GET /api/finance/franchises",
      "GET /api/finance/franchises/:id",
      "GET /api/finance/stats",
      "POST /api/finance/franchises/:id/droit-entree",
      "GET /api/finance/franchises/:id/report",
      "GET /api/finance/redevances",
      "POST /api/finance/redevances/:franchiseeId/:mois/payer",
      "GET /api/finance/redevances/retards",
      "GET /api/finance/redevances/report",
      "GET /api/finance/droits-entree",
      "POST /api/finance/droits-entree/:franchiseeId/paiement",
      "GET /api/finance/droits-entree/retards",
      "GET /api/finance/droits-entree/report",
      // ACCÈS DIRECT AUX MODULES
      "GET /api/redevances",
      "GET /api/droits-entree"
    ],
  });
});

// Error handler amélioré
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);

  // Erreur Multer (upload de fichiers)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Fichier trop volumineux (max 5MB)",
    });
  }

  if (err.message && err.message.includes("Type de fichier non autorisé")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur s'est produite",
  });
});

// Dans votre app.js ou server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// AJOUTEZ CES ROUTES DE DIAGNOSTIC DANS VOTRE APP.JS
// Cela va nous dire exactement où est le problème

console.log('=== DIAGNOSTIC COMPLET DRIV\'N COOK ===');

// 1. ROUTE DE DIAGNOSTIC GÉNÉRAL
app.get('/api/diagnostic/full', async (req, res) => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    server: {
      status: 'running',
      port: process.env.PORT || 3002,
      node_version: process.version,
      uptime: process.uptime()
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      database_config: 'checking...'
    },
    routes: {
      auth_routes: 'checking...',
      finance_routes: 'checking...'
    },
    database: {
      connection: 'checking...',
      users_table: 'checking...'
    }
  };

  // Test de la base de données
  try {
    const db = require('./config/db');
    await db.execute('SELECT 1 as test');
    diagnostic.database.connection = '✅ OK';

    // Test table users
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
    diagnostic.database.users_table = `✅ OK (${users[0].count} utilisateurs)`;

    // Test admin user
    const [adminUsers] = await db.execute('SELECT id, email, is_verified FROM users WHERE email = ?', ['admin@drivncook.com']);
    diagnostic.database.admin_user = adminUsers.length > 0
        ? `✅ Trouvé (ID: ${adminUsers[0].id}, vérifié: ${adminUsers[0].is_verified})`
        : '❌ Admin non trouvé';

  } catch (dbError) {
    diagnostic.database.connection = `❌ ERREUR: ${dbError.message}`;
    diagnostic.database.error_details = dbError.stack;
  }

  // Test des routes
  try {
    const routes = [];
    function extractRoutes(stack, prefix = '') {
      stack.forEach(layer => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
          const path = layer.regexp.source
              .replace('\\', '')
              .replace('(?:', '')
              .replace(')', '')
              .replace('$', '')
              .replace('^', '');
          const newPrefix = prefix + path.replace(/\\\//g, '/');
          extractRoutes(layer.handle.stack, newPrefix);
        }
      });
    }

    extractRoutes(app._router.stack);

    const authRoutes = routes.filter(r => r.includes('/api/auth'));
    const financeRoutes = routes.filter(r => r.includes('/api/finance'));

    diagnostic.routes.auth_routes = `✅ ${authRoutes.length} routes trouvées`;
    diagnostic.routes.finance_routes = `✅ ${financeRoutes.length} routes trouvées`;
    diagnostic.routes.all_routes = routes;

  } catch (routeError) {
    diagnostic.routes.error = routeError.message;
  }

  res.json({
    success: true,
    diagnostic: diagnostic
  });
});

// 2. ROUTE DE TEST LOGIN SIMPLIFIÉ
app.post('/api/diagnostic/test-login', async (req, res) => {
  const { email, password } = req.body;
  const testResult = {
    timestamp: new Date().toISOString(),
    input: { email, password: password ? 'PROVIDED' : 'MISSING' },
    steps: []
  };

  try {
    // Étape 1: Validation
    testResult.steps.push({
      step: 1,
      name: 'Validation input',
      status: email && password ? '✅ OK' : '❌ FAIL',
      details: !email ? 'Email manquant' : !password ? 'Password manquant' : 'OK'
    });

    if (!email || !password) {
      return res.status(400).json({ success: false, testResult });
    }

    // Étape 2: Connexion DB
    let db;
    try {
      db = require('./config/db');
      await db.execute('SELECT 1');
      testResult.steps.push({
        step: 2,
        name: 'Connexion DB',
        status: '✅ OK'
      });
    } catch (dbError) {
      testResult.steps.push({
        step: 2,
        name: 'Connexion DB',
        status: '❌ FAIL',
        error: dbError.message
      });
      return res.status(500).json({ success: false, testResult });
    }

    // Étape 3: Recherche utilisateur
    let users;
    try {
      const result = await db.execute(
          'SELECT id, email, password, first_name, last_name, role, is_verified FROM users WHERE email = ?',
          [email]
      );
      users = result[0] || result;

      testResult.steps.push({
        step: 3,
        name: 'Recherche utilisateur',
        status: users.length > 0 ? '✅ OK' : '❌ FAIL',
        details: `${users.length} utilisateur(s) trouvé(s)`
      });
    } catch (queryError) {
      testResult.steps.push({
        step: 3,
        name: 'Recherche utilisateur',
        status: '❌ FAIL',
        error: queryError.message
      });
      return res.status(500).json({ success: false, testResult });
    }

    if (users.length === 0) {
      return res.status(401).json({ success: false, testResult });
    }

    const user = users[0];
    testResult.user_found = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      has_password: !!user.password,
      password_length: user.password ? user.password.length : 0
    };

    // Étape 4: Test bcrypt
    try {
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, user.password);

      testResult.steps.push({
        step: 4,
        name: 'Vérification mot de passe',
        status: isValid ? '✅ OK' : '❌ FAIL',
        details: `bcrypt.compare result: ${isValid}`
      });

      if (!isValid) {
        // Test avec un nouveau hash pour debug
        const newHash = await bcrypt.hash(password, 10);
        const newTest = await bcrypt.compare(password, newHash);
        testResult.bcrypt_debug = {
          new_hash_generated: newHash,
          new_hash_test: newTest,
          suggestion: 'Le hash en BDD pourrait être corrompu'
        };
      }
    } catch (bcryptError) {
      testResult.steps.push({
        step: 4,
        name: 'Vérification mot de passe',
        status: '❌ FAIL',
        error: bcryptError.message
      });
      return res.status(500).json({ success: false, testResult });
    }

    // Étape 5: Vérification compte vérifié
    testResult.steps.push({
      step: 5,
      name: 'Compte vérifié',
      status: user.is_verified ? '✅ OK' : '❌ FAIL',
      details: `is_verified: ${user.is_verified}`
    });

    // Étape 6: Génération token
    try {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'driv-n-cook-secret-key-2024',
          { expiresIn: '24h' }
      );

      testResult.steps.push({
        step: 6,
        name: 'Génération token',
        status: '✅ OK',
        token_preview: token.substring(0, 20) + '...'
      });
    } catch (jwtError) {
      testResult.steps.push({
        step: 6,
        name: 'Génération token',
        status: '❌ FAIL',
        error: jwtError.message
      });
    }

    res.json({
      success: true,
      testResult,
      conclusion: 'Test terminé - vérifiez les étapes ci-dessus'
    });

  } catch (globalError) {
    testResult.global_error = globalError.message;
    res.status(500).json({
      success: false,
      testResult
    });
  }
});

// 3. ROUTE POUR RECRÉER L'ADMIN
app.post('/api/diagnostic/recreate-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const db = require('./config/db');

    console.log('🔄 Recréation de l\'utilisateur admin...');

    // Supprimer l'ancien admin
    await db.execute('DELETE FROM users WHERE email = ?', ['admin@drivncook.com']);
    console.log('🗑️  Ancien admin supprimé');

    // Créer le nouveau hash
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Nouveau hash créé:', hashedPassword.substring(0, 30) + '...');

    // Insérer le nouvel admin
    const [result] = await db.execute(`
      INSERT INTO users (email, password, first_name, last_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, ['admin@drivncook.com', hashedPassword, 'Admin', 'System', 'admin', true]);

    console.log('✅ Nouvel admin créé avec ID:', result.insertId);

    // Test immédiat
    const testCompare = await bcrypt.compare('admin123', hashedPassword);
    console.log('🧪 Test du hash:', testCompare);

    res.json({
      success: true,
      message: 'Admin recréé avec succès',
      data: {
        admin_id: result.insertId,
        hash_test: testCompare,
        hash_preview: hashedPassword.substring(0, 30) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Erreur recréation admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recréation admin',
      error: error.message
    });
  }
});

// 4. ROUTE POUR BYPASS TEMPORAIRE
app.post('/api/diagnostic/bypass-login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@drivncook.com' && password === 'admin123') {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: 999, email: email, role: 'admin' },
        process.env.JWT_SECRET || 'driv-n-cook-secret-key-2024',
        { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Connexion bypass réussie',
      token,
      user: {
        id: 999,
        email: email,
        firstName: 'Admin',
        lastName: 'Bypass',
        role: 'admin'
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Bypass échoué'
  });
});

// 5. ROUTE D'INFORMATION SYSTÈME
app.get('/api/diagnostic/system-info', (req, res) => {
  const os = require('os');
  const fs = require('fs');
  const path = require('path');

  res.json({
    success: true,
    system: {
      platform: os.platform(),
      node_version: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB'
      },
      uptime: process.uptime() + ' seconds'
    },
    files: {
      config_db_exists: fs.existsSync(path.join(__dirname, 'config/db.js')),
      auth_controller_exists: fs.existsSync(path.join(__dirname, 'controllers/authController.js')),
      auth_routes_exists: fs.existsSync(path.join(__dirname, 'routes/Auth/auth.js')),
      package_json: fs.existsSync(path.join(__dirname, 'package.json'))
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not_set',
      PORT: process.env.PORT || 'not_set',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET'
    }
  });
});

// DIAGNOSTIC COMPLET POUR LE PROBLÈME DE LOGIN
// Ajoutez ces routes temporaires dans votre app.js pour diagnostiquer

// 1. Route pour tester la base de données directement
app.get('/api/debug/check-admin', async (req, res) => {
  try {
    const db = require('./config/db');

    // Vérifier la connexion DB
    await db.execute('SELECT 1 as test');
    console.log('✅ Connexion DB OK');

    // Chercher l'admin
    const [users] = await db.execute(
        'SELECT id, email, password, first_name, last_name, role, is_verified, created_at FROM users WHERE email = ?',
        ['admin@drivncook.com']
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: 'Aucun utilisateur admin trouvé',
        solution: 'Vous devez recréer l\'utilisateur admin'
      });
    }

    const user = users[0];

    // Tester le hash du mot de passe
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare('admin123', user.password);

    res.json({
      success: true,
      user_found: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
        password_hash_preview: user.password.substring(0, 30) + '...',
        password_length: user.password.length
      },
      password_test: {
        is_valid: isValidPassword,
        test_performed: 'bcrypt.compare("admin123", stored_hash)'
      },
      diagnosis: isValidPassword ?
          'Le hash fonctionne correctement' :
          'Le hash est corrompu ou incorrect'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// 2. Route pour recréer l'admin si nécessaire
app.post('/api/debug/recreate-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const db = require('./config/db');

    console.log('🔄 Suppression de l\'ancien admin...');
    await db.execute('DELETE FROM users WHERE email = ?', ['admin@drivncook.com']);

    console.log('🔐 Création du nouveau hash...');
    const newHash = await bcrypt.hash('admin123', 10);

    console.log('👤 Insertion du nouvel admin...');
    const [result] = await db.execute(`
      INSERT INTO users (email, password, first_name, last_name, role, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, ['admin@drivncook.com', newHash, 'Admin', 'System', 'admin', 1]);

    // Test immédiat du nouveau hash
    const testHash = await bcrypt.compare('admin123', newHash);

    res.json({
      success: true,
      message: 'Admin recréé avec succès',
      admin_id: result.insertId,
      hash_test: testHash,
      next_step: 'Testez maintenant la connexion normale'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. Route de test login simplifiée
app.post('/api/debug/test-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const db = require('./config/db');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    console.log('🔍 Test login pour:', email);

    // Étape 1: Chercher l'utilisateur
    const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
        step_failed: 'user_lookup'
      });
    }

    const user = users[0];
    console.log('👤 Utilisateur trouvé:', user.email, 'Role:', user.role);

    // Étape 2: Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Test mot de passe:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect',
        step_failed: 'password_verification',
        debug: {
          password_provided: password,
          hash_preview: user.password.substring(0, 30) + '...'
        }
      });
    }

    // Étape 3: Vérifier que le compte est vérifié
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Compte non vérifié',
        step_failed: 'account_verification'
      });
    }

    // Étape 4: Générer le token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'driv-n-cook-secret-key-2024',
        { expiresIn: '24h' }
    );

    console.log('✅ Login réussi pour:', user.email);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isVerified: user.is_verified
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur login test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// 4. Route pour vérifier la route auth originale
app.get('/api/debug/check-routes', (req, res) => {
  const routes = [];

  function extractRoutes(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        routes.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const path = layer.regexp.source
            .replace('\\', '')
            .replace('(?:', '')
            .replace(')', '')
            .replace('$', '')
            .replace('^', '');
        const newPrefix = prefix + path.replace(/\\\//g, '/');
        extractRoutes(layer.handle.stack, newPrefix);
      }
    });
  }

  // DIAGNOSTIC COMPLET DES CHEMINS - Ajoutez ceci dans app.js

  app.get('/api/debug/finance-paths', (req, res) => {
    const path = require('path');
    const fs = require('fs');

    const paths = {
      current_dir: __dirname,
      finance_index: path.join(__dirname, 'routes/finance/index.js'),
      finance_routes: path.join(__dirname, 'routes/finance/financeRoutes.js'),
      finance_controller: path.join(__dirname, 'controllers/finance/financeController.js'),
      auth_middleware: path.join(__dirname, 'middleware/auth.js')
    };

    const checks = {};
    Object.keys(paths).forEach(key => {
      checks[key] = {
        path: paths[key],
        exists: fs.existsSync(paths[key]),
        type: fs.existsSync(paths[key]) ?
            (fs.statSync(paths[key]).isDirectory() ? 'directory' : 'file') : 'missing'
      };
    });

    // Test des imports
    const imports = {};
    try {
      imports.finance_controller = require('./controllers/finance/financeController');
      imports.finance_controller_type = typeof imports.finance_controller;
      imports.finance_controller_methods = Object.keys(imports.finance_controller);
    } catch (e) {
      imports.finance_controller_error = e.message;
    }

    try {
      imports.auth_middleware = require('./middleware/auth');
      imports.auth_middleware_type = typeof imports.auth_middleware;
    } catch (e) {
      imports.auth_middleware_error = e.message;
    }

    try {
      imports.finance_routes = require('./routes/finance/index');
      imports.finance_routes_type = typeof imports.finance_routes;
    } catch (e) {
      imports.finance_routes_error = e.message;
    }

    res.json({
      success: true,
      data: {
        paths: checks,
        imports: imports,
        cwd: process.cwd()
      }
    });
  });

// Route de test des middleware
  app.get('/api/debug/middleware-test', (req, res) => {
    console.log('Test middleware - requête reçue');

    try {
      const auth = require('./middleware/auth');
      res.json({
        success: true,
        message: 'Middleware auth chargé',
        auth_type: typeof auth,
        has_authenticate: typeof auth.authenticateToken
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur middleware',
        error: error.message
      });
    }
  });

  extractRoutes(app._router.stack);

  const authRoutes = routes.filter(r => r.includes('/api/auth'));

  res.json({
    success: true,
    all_routes: routes,
    auth_routes: authRoutes,
    login_route_exists: authRoutes.some(r => r.includes('POST') && r.includes('/login')),
    diagnosis: authRoutes.length > 0 ? 'Routes auth chargées' : 'Routes auth manquantes'
  });
});

// INSTRUCTIONS D'UTILISATION :
console.log('🔧 ROUTES DE DIAGNOSTIC AJOUTÉES :');
console.log('1. GET  /api/debug/check-admin     - Vérifier l\'utilisateur admin');
console.log('2. POST /api/debug/recreate-admin  - Recréer l\'admin si nécessaire');
console.log('3. POST /api/debug/test-login      - Tester le login manuellement');
console.log('4. GET  /api/debug/check-routes    - Vérifier les routes chargées');
console.log('');
console.log('📋 ORDRE DE DIAGNOSTIC :');
console.log('1. Testez: http://localhost:3002/api/debug/check-admin');
console.log('2. Si problème, utilisez: POST /api/debug/recreate-admin');
console.log('3. Testez: POST /api/debug/test-login avec admin@drivncook.com / admin123');
console.log('4. Si ça marche, le problème est dans votre route auth originale');

console.log('✅ Routes de diagnostic ajoutées:');
console.log('  - GET  /api/diagnostic/full');
console.log('  - POST /api/diagnostic/test-login');
console.log('  - POST /api/diagnostic/recreate-admin');
console.log('  - POST /api/diagnostic/bypass-login');
console.log('  - GET  /api/diagnostic/system-info');
console.log('');
console.log('🔍 Pour diagnostiquer:');
console.log('  1. GET http://localhost:3002/api/diagnostic/full');
console.log('  2. POST http://localhost:3002/api/diagnostic/test-login (avec email/password)');
console.log('  3. POST http://localhost:3002/api/diagnostic/recreate-admin (si nécessaire)');
console.log('=========================================');

const PORT = process.env.PORT || 3002;

console.log("Démarrage du serveur...");

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
  console.log(`URL de test: http://localhost:${PORT}/`);
  console.log(`Routes auth: http://localhost:${PORT}/api/auth`);
  console.log(`Routes franchise: http://localhost:${PORT}/api/franchises`);
  console.log(`Routes candidature: http://localhost:${PORT}/api/candidatures`);
  console.log("Dossier uploads: ./uploads/");
  console.log("Routes disponibles:");
  console.log("   POST /api/candidatures - Soumettre candidature (public)");
  console.log("   POST /api/auth/register - Inscription");
  console.log("   POST /api/auth/login - Connexion");
  console.log("   GET /api/auth/profile - Profil utilisateur");
  console.log("   PUT /api/auth/profile - Mise à jour profil");
  console.log("   GET /api/franchises - Toutes les franchises");
  console.log("   POST /api/franchises - Créer franchise");
  console.log("   GET /api/candidatures - Toutes candidatures (admin)");
  console.log("   GET /api/candidatures/stats - Stats candidatures (admin)");
  console.log("   GET /api/finance/franchises - Données financières franchisés");
  console.log("   GET /api/finance/stats - Statistiques financières globales");
  console.log("   GET /api/redevances - Gestion des redevances");
  console.log("   GET /api/droits-entree - Gestion des droits d'entrée");
});

module.exports = app;
