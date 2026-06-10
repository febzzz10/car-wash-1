CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  duration TEXT NOT NULL DEFAULT '30 min',
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🚗',
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  label TEXT NOT NULL,
  available INTEGER DEFAULT 1,
  booked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  car_make TEXT DEFAULT '',
  car_model TEXT DEFAULT '',
  car_plate TEXT DEFAULT '',
  service TEXT DEFAULT '',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  time INTEGER NOT NULL
);

-- Seed default services
INSERT OR IGNORE INTO services (id, name, price, duration, description, icon, enabled) VALUES
  (1, 'Basic Wash', 29, '30 min', 'Exterior hand wash, wheel cleaning, and towel dry.', '🚗', 1),
  (2, 'Full Detail', 89, '2 hours', 'Complete interior & exterior detail. Wax, polish, vacuum.', '✨', 1),
  (3, 'Interior Clean', 59, '1 hour', 'Deep interior vacuum, upholstery shampoo, dashboard polish.', '🧹', 1),
  (4, 'Premium Package', 149, '3 hours', 'Full detail plus ceramic coating, engine bay cleaning.', '🌟', 1),
  (5, 'Quick Wax', 39, '20 min', 'Hand-applied carnauba wax for extra shine and protection.', '🛡️', 1);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('businessName', '"AB Washing"'),
  ('adminWhatsApp', '"8590384225"'),
  ('adminUsername', '"admin"'),
  ('workingHours', '{"start":"09:00","end":"18:00"}'),
  ('slotInterval', '30'),
  ('address', '"123 Auto Street, Dubai"'),
  ('phone', '"+971 50 123 4567"'),
  ('email', '"info@premiumcarwash.com"');
