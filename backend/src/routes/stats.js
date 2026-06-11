const express  = require('express');
const router   = express.Router();
const hubs     = require('../config/hubs');
const { load } = require('../db/database');

// GET /api/stats
router.get('/', (req, res) => {
  const db = load();

  res.json({
    totalHubs:      hubs.length,
    totalEvents:    db.events.length,
    totalEmployees: db.staff.length,
    lastUpdated:    db.events.length
      ? db.events.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        )[0].created_at
      : null,
  });
});

module.exports = router;