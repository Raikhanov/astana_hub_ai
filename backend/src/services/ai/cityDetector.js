const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function detectCity(message, currentCity = null) {
  if (!message) return currentCity;

  const prompt = `
Из сообщения пользователя определи город казахстанского инновационного хаба.

Верни ТОЛЬКО JSON: { "city": "английское название или null" }

Маппинг (все варианты → английское название):
Астана / Нур-Султан / Astana → "Astana"
Алматы / Алма-Ата / Almaty → "Almaty"
Алатау / Alatau → "Alatau"
Шымкент / Shymkent → "Shymkent"
Тараз / Жамбыл / Zhambyl / Taraz → "Zhambyl"
Қызылорда / Кызылорда / Kyzylorda → "Kyzylorda"
Атырау / Atyrau → "Atyrau"
Павлодар / Pavlodar → "Pavlodar"
Уральск / Орал / Uralsk / Batys → "Uralsk"
Өскемен / Усть-Каменогорск / Oskemen → "Oskemen"
Жетісу / Жетису / Jetisu → "Jetisu"
Маңғыстау / Мангистау / Mangystau → "Mangystau"
Түркістан / Туркестан / Turkistan → "Turkistan"
Ұлытау / Улытау / Ulytau → "Ulytau"
Ақтөбе / Актобе / Aqtobe → "Aqtobe"
Ақмола / Акмола / Aqmola → "Aqmola"
Петропавл / Петропавловск / Petropavl → "Petropavl"
Қостанай / Костанай / Qostanai → "Qostanai"

Если город не упомянут → null

Сообщение: "${message}"
`;

  try {
    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0,
      max_tokens:      50,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(completion.choices[0].message.content);
    return result.city || currentCity;
  } catch {
    return currentCity;
  }
}

module.exports = { detectCity };