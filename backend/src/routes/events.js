const express    = require('express');
const router     = express.Router();
const eventsRepo = require('../db/eventsRepo');

router.get('/', (req, res) => {
  const { city, format, query, limit } = req.query;

  let events = city ? eventsRepo.getByCity(city, 200) : eventsRepo.getAll();

  if (format) {
    events = events.filter(e =>
      e.format?.toLowerCase() === format.toLowerCase()
    );
  }

  if (query) {
    const q = query.toLowerCase();
    events = events.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  }

  // Сортируем — сначала с датами, потом без
  events.sort((a, b) => {
    if (!a.event_date && !b.event_date) return 0;
    if (!a.event_date) return 1;
    if (!b.event_date) return -1;
    return a.event_date.localeCompare(b.event_date);
  });

  // Лимит — если передан явно, иначе все
  const maxItems = limit ? parseInt(limit) : events.length;
  const sliced   = events.slice(0, maxItems);

  res.json(sliced.map(normalizeEvent));
});

function normalizeEvent(e) {
  const now    = new Date();
  const eDate  = e.event_date ? new Date(e.event_date) : null;
  let status   = 'Upcoming';
  if (eDate) {
    if (eDate < now) status = 'Completed';
    const diff = Math.abs(eDate - now) / 36e5;
    if (diff < 3) status = 'Ongoing';
  }

  const formatMap = { offline: 'Offline', online: 'Online', hybrid: 'Hybrid' };

  return {
    id:          String(e.id || e.instagram_post_id),
    title:       e.title        || 'Без названия',
    date:        e.event_date   || e.published_at || '',
    time:        e.event_time   || '00:00',
    format:      formatMap[e.format?.toLowerCase()] || 'Offline',
    city:        e.hub_city     || 'Казахстан',
    address:     e.address      || 'Адрес не указан',
    description: e.description  || '',
    status,
    hub:         `${e.hub_city || ''} Hub`,
    tags:        (() => { try { return JSON.parse(e.hashtags || '[]'); } catch { return []; } })(),
    sourceUrl:   e.source_url   || '',
    publishedAt: e.published_at || '',
  };
}

module.exports = router;