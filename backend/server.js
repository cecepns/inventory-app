const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "inventory-secret";
const MAX_PAGE_SIZE = 10;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "inventory_app",
  waitForConnections: true,
  connectionLimit: 10,
});

const ALL_FEATURES = ["stock", "planning", "monitoring", "dashboard", "users"];

function paginationFromQuery(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function parseFeatures(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((f) => ALL_FEATURES.includes(f));
    return [];
  } catch {
    return [];
  }
}

function buildListResponse(rows, total, page, limit) {
  return {
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      features: parseFeatures(user.allowed_features),
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function allowFeature(feature) {
  return (req, res, next) => {
    if (req.user.role === "admin") return next();
    if (req.user.features.includes(feature)) return next();
    return res.status(403).json({ message: "Access denied" });
  };
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','user') NOT NULL DEFAULT 'user',
      allowed_features JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(150) NOT NULL,
      sku VARCHAR(50) NOT NULL UNIQUE,
      quantity INT NOT NULL DEFAULT 0,
      min_stock INT NOT NULL DEFAULT 0,
      unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(150) NOT NULL,
      target_quantity INT NOT NULL,
      planned_date DATE NOT NULL,
      status ENUM('draft','planned','done') NOT NULL DEFAULT 'draft',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
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
    )
  `);

  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.length === 0) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
    await pool.query(
      `INSERT INTO users (username, full_name, password_hash, role, allowed_features)
       VALUES (?, ?, ?, 'admin', JSON_ARRAY('stock','planning','monitoring','dashboard','users'))`,
      [process.env.ADMIN_USERNAME || "admin", "Administrator", passwordHash]
    );
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(500).json({ status: "error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const [rows] = await pool.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({
    token: signUser(user),
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      features: parseFeatures(user.allowed_features),
    },
  });
});

app.get("/api/dashboard/summary", auth, allowFeature("dashboard"), async (_req, res) => {
  const [[stockCount]] = await pool.query("SELECT COUNT(*) AS total FROM stocks");
  const [[lowStockCount]] = await pool.query("SELECT COUNT(*) AS total FROM stocks WHERE quantity <= min_stock");
  const [[planCount]] = await pool.query("SELECT COUNT(*) AS total FROM production_plans");
  const [[monitorCount]] = await pool.query("SELECT COUNT(*) AS total FROM production_monitoring");
  const [[eff]] = await pool.query(`
    SELECT ROUND(
      IFNULL((SUM(actual_output) / NULLIF(SUM(target_output), 0)) * 100, 0),
      2
    ) AS efficiency
    FROM production_monitoring
  `);

  res.json({
    stockTotal: stockCount.total,
    lowStockTotal: lowStockCount.total,
    planningTotal: planCount.total,
    monitoringTotal: monitorCount.total,
    efficiency: Number(eff.efficiency || 0),
  });
});

async function listModule(req, res, table, searchableColumns) {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const search = (req.query.search || "").trim();

  let whereClause = "";
  const params = [];
  if (search) {
    whereClause = `WHERE ${searchableColumns.map((c) => `${c} LIKE ?`).join(" OR ")}`;
    searchableColumns.forEach(() => params.push(`%${search}%`));
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM ${table} ${whereClause}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM ${table} ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json(buildListResponse(rows, countRows[0].total, page, limit));
}

app.get("/api/stocks", auth, allowFeature("stock"), (req, res) =>
  listModule(req, res, "stocks", ["item_name", "sku", "unit"])
);
app.post("/api/stocks", auth, allowFeature("stock"), async (req, res) => {
  const { item_name, sku, quantity, min_stock, unit } = req.body;
  await pool.query(
    "INSERT INTO stocks (item_name, sku, quantity, min_stock, unit) VALUES (?, ?, ?, ?, ?)",
    [item_name, sku, Number(quantity || 0), Number(min_stock || 0), unit || "pcs"]
  );
  res.status(201).json({ message: "Stock created" });
});
app.put("/api/stocks/:id", auth, allowFeature("stock"), async (req, res) => {
  const { item_name, sku, quantity, min_stock, unit } = req.body;
  await pool.query(
    "UPDATE stocks SET item_name=?, sku=?, quantity=?, min_stock=?, unit=? WHERE id=?",
    [item_name, sku, Number(quantity || 0), Number(min_stock || 0), unit || "pcs", Number(req.params.id)]
  );
  res.json({ message: "Stock updated" });
});
app.delete("/api/stocks/:id", auth, allowFeature("stock"), async (req, res) => {
  await pool.query("DELETE FROM stocks WHERE id = ?", [Number(req.params.id)]);
  res.json({ message: "Stock deleted" });
});

app.get("/api/production-plans", auth, allowFeature("planning"), (req, res) =>
  listModule(req, res, "production_plans", ["product_name", "status", "notes"])
);
app.post("/api/production-plans", auth, allowFeature("planning"), async (req, res) => {
  const { product_name, target_quantity, planned_date, status, notes } = req.body;
  await pool.query(
    "INSERT INTO production_plans (product_name, target_quantity, planned_date, status, notes) VALUES (?, ?, ?, ?, ?)",
    [product_name, Number(target_quantity || 0), planned_date, status || "draft", notes || null]
  );
  res.status(201).json({ message: "Plan created" });
});
app.put("/api/production-plans/:id", auth, allowFeature("planning"), async (req, res) => {
  const { product_name, target_quantity, planned_date, status, notes } = req.body;
  await pool.query(
    "UPDATE production_plans SET product_name=?, target_quantity=?, planned_date=?, status=?, notes=? WHERE id=?",
    [product_name, Number(target_quantity || 0), planned_date, status || "draft", notes || null, Number(req.params.id)]
  );
  res.json({ message: "Plan updated" });
});
app.delete("/api/production-plans/:id", auth, allowFeature("planning"), async (req, res) => {
  await pool.query("DELETE FROM production_plans WHERE id = ?", [Number(req.params.id)]);
  res.json({ message: "Plan deleted" });
});

app.get("/api/production-monitoring", auth, allowFeature("monitoring"), (req, res) =>
  listModule(req, res, "production_monitoring", ["machine_name", "operator_name", "shift_name"])
);
app.post("/api/production-monitoring", auth, allowFeature("monitoring"), async (req, res) => {
  const { machine_name, operator_name, shift_name, target_output, actual_output, downtime_minutes, monitored_at } = req.body;
  await pool.query(
    `INSERT INTO production_monitoring
     (machine_name, operator_name, shift_name, target_output, actual_output, downtime_minutes, monitored_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      machine_name,
      operator_name,
      shift_name,
      Number(target_output || 0),
      Number(actual_output || 0),
      Number(downtime_minutes || 0),
      monitored_at,
    ]
  );
  res.status(201).json({ message: "Monitoring created" });
});
app.put("/api/production-monitoring/:id", auth, allowFeature("monitoring"), async (req, res) => {
  const { machine_name, operator_name, shift_name, target_output, actual_output, downtime_minutes, monitored_at } = req.body;
  await pool.query(
    `UPDATE production_monitoring
     SET machine_name=?, operator_name=?, shift_name=?, target_output=?, actual_output=?, downtime_minutes=?, monitored_at=?
     WHERE id=?`,
    [
      machine_name,
      operator_name,
      shift_name,
      Number(target_output || 0),
      Number(actual_output || 0),
      Number(downtime_minutes || 0),
      monitored_at,
      Number(req.params.id),
    ]
  );
  res.json({ message: "Monitoring updated" });
});
app.delete("/api/production-monitoring/:id", auth, allowFeature("monitoring"), async (req, res) => {
  await pool.query("DELETE FROM production_monitoring WHERE id = ?", [Number(req.params.id)]);
  res.json({ message: "Monitoring deleted" });
});

