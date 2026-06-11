const express    = require('express');
const router     = express.Router();
const adminAuth  = require('../middleware/adminAuth');
const { parseAllHubs, parseHub } = require('../services/parser/instagramParser');
const hubs       = require('../config/hubs');

// POST /api/ingest/instagram
router.post('/instagram', adminAuth, async (req, res) => {
  const { city } = req.body;
  res.json({ message: 'Парсинг запущен', city: city || 'все' });

  if (city) {
    const hub = hubs.find(h => h.city === city);
    if (hub) parseHub(hub).catch(console.error);
  } else {
    parseAllHubs().catch(console.error);
  }
});

module.exports = router;