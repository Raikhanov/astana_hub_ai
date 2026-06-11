const express               = require('express');
const router                = express.Router();
const OpenAI                = require('openai');
const { buildSystemPrompt } = require('../services/ai/agentPrompt');
const { detectCity }        = require('../services/ai/cityDetector');
const eventsRepo            = require('../db/eventsRepo');
const staffRepo             = require('../db/staffRepo');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/agent/query?question=...&city=...
router.get('/query', async (req, res) => {
  const { question = '', city: clientCity = '' } = req.query;

  if (!question.trim()) {
    return res.status(400).json({ error: 'question обязателен' });
  }

  try {
    // Определяем город
    const city = await detectCity(question, clientCity);

    console.log(`[Agent] Вопрос: "${question}" | Город: ${city || 'не определён'}`);

    const systemPrompt = buildSystemPrompt(city);

    const completion = await openai.chat.completions.create({
      model:    'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: question },
      ],
      temperature: 0.3,
      max_tokens:  1024,
    });

    const answer = completion.choices[0].message.content;

    // Релевантные данные для карточек на фронте
    const relevantEvents = city ? eventsRepo.getUpcoming(city).slice(0, 3) : [];
    const relevantPeople = city ? staffRepo.getByCity(city).slice(0, 3)    : [];

    res.json({ answer, city, relevantEvents, relevantPeople });

  } catch (err) {
    console.error('[Agent] Ошибка:', err.message);
    res.status(500).json({ error: 'AI сервис недоступен' });
  }
});

module.exports = router;