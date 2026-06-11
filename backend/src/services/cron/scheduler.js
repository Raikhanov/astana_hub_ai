// src/services/cron/scheduler.js
const cron = require('node-cron');
const { parseAllHubs } = require('../parser/instagramParser');

// Каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Starting Instagram parse...');
  await parseAllHubs();
  console.log('[CRON] Done.');
});