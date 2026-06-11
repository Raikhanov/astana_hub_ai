require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events',        require('./routes/events'));
app.use('/api/people',        require('./routes/people'));
app.use('/api/hubs',          require('./routes/hubs'));
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/agent',         require('./routes/agent'));
app.use('/api/ingest',        require('./routes/ingest'));
app.use('/api/chat',          require('./routes/chat'));

app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Cron каждые 6 часов
cron.schedule('0 */6 * * *', () => {
  console.log('[CRON] Авто-парсинг...');
  require('./services/parser/instagramParser').parseAllHubs().catch(console.error);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));