app.get("/api/users", auth, allowFeature("users"), async (req, res) => {
  const { page, limit, offset } = paginationFromQuery(req.query);
  const search = (req.query.search || "").trim();

  const params = [];
  let whereClause = "";
  if (search) {
    whereClause = "WHERE username LIKE ? OR full_name LIKE ? OR role LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
  const [rows] = await pool.query(
    `SELECT id, username, full_name, role, allowed_features, created_at
     FROM users ${whereClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const normalized = rows.map((r) => ({ ...r, features: parseFeatures(r.allowed_features) }));
  res.json(buildListResponse(normalized, countRows[0].total, page, limit));
});

app.post("/api/users", auth, allowFeature("users"), async (req, res) => {
  const { username, full_name, password, role, features } = req.body;
  const passwordHash = await bcrypt.hash(password || "123456", 10);
  const validFeatures = Array.isArray(features) ? features.filter((f) => ALL_FEATURES.includes(f)) : [];

  await pool.query(
    "INSERT INTO users (username, full_name, password_hash, role, allowed_features) VALUES (?, ?, ?, ?, ?)",
    [username, full_name, passwordHash, role === "admin" ? "admin" : "user", JSON.stringify(validFeatures)]
  );

  res.status(201).json({ message: "User created" });
});

app.put("/api/users/:id", auth, allowFeature("users"), async (req, res) => {
  const { username, full_name, password, role, features } = req.body;
  const userId = Number(req.params.id);
  const validFeatures = Array.isArray(features) ? features.filter((f) => ALL_FEATURES.includes(f)) : [];

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET username=?, full_name=?, password_hash=?, role=?, allowed_features=? WHERE id=?",
      [username, full_name, passwordHash, role === "admin" ? "admin" : "user", JSON.stringify(validFeatures), userId]
    );
  } else {
    await pool.query(
      "UPDATE users SET username=?, full_name=?, role=?, allowed_features=? WHERE id=?",
      [username, full_name, role === "admin" ? "admin" : "user", JSON.stringify(validFeatures), userId]
    );
  }

  res.json({ message: "User updated" });
});

app.delete("/api/users/:id", auth, allowFeature("users"), async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }
  await pool.query("DELETE FROM users WHERE id = ?", [Number(req.params.id)]);
  return res.json({ message: "User deleted" });
});

app.use((error, _req, res, _next) => {
  if (error?.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Data already exists" });
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
