require('dotenv').config();
const db = require('./database');
const fs = require('fs');
const path = require('path');

// Создаём папку data если нет
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    hub_city            TEXT NOT NULL,
    instagram_post_id   TEXT UNIQUE,
    title               TEXT,
    description         TEXT,
    event_date          TEXT,
    event_time          TEXT,
    format              TEXT CHECK(format IN ('offline','online','hybrid') OR format IS NULL),
    address             TEXT,
    hashtags            TEXT,
    source_url          TEXT,
    raw_caption         TEXT,
    published_at        TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_events_city     ON events(hub_city);
  CREATE INDEX IF NOT EXISTS idx_events_date     ON events(event_date);
  CREATE INDEX IF NOT EXISTS idx_events_city_date ON events(hub_city, event_date);
`);

console.log(' Database initialized — data/hub.db');
process.exit(0);