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

-- Table des camions
CREATE TABLE camions (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         immatriculation VARCHAR(20) NOT NULL UNIQUE,
                         modele VARCHAR(100) NOT NULL,
                         annee INT,
                         statut ENUM('disponible', 'en_service', 'en_panne', 'maintenance') DEFAULT 'disponible',
                         emplacement_actuel VARCHAR(255),
                         franchisee_id INT NULL,
                         date_attribution DATE NULL,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                         FOREIGN KEY (franchisee_id) REFERENCES users(id) ON DELETE SET NULL,
                         INDEX idx_franchisee (franchisee_id),
                         INDEX idx_statut (statut)
);

-- Table maintenance/pannes des camions
CREATE TABLE camions_maintenance (
                                     id INT PRIMARY KEY AUTO_INCREMENT,
                                     camion_id INT NOT NULL,
                                     type ENUM('entretien', 'panne', 'reparation') NOT NULL,
                                     description TEXT NOT NULL,
                                     date_intervention DATE NOT NULL,
                                     cout DECIMAL(10,2) DEFAULT 0,
                                     statut ENUM('planifie', 'en_cours', 'termine') DEFAULT 'planifie',
                                     notes TEXT,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                     FOREIGN KEY (camion_id) REFERENCES camions(id) ON DELETE CASCADE,
                                     INDEX idx_camion (camion_id),
                                     INDEX idx_date (date_intervention)
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

-- Mise à jour de la table users pour ajouter les infos franchisé
ALTER TABLE users
    ADD COLUMN date_franchise DATE NULL AFTER phone,
ADD COLUMN droit_entree_paye BOOLEAN DEFAULT FALSE AFTER date_franchise,
ADD COLUMN pourcentage_ca DECIMAL(5,2) DEFAULT 4.00 AFTER droit_entree_paye,
ADD COLUMN zone_attribution VARCHAR(100) NULL AFTER pourcentage_ca;