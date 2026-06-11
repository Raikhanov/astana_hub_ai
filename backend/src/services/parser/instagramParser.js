const { scrapeInstagram }    = require('./apifyClient');
const { extractEventData }   = require('./dataExtractor');
const { extractStaffFromPost } = require('./staffExtractor');
const { parseHighlights }    = require('./highlightsParser');
const eventsRepo             = require('../../db/eventsRepo');
const staffRepo              = require('../../db/staffRepo');
const hubs                   = require('../../config/hubs');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function parseHub(hub) {
  console.log(`\n🔍 Парсим хаб: ${hub.city} (@${hub.handle})`);

  const posts = await scrapeInstagram(hub.handle, 30);
  console.log(`\n--- CAPTIONS @${hub.handle} ---`);
  posts.forEach((p, i) => {
    console.log(`\n[${i+1}] ${p.timestamp}`);
    console.log(p.caption?.slice(0, 200));
  });
  console.log('--- END ---\n');
  let savedEvents = 0;
  let savedStaff  = 0;


  for (const post of posts) {
    // 1. Извлекаем события
    const event = await extractEventData(post, hub.city);
    if (event) {
      eventsRepo.upsert(event);
      savedEvents++;
      console.log(`Событие: ${event.title || 'без названия'} | ${event.event_date || '—'}`);
    }

    // 2. Извлекаем сотрудников (текст + изображение) с контекстом хаба
    const staff = await extractStaffFromPost(post, hub.city, hub.handle);
    if (staff.length) {
      staff.forEach(s => {
        staffRepo.upsert(s);
        savedStaff++;
        console.log(`  👤 Сотрудник: ${s.name} · ${s.role}`);
      });
    }

    await sleep(500);
  }

  // 3. Парсим highlights отдельно
  await parseHighlights(hub);

  console.log(`${hub.city}: событий ${savedEvents}, сотрудников ${savedStaff}`);
}

async function parseAllHubs() {
  console.log('Запуск парсинга всех хабов...');
  const start = Date.now();

  for (const hub of hubs) {
    await parseHub(hub);
    await sleep(2000);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nПарсинг завершён за ${elapsed}с`);
}



module.exports = { parseAllHubs, parseHub };