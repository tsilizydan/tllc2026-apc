-- =========================================================
--  APOS'CREED — Database Schema
--  Engine: MySQL 5.7+ / MariaDB 10.3+
--  Charset: utf8mb4
--  Created: 2026-03-27
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `aposcreed_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `aposcreed_db`;

-- ---------------------------------------------------------
-- Table: settings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key`   VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(120) NOT NULL,
  `email`           VARCHAR(200) NOT NULL UNIQUE,
  `password_hash`   VARCHAR(255) NOT NULL,
  `role`            ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `email_verified`  TINYINT(1) NOT NULL DEFAULT 0,
  `verify_token`    VARCHAR(64) DEFAULT NULL,
  `reset_token`     VARCHAR(64) DEFAULT NULL,
  `reset_expires`   DATETIME DEFAULT NULL,
  `avatar`          VARCHAR(255) DEFAULT NULL,
  `phone`           VARCHAR(30) DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role`  (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: addresses
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `addresses` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED NOT NULL,
  `label`       VARCHAR(50) DEFAULT 'Home',
  `full_name`   VARCHAR(120) NOT NULL,
  `phone`       VARCHAR(30) NOT NULL,
  `address_line1` VARCHAR(200) NOT NULL,
  `address_line2` VARCHAR(200) DEFAULT NULL,
  `city`        VARCHAR(100) NOT NULL,
  `region`      VARCHAR(100) DEFAULT NULL,
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `country`     VARCHAR(100) NOT NULL DEFAULT 'Madagascar',
  `is_default`  TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `image`       VARCHAR(255) DEFAULT NULL,
  `parent_id`   INT UNSIGNED DEFAULT NULL,
  `sort_order`  INT DEFAULT 0,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_slug`   (`slug`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`      INT UNSIGNED NOT NULL,
  `name`             VARCHAR(255) NOT NULL,
  `slug`             VARCHAR(255) NOT NULL UNIQUE,
  `description`      LONGTEXT DEFAULT NULL,
  `short_description` VARCHAR(500) DEFAULT NULL,
  `price`            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_percent` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `final_price`      DECIMAL(12,2) GENERATED ALWAYS AS (
                       ROUND(`price` * (1 - `discount_percent` / 100), 2)
                     ) STORED,
  `platform`         SET('PC','PlayStation','Xbox','Nintendo','Mobile','All') NOT NULL DEFAULT 'All',
  `is_digital`       TINYINT(1) NOT NULL DEFAULT 0,
  `stock`            INT NOT NULL DEFAULT 0,
  `sku`              VARCHAR(100) DEFAULT NULL UNIQUE,
  `cover_image`      VARCHAR(255) DEFAULT NULL,
  `release_date`     DATE DEFAULT NULL,
  `publisher`        VARCHAR(150) DEFAULT NULL,
  `developer`        VARCHAR(150) DEFAULT NULL,
  `age_rating`       VARCHAR(10) DEFAULT NULL,
  `is_featured`      TINYINT(1) NOT NULL DEFAULT 0,
  `is_active`        TINYINT(1) NOT NULL DEFAULT 1,
  `views`            INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  INDEX `idx_category`  (`category_id`),
  INDEX `idx_slug`      (`slug`),
  INDEX `idx_featured`  (`is_featured`),
  INDEX `idx_active`    (`is_active`),
  INDEX `idx_platform`  (`platform`),
  INDEX `idx_price`     (`final_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: product_images
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_images` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  INT UNSIGNED NOT NULL,
  `image_url`   VARCHAR(255) NOT NULL,
  `alt_text`    VARCHAR(200) DEFAULT NULL,
  `sort_order`  INT DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: cart
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `session_id`  VARCHAR(128) DEFAULT NULL,
  `product_id`  INT UNSIGNED NOT NULL,
  `quantity`    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id`    (`user_id`),
  INDEX `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: orders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number`    VARCHAR(30) NOT NULL UNIQUE,
  `user_id`         INT UNSIGNED DEFAULT NULL,
  `guest_email`     VARCHAR(200) DEFAULT NULL,
  `status`          ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded')
                    NOT NULL DEFAULT 'pending',
  `payment_method`  ENUM('mvola','orange_money','airtel_money','cod') NOT NULL,
  `payment_status`  ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  `payment_ref`     VARCHAR(100) DEFAULT NULL,
  `subtotal`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `shipping_cost`   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount`        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total`           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency`        VARCHAR(10) NOT NULL DEFAULT 'MGA',
  -- Shipping snapshot
  `ship_full_name`  VARCHAR(120) NOT NULL,
  `ship_phone`      VARCHAR(30) NOT NULL,
  `ship_address`    VARCHAR(300) NOT NULL,
  `ship_city`       VARCHAR(100) NOT NULL,
  `ship_region`     VARCHAR(100) DEFAULT NULL,
  `ship_country`    VARCHAR(100) NOT NULL DEFAULT 'Madagascar',
  `notes`           TEXT DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_order_number`   (`order_number`),
  INDEX `idx_user_id`        (`user_id`),
  INDEX `idx_status`         (`status`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_created_at`     (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: order_items
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`    INT UNSIGNED NOT NULL,
  `product_id`  INT UNSIGNED DEFAULT NULL,
  `product_name`  VARCHAR(255) NOT NULL,
  `product_image` VARCHAR(255) DEFAULT NULL,
  `platform`    VARCHAR(50) DEFAULT NULL,
  `unit_price`  DECIMAL(12,2) NOT NULL,
  `quantity`    SMALLINT UNSIGNED NOT NULL,
  `subtotal`    DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`)   REFERENCES `orders`(`id`)   ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
  INDEX `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- Table: reviews
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  INT UNSIGNED NOT NULL,
  `user_id`     INT UNSIGNED NOT NULL,
  `rating`      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  `title`       VARCHAR(200) DEFAULT NULL,
  `body`        TEXT DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)    ON DELETE CASCADE,
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_approved`   (`is_approved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
