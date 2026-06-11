const express = require('express');
const router  = express.Router();
const hubs    = require('../config/hubs');
const { load } = require('../db/database');

// GET /api/hubs
router.get('/', (req, res) => {
  const db = load();

  const result = hubs.map(hub => {
    const eventCount  = db.events.filter(e => e.hub_city === hub.city).length;
    const staffCount  = db.staff.filter(s => s.hub_city  === hub.city).length;

    return {
      city:             hub.city,
      name:             `${hub.city} Hub`,
      instagramAccount: hub.handle,
      instagramUrl:     `https://www.instagram.com/${hub.handle}/`,
      address:          '',
      eventCount,
      employeeCount:    staffCount,
    };
  });

  res.json(result);
});

module.exports = router;