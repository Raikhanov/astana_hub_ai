const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return { events: [], staff: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { load, save };