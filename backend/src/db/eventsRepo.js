const { load, save } = require('./database');

const eventsRepo = {

  upsert(event) {
    const db  = load();
    const idx = db.events.findIndex(
      e => e.instagram_post_id === event.instagram_post_id
    );
    if (idx >= 0) {
      console.log(`  [DB] Пропускаем дубль: ${event.instagram_post_id}`);
      return;
    }
    db.events.push({ ...event, id: Date.now(), created_at: new Date().toISOString() });
    save(db);
  },

  // Предстоящие — строго будущие
  getUpcoming(city) {
    const db    = load();
    const today = new Date().toISOString().split('T')[0];
    return db.events
      .filter(e => e.hub_city === city && e.event_date >= today)
      .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''))
      .slice(0, 20);
  },

  // Последние актуальные — будущие + последние 30 дней
  getRecent(city) {
    const db     = load();
    const today  = new Date().toISOString().split('T')[0];
    const month  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return db.events
      .filter(e => e.hub_city === city && (e.event_date >= month || !e.event_date))
      .sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))
      .slice(0, 20);
  },

  getByCity(city, limit = 50) {
    const db = load();
    return db.events
      .filter(e => e.hub_city === city)
      .sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))
      .slice(0, limit);
  },

  getAll() {
    return load().events;
  },

};

module.exports = eventsRepo;