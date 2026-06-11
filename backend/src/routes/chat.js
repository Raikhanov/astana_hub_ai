const express        = require('express');
const router         = express.Router();
const OpenAI         = require('openai');
const { buildSystemPrompt } = require('../services/ai/agentPrompt');
const { detectCity }        = require('../services/ai/cityDetector');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/chat
router.post('/', async (req, res) => {
  const { messages = [], city: clientCity } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'messages обязательны' });
  }

  try {
    // Определяем город из последнего сообщения
    const lastMessage = messages[messages.length - 1]?.content || '';
    const city = await detectCity(lastMessage, clientCity);

    // Строим system prompt с данными из БД
    const systemPrompt = buildSystemPrompt(city);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens:  1024,
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply, city });

  } catch (err) {
    console.error('[Chat] Ошибка:', err.message);
    res.status(500).json({ error: 'AI сервис недоступен' });
  }
});

module.exports = router;