-- Inventory Siswa Database Schema
-- Import:
-- mysql -u root -p < backend/database.sql

CREATE DATABASE IF NOT EXISTS inventory_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventory_app;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  allowed_features JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  target_quantity INT NOT NULL,
  planned_date DATE NOT NULL,
  status ENUM('draft', 'planned', 'done') NOT NULL DEFAULT 'draft',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machine_name VARCHAR(150) NOT NULL,
  operator_name VARCHAR(120) NOT NULL,
  shift_name VARCHAR(30) NOT NULL,
  target_output INT NOT NULL,
  actual_output INT NOT NULL,
  downtime_minutes INT NOT NULL DEFAULT 0,
  monitored_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional indexes for faster search/filter.
CREATE INDEX idx_stocks_item_name ON stocks (item_name);
CREATE INDEX idx_stocks_sku ON stocks (sku);
CREATE INDEX idx_plans_product_name ON production_plans (product_name);
CREATE INDEX idx_monitor_machine_name ON production_monitoring (machine_name);
CREATE INDEX idx_monitor_operator_name ON production_monitoring (operator_name);
CREATE INDEX idx_users_full_name ON users (full_name);

-- Default admin account:
-- username: admin
-- password: admin123
INSERT INTO users (username, full_name, password_hash, role, allowed_features)
SELECT
  'admin',
  'Administrator',
  '$2b$10$HJt0cAKn.u2w.fMyeDjALu8qeG5vncZFyKr1UBIhoqxH/pM.tAROy',
  'admin',
  JSON_ARRAY('stock', 'planning', 'monitoring', 'dashboard', 'users')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin'
);
