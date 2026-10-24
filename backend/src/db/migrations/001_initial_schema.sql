CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL CHECK (length(trim(make)) > 0),
  model TEXT NOT NULL CHECK (length(trim(model)) > 0),
  category TEXT NOT NULL CHECK (length(trim(category)) > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(make COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price_cents);
