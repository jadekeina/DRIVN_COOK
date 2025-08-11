const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token d\'accès requis'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        req.userId = decoded.userId;
        next();
    });
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
    return (req, res, next) => {
        User.findById(req.userId, (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur serveur'
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }

            req.user = user;
            next();
        });
    };
};

// Middleware optionnel pour récupérer l'utilisateur si token présent
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (!err) {
            req.userId = decoded.userId;
        }
        next();
    });
};

module.exports = {
    authenticateToken,
    requireRole,
    optionalAuth
};