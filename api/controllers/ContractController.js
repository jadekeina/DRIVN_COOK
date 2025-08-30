const Contract = require("../models/contract");
const bcrypt = require("bcryptjs");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ContractController = {
    // Afficher les données du contrat
    viewContract: (req, res) => {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: "Token manquant"
                });
            }

            Contract.getCandidatureByToken(token, (err, candidature) => {
                if (err) {
                    console.error("Erreur récupération candidature:", err);
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
            console.error("Erreur dans viewContract:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur"
            });
        }
    },

    // Accepter le contrat et créer session Stripe
    acceptContract: (req, res) => {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: "Token manquant"
                });
            }

            Contract.getCandidatureByToken(token, async (err, candidature) => {
                if (err) {
                    console.error("Erreur récupération candidature:", err);
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
                    console.error("Erreur création session Stripe:", stripeError);
                    res.status(500).json({
                        success: false,
                        message: "Erreur lors de la création de la session de paiement"
                    });
                }
            });
        } catch (error) {
            console.error("Erreur dans acceptContract:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur"
            });
        }
    },

    // Vérifier le succès du paiement
    verifyPayment: (req, res) => {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: "Token manquant"
                });
            }

            Contract.getCandidatureByToken(token, (err, candidature) => {
                if (err) {
                    console.error("Erreur récupération candidature:", err);
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
            console.error("Erreur dans verifyPayment:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur"
            });
        }
    },

    // Créer le mot de passe après paiement
    createPassword: (req, res) => {
        try {
            const { token } = req.params;
            const { password, confirmPassword } = req.body;

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

            Contract.getCandidatureByToken(token, (err, candidature) => {
                if (err) {
                    console.error("Erreur récupération candidature:", err);
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
                        console.error("Erreur vérification utilisateur:", checkErr);
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
                    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                        if (hashErr) {
                            console.error("Erreur hash mot de passe:", hashErr);
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
                                console.error("Erreur création utilisateur:", createErr);
                                return res.status(500).json({
                                    success: false,
                                    message: "Erreur lors de la création du compte"
                                });
                            }

                            // Marquer le token comme utilisé
                            Contract.markTokenAsUsed(token, (markErr) => {
                                if (markErr) {
                                    console.error("Erreur marquage token:", markErr);
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
            console.error("Erreur dans createPassword:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur"
            });
        }
    },

    // Webhook Stripe (optionnel)
    stripeWebhook: (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const activationToken = session.metadata.activation_token;

            console.log('Paiement confirmé pour token:', activationToken);

            // Optionnel: mettre à jour le statut de paiement
            Contract.updatePaymentStatus(activationToken, true, (err) => {
                if (err) {
                    console.error('Erreur mise à jour statut paiement:', err);
                }
            });
        }

        res.json({ received: true });
    }
};

module.exports = ContractController;