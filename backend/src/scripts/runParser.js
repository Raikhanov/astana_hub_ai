require('dotenv').config();
const { parseAllHubs, parseHub } = require('../services/parser/instagramParser');
const hubs = require('../config/hubs');

const arg = process.argv[2]; 

async function main() {
  if (arg) {
    // Запуск с конкретного города
    const startIndex = hubs.findIndex(h => h.city === arg);

    if (startIndex === -1) {
      console.error(`Город "${arg}" не найден. Доступные:`);
      hubs.forEach(h => console.log(`  - ${h.city}`));
      process.exit(1);
    }

    const remainingHubs = hubs.slice(startIndex);
    console.log(`▶  Продолжаем с ${arg} (${remainingHubs.length} хабов осталось)`);

    for (const hub of remainingHubs) {
      await parseHub(hub);
    }

  } else {
    // Обычный полный парсинг
    await parseAllHubs();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  });