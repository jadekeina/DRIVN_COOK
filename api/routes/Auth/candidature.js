const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const CandidatureController = require("../../controllers/candidatureController");

// Middleware upload fichiers avec multer
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, "../../uploads/candidatures")),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    },
});

const upload = multer({ storage });

console.log("📁 Chargement des routes candidatures...");

// Route publique - Soumettre une candidature
router.post(
    "/",
    upload.fields([
        { name: "cv", maxCount: 1 },
        { name: "lettre", maxCount: 1 },
        { name: "carte", maxCount: 1 },
    ]),
    CandidatureController.create
);

// Routes admin
router.get("/", CandidatureController.getAll);
router.get("/:id", CandidatureController.getById);
router.put("/:id/accept", CandidatureController.accept);
router.put("/:id/reject", CandidatureController.reject);

console.log("✅ Routes candidatures définies");
console.log("Clés du CandidatureController:", Object.keys(CandidatureController));

module.exports = router;
