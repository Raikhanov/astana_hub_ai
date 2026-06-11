const express    = require('express');
const router     = express.Router();
const eventsRepo = require('../db/eventsRepo');

// GET /api/notifications — события добавленные за последние 24 часа
router.get('/', (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const all   = eventsRepo.getAll();

  const fresh = all
    .filter(e => e.created_at && e.created_at >= since)
    .slice(0, 10)
    .map(e => ({
      id:    String(e.id),
      title: e.title   || 'Новое событие',
      city:  e.hub_city || '',
      date:  e.event_date || '',
    }));

  res.json(fresh);
});

module.exports = router;