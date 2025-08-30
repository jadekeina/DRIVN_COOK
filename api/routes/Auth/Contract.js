const express = require("express");
const router = express.Router();
const ContractController = require("../../controllers/ContractController");
const { validationResult } = require("express-validator");

console.log("Chargement des routes contrat...");

// Route pour afficher le contrat
router.get("/view/:token", ContractController.viewContract);

// Route pour accepter le contrat et créer session Stripe
router.post("/accept/:token", ContractController.acceptContract);

// Route pour vérifier le succès du paiement
router.get("/payment-success/:token", ContractController.verifyPayment);

// Route pour créer le mot de passe après paiement
router.post("/create-password/:token", [
    // Validation middleware optionnel
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Erreurs de validation",
                errors: errors.array()
            });
        }
        next();
    }
], ContractController.createPassword);

// Webhook Stripe (si tu veux l'utiliser plus tard)
router.post("/stripe-webhook",
    express.raw({ type: 'application/json' }),
    ContractController.stripeWebhook
);

console.log("Routes contrat définies");

module.exports = router;