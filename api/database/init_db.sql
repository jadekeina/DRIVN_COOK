

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