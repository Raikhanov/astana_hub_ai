const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractEventData(post, city) {
  if (!post.caption || post.caption.trim().length < 20) return null;

  // Берём год из реального timestamp поста
  const postYear = post.timestamp
    ? new Date(post.timestamp).getFullYear()
    : new Date().getFullYear();

  const prompt = `
Ты парсер Instagram-постов инновационных хабов Казахстана.
Из текста поста извлеки данные о мероприятии.

Верни ТОЛЬКО JSON объект. Если в посте нет мероприятия — верни { "no_event": true }.

ВАЖНО: Год мероприятия = ${postYear}. Используй только этот год при формировании даты.

Формат ответа:
{
  "title": "название мероприятия или null",
  "event_date": "YYYY-MM-DD где YYYY=${postYear}, или null",
  "event_time": "HH:MM или null",
  "format": "offline или online или hybrid или null",
  "address": "адрес если указан или null",
  "description": "краткое описание мероприятия 1-2 предложения"
}

Правила:
- format = "offline"  если: офлайн, живое, зал, адрес указан
- format = "online"   если: zoom, онлайн, трансляция, ссылка
- format = "hybrid"   если: оба варианта
- Дату ищи в тексте: "14 июня", "14.06", "14/06" и т.д.
- Время ищи: "14:00", "в 14ч", "в два часа дня" и т.д.

Текст поста:
"""${post.caption}"""
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (result.no_event) return null;

    return {
      hub_city:          city,
      instagram_post_id: post.id || post.shortCode,
      title:             result.title       || null,
      description:       result.description || null,
      event_date:        result.event_date  || null,
      event_time:        result.event_time  || null,
      format:            result.format      || null,
      address:           result.address     || null,
      hashtags:          JSON.stringify(post.hashtags || []),
      source_url:        post.url           || null,
      raw_caption:       post.caption,
      published_at:      post.timestamp     || null,
    };

  } catch (err) {
    console.error(`[Extractor] Ошибка:`, err.message);
    return null;
  }
}

module.exports = { extractEventData };