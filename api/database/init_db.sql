-- Script SQL complet pour Driv'n Cook - Garde tout et ajoute les colonnes GPS manquantes
DROP DATABASE IF EXISTS drivncook;
CREATE DATABASE drivncook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE drivncook;

CREATE TABLE franchises (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            email VARCHAR(255),
                            phone VARCHAR(20)
);

-- Table des utilisateurs
CREATE TABLE users (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       role ENUM('customer', 'franchise_owner', 'admin') DEFAULT 'customer',
                       phone VARCHAR(20),
                       date_franchise DATE NULL,
                       droit_entree_paye BOOLEAN DEFAULT FALSE,
                       pourcentage_ca DECIMAL(5,2) DEFAULT 4.00,
                       zone_attribution VARCHAR(100) NULL,
                       is_verified BOOLEAN DEFAULT FALSE,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Mise à jour de la table franchises pour lier avec les utilisateurs
ALTER TABLE franchises
    ADD COLUMN owner_id INT,
    ADD COLUMN address TEXT,
    ADD COLUMN city VARCHAR(100),
    ADD COLUMN postal_code VARCHAR(10),
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                                                                                ADD FOREIGN KEY (owner_id) REFERENCES users(id);

-- Table des tokens de refresh (optionnel, pour une sécurité renforcée)
CREATE TABLE refresh_tokens (
                                id INT PRIMARY KEY AUTO_INCREMENT,
                                user_id INT NOT NULL,
                                token VARCHAR(500) NOT NULL,
                                expires_at TIMESTAMP NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des candidatures de franchise
CREATE TABLE franchise_candidatures (
                                        id INT PRIMARY KEY AUTO_INCREMENT,

    -- Informations personnelles
                                        prenom VARCHAR(100) NOT NULL,
                                        nom VARCHAR(100) NOT NULL,
                                        email VARCHAR(255) NOT NULL,
                                        telephone VARCHAR(20) NOT NULL,

    -- Informations de candidature
                                        ville VARCHAR(100) NOT NULL,
                                        zone ENUM('urbaine', 'peripherie', 'evenementiel') NOT NULL,

    -- Expérience
                                        experience_resto ENUM('oui', 'non') NOT NULL,
                                        commentaire_resto TEXT,
                                        ancien_franchise ENUM('oui', 'non') NOT NULL,
                                        commentaire_franchise TEXT,

    -- Financier
                                        capital ENUM('oui', 'non') NOT NULL,

    -- Motivation
                                        motivation TEXT NOT NULL,

    -- Documents (noms des fichiers uploadés)
                                        cv_filename VARCHAR(255),
                                        lettre_filename VARCHAR(255),
                                        carte_filename VARCHAR(255),

    -- Consentements
                                        accept_terms BOOLEAN DEFAULT FALSE,
                                        read_contract BOOLEAN DEFAULT FALSE,

    -- Statut de la candidature
                                        statut ENUM('en_attente', 'en_cours', 'acceptee', 'refusee') DEFAULT 'en_attente',

    -- Notes internes (admin seulement)
                                        notes_internes TEXT,

    -- Timestamps
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index pour recherche
                                        INDEX idx_email (email),
                                        INDEX idx_statut (statut),
                                        INDEX idx_created_at (created_at)
);

CREATE TABLE user_activations (
                                  id INT PRIMARY KEY AUTO_INCREMENT,
                                  candidature_id INT NOT NULL,
                                  token VARCHAR(64) NOT NULL UNIQUE,
                                  email VARCHAR(255) NOT NULL,
                                  expires_at TIMESTAMP NOT NULL,
                                  used BOOLEAN DEFAULT FALSE,
                                  used_at TIMESTAMP NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Clé étrangère vers la candidature
                                  FOREIGN KEY (candidature_id) REFERENCES franchise_candidatures(id) ON DELETE CASCADE,

    -- Index pour recherche rapide
                                  INDEX idx_token (token),
                                  INDEX idx_email (email),
                                  INDEX idx_expires (expires_at)
);

-- Tables supplémentaires pour la Mission 1

-- Table des camions (MISE À JOUR avec toutes les colonnes GPS/tracking)
CREATE TABLE camions (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         immatriculation VARCHAR(20) NOT NULL UNIQUE,
                         modele VARCHAR(100) NOT NULL,
                         annee INT,
                         statut ENUM('disponible', 'en_service', 'en_panne', 'maintenance') DEFAULT 'disponible',
                         emplacement_actuel VARCHAR(255),
                         franchisee_id INT NULL,
                         date_attribution DATE NULL,

    -- NOUVELLES COLONNES GPS/TRACKING
                         latitude DECIMAL(10, 8) NULL,
                         longitude DECIMAL(11, 8) NULL,
                         derniere_position_update TIMESTAMP NULL,
                         kilometrage INT DEFAULT 0,
                         derniere_maintenance DATE NULL,
                         cout_total_maintenance DECIMAL(10,2) DEFAULT 0,

                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                         FOREIGN KEY (franchisee_id) REFERENCES users(id) ON DELETE SET NULL,
                         INDEX idx_franchisee (franchisee_id),
                         INDEX idx_statut (statut)
);

-- Table maintenance/pannes des camions (MISE À JOUR avec colonnes manquantes)
CREATE TABLE camions_maintenance (
                                     id INT PRIMARY KEY AUTO_INCREMENT,
                                     camion_id INT NOT NULL,
                                     type_intervention ENUM('entretien', 'panne', 'reparation', 'controle_technique') NOT NULL,
                                     description TEXT NOT NULL,
                                     date_intervention DATE NOT NULL,
                                     date_fin DATE NULL,
                                     cout_intervention DECIMAL(10,2) DEFAULT 0,
                                     statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
                                     fournisseur VARCHAR(255),
                                     kilometrage INT,
                                     notes TEXT,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                     FOREIGN KEY (camion_id) REFERENCES camions(id) ON DELETE CASCADE,
                                     INDEX idx_camion (camion_id),
                                     INDEX idx_date (date_intervention)
);

-- NOUVELLE TABLE pour la planification des emplacements
CREATE TABLE planification_emplacements (
                                            id INT PRIMARY KEY AUTO_INCREMENT,
                                            camion_id INT NOT NULL,
                                            emplacement VARCHAR(255) NOT NULL,
                                            date_debut DATE NOT NULL,
                                            date_fin DATE NOT NULL,
                                            heures_debut TIME NOT NULL,
                                            heures_fin TIME NOT NULL,
                                            statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
                                            recette_prevue DECIMAL(10,2) DEFAULT 0,
                                            recette_reelle DECIMAL(10,2) DEFAULT 0,
                                            notes TEXT,
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                            FOREIGN KEY (camion_id) REFERENCES camions(id) ON DELETE CASCADE,
                                            INDEX idx_camion (camion_id),
                                            INDEX idx_dates (date_debut, date_fin)
);

-- Table des entrepôts
CREATE TABLE entrepots (
                           id INT PRIMARY KEY AUTO_INCREMENT,
                           nom VARCHAR(100) NOT NULL,
                           adresse TEXT NOT NULL,
                           ville VARCHAR(100) NOT NULL,
                           code_postal VARCHAR(10) NOT NULL,
                           telephone VARCHAR(20),
                           email VARCHAR(255),
                           est_actif BOOLEAN DEFAULT TRUE,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des produits/stock
CREATE TABLE produits (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          nom VARCHAR(200) NOT NULL,
                          categorie ENUM('ingredient', 'plat_prepare', 'boisson', 'autre') NOT NULL,
                          prix_unitaire DECIMAL(8,2) NOT NULL,
                          unite ENUM('kg', 'litre', 'piece', 'portion') NOT NULL,
                          est_obligatoire BOOLEAN DEFAULT FALSE, -- Pour la règle 80%
                          description TEXT,
                          est_actif BOOLEAN DEFAULT TRUE,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                          INDEX idx_categorie (categorie),
                          INDEX idx_obligatoire (est_obligatoire)
);

-- Table des commandes des franchisés
CREATE TABLE commandes (
                           id INT PRIMARY KEY AUTO_INCREMENT,
                           franchisee_id INT NOT NULL,
                           entrepot_id INT NOT NULL,
                           statut ENUM('en_attente', 'validee', 'preparee', 'livree', 'annulee') DEFAULT 'en_attente',
                           date_commande DATE NOT NULL,
                           date_livraison_prevue DATE,
                           total_ht DECIMAL(10,2) DEFAULT 0,
                           total_ttc DECIMAL(10,2) DEFAULT 0,
                           pourcentage_obligatoire DECIMAL(5,2) DEFAULT 0, -- % de produits obligatoires
                           notes TEXT,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                           FOREIGN KEY (franchisee_id) REFERENCES users(id) ON DELETE CASCADE,
                           FOREIGN KEY (entrepot_id) REFERENCES entrepots(id),
                           INDEX idx_franchisee (franchisee_id),
                           INDEX idx_statut (statut),
                           INDEX idx_date (date_commande)
);

-- Table détail des commandes
CREATE TABLE commandes_detail (
                                  id INT PRIMARY KEY AUTO_INCREMENT,
                                  commande_id INT NOT NULL,
                                  produit_id INT NOT NULL,
                                  quantite DECIMAL(10,3) NOT NULL,
                                  prix_unitaire DECIMAL(8,2) NOT NULL,
                                  total DECIMAL(10,2) NOT NULL,

                                  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
                                  FOREIGN KEY (produit_id) REFERENCES produits(id),
                                  INDEX idx_commande (commande_id)
);

-- Table des ventes des franchisés
CREATE TABLE ventes (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        franchisee_id INT NOT NULL,
                        camion_id INT NOT NULL,
                        date_vente DATE NOT NULL,
                        chiffre_affaires DECIMAL(10,2) NOT NULL,
                        nombre_clients INT DEFAULT 0,
                        emplacement VARCHAR(255),
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                        FOREIGN KEY (franchisee_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (camion_id) REFERENCES camions(id),
                        INDEX idx_franchisee (franchisee_id),
                        INDEX idx_date (date_vente),
                        INDEX idx_camion (camion_id)
);

-- ===============================================
-- DONNÉES DE TEST
-- ===============================================

-- 1. Créer un utilisateur admin
INSERT INTO users (email, password, first_name, last_name, role, is_verified, created_at) VALUES
    ('admin@drivncook.com', '$2b$10$tWoMl72tTU3iwB7Drcnb6uiJ929.IcD0Euml5tK.NheAJ/UCSOZAW', 'Admin', 'System', 'admin', TRUE, NOW());

INSERT INTO users (email, password, first_name, last_name, role, is_verified, created_at) VALUES
    ('jade.keina@outlook.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyev0g6X7Y1dNhJ/xj4MqFPqAXm3tN8LIy', 'Admin', 'System', 'franchise_owner', TRUE, NOW());
-- Mot de passe: admin123
-- Mot de passe: admin123

-- 2. Créer des franchisés de test
INSERT INTO users (email, password, first_name, last_name, role, phone, is_verified, date_franchise, droit_entree_paye, pourcentage_ca, zone_attribution) VALUES
                                                                                                                                                              ('jean.dupont@drivncook.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', 'franchise_owner', '0123456789', TRUE, '2024-01-15', TRUE, 4.00, 'Paris Centre'),
                                                                                                                                                              ('marie.martin@drivncook.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Martin', 'franchise_owner', '0123456788', TRUE, '2024-02-20', TRUE, 4.00, 'Lyon Presqu\'île'),
('pierre.durand@drivncook.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Durand', 'franchise_owner', '0123456787', TRUE, '2024-03-10', FALSE, 4.00, 'Marseille Vieux Port');

-- 3. Créer des camions de test avec positions GPS
INSERT INTO camions (
    immatriculation, modele, annee, statut, franchisee_id, 
    emplacement_actuel, latitude, longitude, derniere_position_update, kilometrage
) VALUES
-- Camion assigné à Jean Dupont (Paris)
('AB-123-CD', 'Food Truck Master', 2022, 'en_service', 2, 'Paris Centre', 48.8566, 2.3522, NOW(), 15000),
-- Camion assigné à Marie Martin (Lyon)
('EF-456-GH', 'Mobile Kitchen Pro', 2021, 'en_service', 3, 'Lyon Presqu\'île', 45.7640, 4.8357, NOW(), 28000),
-- Camion assigné à Pierre Durand (Marseille)
                                                                                                                                                              ('IJ-789-KL', 'Street Food Elite', 2023, 'en_service', 4, 'Marseille Vieux Port', 43.2965, 5.3698, NOW(), 8500),
-- Camions disponibles
                                                                                                                                                              ('MN-101-OP', 'Urban Cooker', 2022, 'disponible', NULL, 'Entrepôt Paris', 48.8606, 2.3376, NOW(), 12000),
                                                                                                                                                              ('QR-202-ST', 'City Gourmet', 2021, 'disponible', NULL, 'Entrepôt Lyon', 45.7578, 4.8320, NOW(), 22000),
-- Camion en maintenance
                                                                                                                                                              ('UV-303-WX', 'Premium Mobile', 2020, 'maintenance', NULL, 'Atelier Réparation', 48.8534, 2.3488, DATE_SUB(NOW(), INTERVAL 2 HOUR), 35000);

-- 4. Créer des maintenances de test
INSERT INTO camions_maintenance (
    camion_id, type_intervention, description, date_intervention,
    statut, cout_intervention, notes
) VALUES
-- Maintenance en cours
(6, 'reparation', 'Réparation système de réfrigération', CURDATE(), 'en_cours', 1200.00, 'Pièces commandées'),
-- Maintenance terminée
(1, 'entretien', 'Révision générale 15000 km', DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'termine', 350.00, 'RAS'),
-- Maintenance planifiée
(2, 'controle_technique', 'Contrôle technique annuel', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'planifie', 0, 'À prévoir');

-- 5. Créer des planifications de test
INSERT INTO planification_emplacements (
    camion_id, emplacement, date_debut, date_fin,
    heures_debut, heures_fin, statut, recette_prevue
) VALUES
-- Planifications pour aujourd'hui
(1, 'Place de la République, Paris', CURDATE(), CURDATE(), '11:00', '15:00', 'en_cours', 800.00),
(2, 'Place Bellecour, Lyon', CURDATE(), CURDATE(), '12:00', '16:00', 'en_cours', 650.00),
-- Planifications pour demain
(1, 'Quartier La Défense, Paris', DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30', '14:30', 'planifie', 900.00),
(3, 'Vieux Port, Marseille', DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', '18:00', 'planifie', 1200.00);

-- 6. Créer des entrepôts de test
INSERT INTO entrepots (nom, adresse, ville, code_postal, telephone, email) VALUES
                                                                               ('Entrepôt Paris Nord', '123 Rue de la Logistique', 'Paris', '75019', '0144556677', 'paris@drivncook.fr'),
                                                                               ('Entrepôt Lyon Sud', '456 Avenue de l\'Industrie', 'Lyon', '69007', '0478889900', 'lyon@drivncook.fr'),
('Entrepôt Marseille', '789 Boulevard du Commerce', 'Marseille', '13008', '0491223344', 'marseille@drivncook.fr');

-- 7. Créer des produits de test
INSERT INTO produits (nom, categorie, prix_unitaire, unite, est_obligatoire, description) VALUES
-- Produits obligatoires
('Pain burger artisanal', 'ingredient', 0.85, 'piece', TRUE, 'Pain burger fait maison'),
('Steak haché 125g Bio', 'ingredient', 3.20, 'piece', TRUE, 'Viande française premium'),
('Fromage cheddar', 'ingredient', 12.50, 'kg', TRUE, 'Fromage affiné 6 mois'),
-- Produits optionnels
('Sauce burger maison', 'ingredient', 8.90, 'litre', FALSE, 'Sauce secrète de la maison'),
('Frites fraîches', 'ingredient', 2.10, 'kg', FALSE, 'Pommes de terre du terroir'),
('Coca-Cola 33cl', 'boisson', 1.20, 'piece', FALSE, 'Boisson gazeuse'),
-- Plats préparés
('Burger Classic', 'plat_prepare', 8.50, 'piece', FALSE, 'Burger signature'),
('Menu Complet', 'plat_prepare', 12.90, 'piece', FALSE, 'Burger + frites + boisson');

-- 8. Créer des ventes de test
INSERT INTO ventes (franchisee_id, camion_id, date_vente, chiffre_affaires, nombre_clients, emplacement) VALUES
-- Ventes d'hier
(2, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1250.50, 48, 'Place de la République'),
                                                                                (3, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 980.75, 35, 'Place Bellecour'),
                                                                                (4, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1450.80, 62, 'Vieux Port'),
-- Ventes de cette semaine
                                                                                (2, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1180.30, 42, 'Champs-Élysées'),
                                                                                (3, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 890.65, 31, 'Part-Dieu'),
                                                                                (4, 3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 1320.90, 55, 'Canebière');

-- ===============================================
-- VÉRIFICATIONS
-- ===============================================

-- Vérifier la création des tables
SELECT
    'Tables créées avec succès' as status,
    COUNT(*) as nombre_tables
FROM information_schema.tables
WHERE table_schema = 'drivncook';

-- Vérifier les utilisateurs
SELECT
    'Utilisateurs' as type,
    role,
    COUNT(*) as nombre
FROM users
GROUP BY role;

-- Vérifier les camions avec GPS
SELECT
    'Camions avec GPS' as type,
    COUNT(*) as total,
    COUNT(latitude) as avec_position
FROM camions;

-- Vérifier les colonnes de la table camions
DESCRIBE camions;

-- Afficher les camions avec leurs positions
SELECT
    immatriculation,
    modele,
    statut,
    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as franchisee,
    emplacement_actuel,
    CONCAT(latitude, ', ', longitude) as position_gps,
    derniere_position_update
FROM camions c
         LEFT JOIN users u ON c.franchisee_id = u.id
ORDER BY c.id;

-- Statistiques finales
SELECT 'RÉSUMÉ DE LA BASE DE DONNÉES' as titre;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_camions FROM camions;
SELECT COUNT(*) as total_maintenances FROM camions_maintenance;
SELECT COUNT(*) as total_planifications FROM planification_emplacements;
SELECT COUNT(*) as camions_avec_gps FROM camions WHERE latitude IS NOT NULL;

SELECT 'Base de données créée avec succès !' as message;

-- Ajouter quelques commandes de test supplémentaires avec leurs détails
INSERT INTO commandes (franchisee_id, entrepot_id, date_commande, total_ttc, statut, notes) VALUES
                                                                                                (2, 1, '2025-01-20 09:30:00', 198.50, 'livree', 'Commande urgente - livraison matinale'),
                                                                                                (3, 1, '2025-01-21 14:20:00', 156.75, 'en_attente', 'Première commande du mois'),
                                                                                                (4, 1, '2025-01-19 16:45:00', 89.25, 'validee', 'Commande habituelle hebdomadaire'),
                                                                                                (2, 1, '2025-01-22 11:15:00', 234.80, 'preparee', 'Commande spéciale événement'),
                                                                                                (3, 1, '2025-01-18 08:30:00', 167.40, 'livree', 'Livraison anticipée demandée');

-- Détails des nouvelles commandes (en supposant que les commandes ont les IDs 1, 2, 3, 4, 5)
INSERT INTO commandes_detail (commande_id, produit_id, quantite, prix_unitaire, total) VALUES
-- Commande 1 (CMD-001)
(1, 1, 20, 0.85, 17.00),
(1, 2, 15, 3.20, 48.00),
(1, 3, 5, 12.50, 62.50),
(1, 6, 36, 1.20, 43.20),
(1, 7, 3, 8.50, 25.50),

-- Commande 2 (CMD-002)
(2, 1, 10, 0.85, 8.50),
(2, 4, 8, 8.90, 71.20),
(2, 5, 24, 2.10, 50.40),
(2, 6, 18, 1.20, 21.60),

-- Commande 3 (CMD-003)
(3, 2, 25, 3.20, 80.00),
(3, 5, 36, 2.10, 75.60),
(3, 8, 2, 12.90, 25.80),

-- Commande 4 (CMD-004)
(4, 1, 30, 0.85, 25.50),
(4, 2, 20, 3.20, 64.00),
(4, 3, 8, 12.50, 100.00),
(4, 4, 5, 8.90, 44.50),

-- Commande 5 (CMD-005)
(5, 3, 12, 12.50, 150.00),
(5, 6, 48, 1.20, 57.60),
(5, 7, 4, 8.50, 34.00);

-- Vérification des données insérées
SELECT
    CONCAT('CMD-', LPAD(c.id, 3, '0')) as commande_id,
    CONCAT(u.first_name, ' ', u.last_name) as franchise_nom,
    c.date_commande,
    c.statut,
    c.total_ttc,
    COUNT(cd.id) as nb_articles
FROM commandes c
         JOIN users u ON c.franchisee_id = u.id
         LEFT JOIN commandes_detail cd ON c.id = cd.commande_id
GROUP BY c.id, u.first_name, u.last_name, c.date_commande, c.statut, c.total_ttc
ORDER BY c.date_commande DESC;

-- Vérification des articles avec leur format ID
SELECT
    CONCAT('ART-', LPAD(id, 3, '0')) as id_article,
    nom,
    prix_unitaire,
    unite,
    categorie,
    CASE
        WHEN est_actif = 1 THEN 'disponible'
        ELSE 'indisponible'
        END as statut
FROM produits
WHERE est_actif = 1
ORDER BY id;

ALTER TABLE users ADD COLUMN payment_status ENUM(
    'pending_contract',
    'contract_signed', 
    'deposit_paid',
    'franchise_payment_pending',
    'franchise_payment_completed',
    'franchise_active'
) DEFAULT 'pending_contract';

ALTER TABLE users ADD COLUMN contract_signed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN deposit_paid_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN franchise_payment_method VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN franchise_payment_completed_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN assigned_zone VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN activation_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN activation_expires TIMESTAMP NULL;
