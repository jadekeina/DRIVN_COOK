const express = require('express');
const cors = require('cors');
const path = require('path'); // AJOUT DE L'IMPORT PATH
const app = express();

require('dotenv').config();

// Middleware CORS pour permettre les requêtes depuis le frontend
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',  // Ton site client
        'http://localhost:5173',  // Ton admin (Vite par défaut)
        'http://localhost:5174',  // Au cas où tu changes de port
        'http://localhost:4173'   // Vite preview
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('Début du chargement...');

// Logger global (à placer après l'initialisation d'app et avant les routes)
app.use((req, res, next) => {
  const start = Date.now();
  console.log('[REQ]', { method: req.method, url: req.originalUrl, query: req.query, body: req.body, origin: req.headers.origin });
  res.on('finish', () => {
    console.log('[RES]', { method: req.method, url: req.originalUrl, status: res.statusCode, durationMs: Date.now() - start });
  });
  next();
});

// Test de la connexion DB
try {
    console.log('Chargement de la config DB...');
    const db = require('./config/db');
    console.log('Config DB chargée');
} catch (error) {
    console.error('Erreur config DB:', error.message);
}

// Route de test
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Driv\'n Cook - Serveur en fonctionnement',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            franchises: '/api/franchises',
            candidatures: '/api/candidatures'
        }
    });
});

app.get('/api/test-email', async (req, res) => {
    try {
        // Dans la route /api/test-email
        const emailService = require(path.join(__dirname, 'services/email.Service'));

        // Test avec une candidature fictive
        const testCandidature = {
            prenom: 'Test',
            nom: 'Utilisateur',
            email: 'jade.keina@gmail.com', // REMPLACE par ton email
            zone: 'urbaine',
            ville: 'Paris',
            telephone: '0123456789'
        };

        await emailService.sendAcceptanceEmail(testCandidature);

        res.json({
            success: true,
            message: 'Email de test envoyé ! Vérifie ta boîte mail.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur : ' + error.message
        });
    }
});

console.log('Chargement des routes...');

// ROUTES D'AUTHENTIFICATION
try {
    console.log('Chargement des routes d\'authentification...');
    const authRoutes = require('./routes/Auth/auth');
    app.use('/api/auth', authRoutes);
    console.log('Routes d\'authentification montées sur /api/auth');
} catch (error) {
    console.error('Erreur routes d\'authentification:', error.message);
    console.error('Stack:', error.stack);
}

// ROUTES FRANCHISE
try {
    console.log('Chargement des routes franchise...');
    const franchiseRoutes = require('./routes/franchise');

    if (franchiseRoutes) {
        app.use('/api/franchises', (req, res, next) => { console.log('[MOUNT]/api/franchises', req.method, req.originalUrl); next(); }, franchiseRoutes);
        // Alias pour supporter l’URL utilisée
        app.use('/api/franchise', (req, res, next) => { console.log('[MOUNT]/api/franchise', req.method, req.originalUrl); next(); }, franchiseRoutes);
        console.log('Routes franchise montées sur /api/franchises + alias /api/franchise');
    } else {
        console.error('franchiseRoutes est undefined');
    }
} catch (error) {
    console.error('Erreur routes franchise:', error.message);
    console.error('Stack:', error.stack);
}

// ROUTES CANDIDATURES
try {
    console.log('Chargement des routes candidatures...');
    const candidatureRoutes = require('./routes/Auth/candidature');
    app.use('/api/candidatures', candidatureRoutes);
    console.log('Routes candidatures montées sur /api/candidatures');
} catch (error) {
    console.error('Erreur routes candidatures:', error.message);
    console.error('Stack:', error.stack);
}

try {
    console.log('Chargement des routes d\'activation...');
    const activationRoutes = require('./routes/Auth/activation');
    app.use('/api/activation', activationRoutes);
    console.log('Routes d\'activation montées sur /api/activation');
} catch (error) {
    console.error('Erreur routes activation:', error.message);
    console.error('Stack:', error.stack);
}

// Routes de test simple (fallback)
app.get('/api/test-franchise', (req, res) => {
    res.json({
        success: true,
        message: 'Route franchise de test',
        data: []
    });
});

app.get('/api/test-candidature', (req, res) => {
    res.json({
        success: true,
        message: 'Route candidature de test',
        data: []
    });
});

// Afficher toutes les routes enregistrées (optionnel)
try {
    const listRoutes = require('express-list-endpoints');
    console.log('Routes enregistrées :');
    console.table(listRoutes(app));
} catch (error) {
    console.log('express-list-endpoints non installé (optionnel)');
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée: ' + req.originalUrl,
        availableRoutes: [
            'GET /',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/profile',
            'PUT /api/auth/profile',
            'GET /api/auth/verify-token',
            'POST /api/auth/logout',
            'GET /api/franchises',
            'POST /api/franchises',
            'GET /api/franchises/my/franchises',
            'POST /api/candidatures',
            'GET /api/candidatures (admin)',
            'GET /api/candidatures/stats (admin)',
            'GET /api/candidatures/:id (admin)',
            'PUT /api/candidatures/:id/status (admin)'
        ]
    });
});

// Error handler amélioré
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);

    // Erreur Multer (upload de fichiers)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'Fichier trop volumineux (max 5MB)'
        });
    }

    if (err.message && err.message.includes('Type de fichier non autorisé')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur s\'est produite'
    });
});

const PORT = process.env.PORT || 3002;

console.log('Démarrage du serveur...');

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
    console.log(`URL de test: http://localhost:${PORT}/`);
    console.log(`Routes auth: http://localhost:${PORT}/api/auth`);
    console.log(`Routes franchise: http://localhost:${PORT}/api/franchises`);
    console.log(`Routes candidature: http://localhost:${PORT}/api/candidatures`);
    console.log('Dossier uploads: ./uploads/');
    console.log('Routes disponibles:');
    console.log('   POST /api/candidatures - Soumettre candidature (public)');
    console.log('   POST /api/auth/register - Inscription');
    console.log('   POST /api/auth/login - Connexion');
    console.log('   GET /api/auth/profile - Profil utilisateur');
    console.log('   PUT /api/auth/profile - Mise à jour profil');
    console.log('   GET /api/franchises - Toutes les franchises');
    console.log('   POST /api/franchises - Créer franchise');
    console.log('   GET /api/candidatures - Toutes candidatures (admin)');
    console.log('   GET /api/candidatures/stats - Stats candidatures (admin)');
});



module.exports = app;