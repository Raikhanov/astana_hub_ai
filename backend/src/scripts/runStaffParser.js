require('dotenv').config();
const { parseAllStaff, parseStaffForHub } = require('../services/parser/staffParser');
const hubs = require('../config/hubs');

const arg = process.argv[2]; // npm run parse:staff -- Astana

async function main() {
  if (arg) {
    const startIndex = hubs.findIndex(h => h.city === arg);
    if (startIndex === -1) {
      console.error(`Город "${arg}" не найден.`);
      hubs.forEach(h => console.log(`  - ${h.city}`));
      process.exit(1);
    }
    const remaining = hubs.slice(startIndex);
    console.log(` Начинаем с ${arg} (${remaining.length} хабов)`);
    for (const hub of remaining) {
      await parseStaffForHub(hub);
    }
  } else {
    await parseAllStaff();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Ошибка:', err.message);
    process.exit(1);
  });