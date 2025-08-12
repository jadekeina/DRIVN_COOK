const { body } = require("express-validator");

const validators = {
  // Validation pour l'inscription
  register: [
    body("email").isEmail().normalizeEmail().withMessage("Email valide requis"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
    body("first_name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Le prénom doit contenir entre 2 et 50 caractères"),
    body("last_name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Le nom doit contenir entre 2 et 50 caractères"),
    body("role")
      .optional()
      .isIn(["customer", "franchise_owner", "admin"])
      .withMessage("Rôle invalide"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Numéro de téléphone invalide"),
  ],

  // Validation pour la connexion
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Email valide requis"),
    body("password").notEmpty().withMessage("Mot de passe requis"),
  ],

  // Validation pour la mise à jour du profil
  updateProfile: [
    body("first_name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Le prénom doit contenir entre 2 et 50 caractères"),
    body("last_name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Le nom doit contenir entre 2 et 50 caractères"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Numéro de téléphone invalide"),
  ],

  // Validation pour les franchises
  createFranchise: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Le nom doit contenir entre 2 et 100 caractères"),
    body("email").isEmail().normalizeEmail().withMessage("Email valide requis"),
    body("phone")
      .isMobilePhone()
      .withMessage("Numéro de téléphone valide requis"),
    body("address")
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage("L'adresse ne peut pas dépasser 255 caractères"),
    body("city")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("La ville ne peut pas dépasser 100 caractères"),
    body("postal_code")
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage("Le code postal ne peut pas dépasser 10 caractères"),
  ],

  // Validation pour les candidatures - TELEPHONE CORRIGÉ
  createCandidature: [
    body("prenom")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Le prénom doit contenir entre 2 et 100 caractères"),
    body("nom")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Le nom doit contenir entre 2 et 100 caractères"),
    body("email").isEmail().normalizeEmail().withMessage("Email valide requis"),
    body("telephone")
      .custom((value) => {
        // Accepter plusieurs formats de téléphone français
        // Nettoyer le numéro (enlever espaces, tirets, points)
        const cleanPhone = value.replace(/[\s\-\.]/g, "");

        // Log pour debug
        console.log("Téléphone à valider:", value);
        console.log("Téléphone nettoyé:", cleanPhone);

        // Expressions régulières pour différents formats
        const mobileRegex = /^(0|\+33|0033)(6|7)[0-9]{8}$/;
        const fixeRegex = /^(0|\+33|0033)[1-59][0-9]{8}$/;

        if (mobileRegex.test(cleanPhone) || fixeRegex.test(cleanPhone)) {
          return true;
        }

        throw new Error("Numéro de téléphone français valide requis");
      })
      // Normaliser le numéro de téléphone
      .customSanitizer((value) => {
        // Nettoyer et normaliser le numéro
        let phone = value.replace(/[\s\-\.]/g, "");

        // Convertir +33 ou 0033 en 0
        if (phone.startsWith("+33")) {
          phone = "0" + phone.substring(3);
        } else if (phone.startsWith("0033")) {
          phone = "0" + phone.substring(4);
        }

        console.log("Téléphone normalisé:", phone);
        return phone;
      }),
    body("ville")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("La ville doit contenir entre 2 et 100 caractères"),
    body("zone")
      .isIn(["urbaine", "peripherie", "evenementiel"])
      .withMessage("Zone invalide"),
    body("experience_resto")
      .isIn(["oui", "non"])
      .withMessage("Réponse invalide pour l'expérience en restauration"),
    body("commentaire_resto")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage(
        "Le commentaire sur l'expérience ne peut pas dépasser 1000 caractères",
      ),
    body("ancien_franchise")
      .isIn(["oui", "non"])
      .withMessage("Réponse invalide pour l'expérience entrepreneuriale"),
    body("commentaire_franchise")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage(
        "Le commentaire sur l'expérience entrepreneuriale ne peut pas dépasser 1000 caractères",
      ),
    body("capital")
      .isIn(["oui", "non"])
      .withMessage("Réponse invalide pour le capital"),
    body("motivation")
      .trim()
      .isLength({ min: 50, max: 2000 })
      .withMessage("La motivation doit contenir entre 50 et 2000 caractères"),
    body("acceptTerms").custom((value) => {
      if (value !== true && value !== "true") {
        throw new Error("Vous devez accepter les conditions");
      }
      return true;
    }),
    body("readContract").custom((value) => {
      if (value !== true && value !== "true") {
        throw new Error("Vous devez lire le contrat de franchise");
      }
      return true;
    }),
  ],
};

module.exports = validators;
