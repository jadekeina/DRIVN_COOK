const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

require("dotenv").config();

// Middleware CORS
app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173",
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

// Logger global
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

// Route de test racine
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Driv'n Cook - Serveur en fonctionnement",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      franchises: "/api/franchises",
      candidatures: "/api/candidatures",
      contract: "/api/contract",
    },
  });
});

// Route de test email
app.get("/api/test-email", async (req, res) => {
  try {
    const emailService = require(path.join(__dirname, "services/email.Service"));
    const testCandidature = {
      prenom: "Test",
      nom: "Utilisateur",
      email: "jade.keina@gmail.com",
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
}

// ROUTES FRANCHISE
try {
  console.log("Chargement des routes franchise...");
  const franchiseRoutes = require("./routes/franchise/index");

  if (franchiseRoutes) {
    app.use("/api/franchises", franchiseRoutes);
    app.use("/api/franchise", franchiseRoutes);
    console.log("Routes franchise montées sur /api/franchises + alias /api/franchise");
  } else {
    console.error("franchiseRoutes est undefined");
  }
} catch (error) {
  console.error("Erreur routes franchise:", error.message);
}

// ROUTES CANDIDATURES
try {
  console.log("Chargement des routes candidatures...");
  const candidatureRoutes = require("./routes/Auth/candidature");
  app.use("/api/candidatures", candidatureRoutes);
  console.log("Routes candidatures montées sur /api/candidatures");
} catch (error) {
  console.error("Erreur routes candidatures:", error.message);
}

// ROUTES ACTIVATION
try {
  console.log("Chargement des routes d'activation...");
  const activationRoutes = require("./routes/Auth/activation");
  app.use("/api/activation", activationRoutes);
  console.log("Routes d'activation montées sur /api/activation");
} catch (error) {
  console.error("Erreur routes activation:", error.message);
}

// ROUTES DE GESTION DES FRANCHISES
try {
  console.log('Chargement des routes de gestion des franchises...');
  const franchiseManagementRoutes = require('./routes/Auth/franchiseManagement');
  app.use('/api/admin', franchiseManagementRoutes);
  console.log('Routes de gestion des franchises montées sur /api/admin');
} catch (error) {
  console.error('Erreur routes gestion franchises:', error.message);
}

// ROUTES FINANCE
try {
  console.log('Chargement des routes finance...');
  const financeRoutes = require('./routes/finance/index');
  app.use('/api/finance', financeRoutes);
  console.log('Routes finance montées sur /api/finance');
} catch (error) {
  console.error('Erreur routes finance:', error.message);
}

// ROUTES REDEVANCES
try {
  console.log('Chargement des routes redevances...');
  const redevancesRoutes = require('./routes/finance/redevanceRoutes');
  app.use('/api/redevances', redevancesRoutes);
  console.log('Routes redevances montées sur /api/redevances');
} catch (error) {
  console.error('Erreur routes redevances:', error.message);
}

// ROUTES DROITS D'ENTRÉE
try {
  console.log('Chargement des routes droits d\'entrée...');
  const droitsEntreeRoutes = require('./routes/finance/droitEntreeRoutes');
  app.use('/api/droits-entree', droitsEntreeRoutes);
  console.log('Routes droits d\'entrée montées sur /api/droits-entree');
} catch (error) {
  console.error('Erreur routes droits d\'entrée:', error.message);
}

// ROUTES COMMANDES ET STOCK
try {
  console.log('Chargement des routes commande et stock...');
  const commandeRoutes = require('./routes/Commande/commandeRoutes');
  app.use('/api/commandes', commandeRoutes);

  const stockRoutes = require('./routes/Commande/stockRoutes');
  app.use('/api/stocks', stockRoutes);

  console.log('Routes commande et stock montées avec succès');
} catch (error) {
  console.error('Erreur routes commande/stock:', error.message);
}




console.log('Ajout des routes de contrat avec modèle...');

// Route pour afficher le contrat
app.get('/api/contract/view/:token', (req, res) => {
  try {
    const { token } = req.params;
    console.log('[CONTRACT] GET /api/contract/view/' + token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token manquant"
      });
    }


    const Contract = require('./models/contract');

    Contract.getCandidatureByToken(token, (err, candidature) => {
      if (err) {
        console.error('Erreur récupération candidature:', err);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (!candidature) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }

      res.json({
        success: true,
        data: {
          candidature: {
            prenom: candidature.prenom,
            nom: candidature.nom,
            email: candidature.email,
            zone: candidature.zone,
            ville: candidature.ville,
            telephone: candidature.telephone
          },
          token: token
        }
      });
    });

  } catch (error) {
    console.error('Erreur contract view:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// Route pour accepter le contrat et créer session Stripe
app.post('/api/contract/accept/:token', (req, res) => {
  try {
    const { token } = req.params;
    console.log('[CONTRACT] POST /api/contract/accept/' + token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token manquant"
      });
    }

    // CORRECTION: Utiliser le modèle Contract
    const Contract = require('./models/contract');


    Contract.getCandidatureByToken(token, async (err, candidature) => {
      if (err) {
        console.error('Erreur récupération candidature:', err);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (!candidature) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }

      try {
        // Configuration Stripe
        if (!process.env.STRIPE_SECRET_KEY) {
          console.error('STRIPE_SECRET_KEY manquante');
          return res.status(500).json({
            success: false,
            message: "Configuration Stripe manquante"
          });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Créer session Stripe
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Droit d\'entrée franchise Driv\'n Cook',
                description: `Franchise ${candidature.zone} - ${candidature.ville}`,
              },
              unit_amount: 5000000, // 50000 euros en centimes
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?token=${token}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contract/${token}`,
          metadata: {
            activation_token: token,
            candidature_id: candidature.candidature_id.toString(),
            candidate_email: candidature.email
          },
          customer_email: candidature.email
        });

        res.json({
          success: true,
          checkout_url: session.url,
          session_id: session.id
        });

      } catch (stripeError) {
        console.error('Erreur création session Stripe:', stripeError);
        res.status(500).json({
          success: false,
          message: "Erreur lors de la création de la session de paiement"
        });
      }
    });
  } catch (error) {
    console.error('Erreur acceptation contrat:', error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
});

// Webhook Stripe pour mettre à jour le payment_status
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement de paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const activationToken = session.metadata.activation_token;
    const candidateEmail = session.metadata.candidate_email;

    // Mettre à jour le payment_status
    const updateQuery = `
            UPDATE users 
            SET payment_status = 'franchise_payment_completed',
                franchise_payment_completed_at = NOW(),
                franchise_payment_method = 'Stripe'
            WHERE email = ? AND role = 'franchise_owner'
        `;

    db.execute(updateQuery, [candidateEmail])
        .then(() => {
          console.log('Payment status mis à jour pour:', candidateEmail);
        })
        .catch(err => {
          console.error('Erreur mise à jour payment_status:', err);
        });
  }

  res.json({received: true});
});

// Route pour vérifier le succès du paiement
app.get('/api/contract/payment-success/:token', (req, res) => {
  try {
    const { token } = req.params;
    console.log('[CONTRACT] GET /api/contract/payment-success/' + token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token manquant"
      });
    }

    // CORRECTION: Utiliser le modèle Contract
    const Contract = require('./models/contract');

    Contract.getCandidatureByToken(token, (err, candidature) => {
      if (err) {
        console.error('Erreur récupération candidature:', err);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (!candidature) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }

      res.json({
        success: true,
        data: {
          candidature: {
            prenom: candidature.prenom,
            nom: candidature.nom,
            email: candidature.email,
            zone: candidature.zone,
            ville: candidature.ville
          },
          token: token,
          can_create_password: true
        }
      });
    });
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
});

// Route pour créer le mot de passe après paiement
app.post('/api/contract/create-password/:token', (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log('[CONTRACT] POST /api/contract/create-password/' + token);

    // Validations
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe et confirmation requis"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit faire au moins 6 caractères"
      });
    }

    // CORRECTION: Utiliser le modèle Contract
    const Contract = require('./models/contract');

    Contract.getCandidatureByToken(token, (err, candidature) => {
      if (err) {
        console.error('Erreur récupération candidature:', err);
        return res.status(500).json({
          success: false,
          message: "Erreur serveur"
        });
      }

      if (!candidature) {
        return res.status(400).json({
          success: false,
          message: "Token invalide ou expiré"
        });
      }

      // Vérifier si l'utilisateur existe déjà
      Contract.checkUserExists(candidature.email, (checkErr, exists) => {
        if (checkErr) {
          console.error('Erreur vérification utilisateur:', checkErr);
          return res.status(500).json({
            success: false,
            message: "Erreur serveur"
          });
        }

        if (exists) {
          return res.status(409).json({
            success: false,
            message: "Un compte existe déjà pour cet email"
          });
        }

        // Hasher le mot de passe
        const bcrypt = require('bcryptjs');
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Erreur hash mot de passe:', hashErr);
            return res.status(500).json({
              success: false,
              message: "Erreur lors de la création du mot de passe"
            });
          }

          // Créer l'utilisateur
          const userData = {
            email: candidature.email,
            password: hashedPassword,
            first_name: candidature.prenom,
            last_name: candidature.nom,
            phone: candidature.telephone,
            assigned_zone: candidature.zone
          };

          Contract.createFranchiseUser(userData, (createErr, result) => {
            if (createErr) {
              console.error('Erreur création utilisateur:', createErr);
              return res.status(500).json({
                success: false,
                message: "Erreur lors de la création du compte"
              });
            }

            // Marquer le token comme utilisé
            Contract.markTokenAsUsed(token, (markErr) => {
              if (markErr) {
                console.error('Erreur marquage token:', markErr);
                // On continue quand même, l'utilisateur est créé
              }

              res.json({
                success: true,
                message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
                data: {
                  userId: result.insertId,
                  email: candidature.email,
                  name: `${candidature.prenom} ${candidature.nom}`
                }
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Erreur création mot de passe:', error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
});

console.log('Routes de contrat avec modèle ajoutées:');
console.log('  - GET  /api/contract/view/:token');
console.log('  - POST /api/contract/accept/:token');
console.log('  - GET  /api/contract/payment-success/:token');
console.log('  - POST /api/contract/create-password/:token');


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

// Afficher toutes les routes (optionnel)
try {
  const listRoutes = require("express-list-endpoints");
  console.log("Routes enregistrées :");
  console.table(listRoutes(app));
} catch (error) {
  console.log("express-list-endpoints non installé (optionnel)");
}

// 404 handler - PLACÉ AVANT LES ROUTES DE DIAGNOSTIC
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée: " + req.originalUrl,
    availableRoutes: [
      "GET /",
      "GET /api/contract/view/:token",
      "POST /api/contract/accept/:token",
      "GET /api/contract/payment-success/:token",
      "POST /api/contract/create-password/:token",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/profile",
      "PUT /api/auth/profile",
      "GET /api/auth/verify-token",
      "POST /api/auth/logout",
      "GET /api/franchises",
      "POST /api/franchises",
      "POST /api/candidatures",
      "GET /api/candidatures (admin)",
      "GET /api/finance/test",
      "GET /api/finance/franchises",
      "GET /api/redevances",
      "GET /api/droits-entree"
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);

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
    error: process.env.NODE_ENV === "development" ? err.message : "Une erreur s'est produite",
  });
});

const PORT = process.env.PORT || 3002;

console.log("Démarrage du serveur...");

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
  console.log(`URL de test: http://localhost:${PORT}/`);
  console.log(`Routes contract: http://localhost:${PORT}/api/contract/view/TOKEN`);
  console.log("Routes principales disponibles:");
  console.log("   GET  /api/contract/view/:token");
  console.log("   POST /api/contract/accept/:token");
  console.log("   GET  /api/contract/payment-success/:token");
  console.log("   POST /api/contract/create-password/:token");
  console.log("   POST /api/candidatures");
  console.log("   POST /api/auth/login");
  console.log("   GET  /api/franchises");
});

module.exports = app;