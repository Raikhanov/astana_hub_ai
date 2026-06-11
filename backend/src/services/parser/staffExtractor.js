const OpenAI = require('openai');
const { analyzeImage } = require('./imageExtractor');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Нормализация казахских символов ─────────────────────────────────────────
const KZ_TRANSLIT = {
  'ұ': 'у', 'ү': 'у', 'қ': 'к', 'ө': 'о',
  'ә': 'а', 'і': 'и', 'ң': 'н', 'ғ': 'г',
  'һ': 'х', 'ё': 'е',
};

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[ұүқөәіңғһё]/g, c => KZ_TRANSLIT[c] || c)
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Список запрещённых ролей (рус + каз + англ) ─────────────────────────────
const BANNED_ROLES = [
  // русский
  'спикер', 'ментор', 'эксперт', 'гость', 'участник',
  'тренер', 'стартап', 'основатель', 'сооснователь',
  'предприниматель', 'инвестор', 'партнер', 'выпускник',
  'фаундер', 'автор', 'блогер', 'креатор',
  // казахский
  'спикері', 'негізін қалаушы', 'сарапшы', 'жаттықтырушы',
  'қонақ', 'қатысушы', 'түлек', 'кәсіпкер', 'тәлімгер',
  // английский
  'speaker', 'founder', 'co-founder', 'ceo', 'cto', 'coo', 'cfo',
  'mentor', 'expert', 'guest', 'participant', 'trainer',
  'investor', 'partner', 'graduate', 'entrepreneur',
  'blogger', 'creator', 'influencer',
];

function isValidHubStaff(staff) {
  const role = (staff.role || '').toLowerCase();
  const name = (staff.name || '').toLowerCase();

  // Если роль содержит запрещённое слово — отклоняем
  if (BANNED_ROLES.some(word => role.includes(word))) {
    return false;
  }

  // Если имя содержит название компании (не хаба) — отклоняем
  if (name.includes('компани') || name.includes('llc') || name.includes('inc')) {
    return false;
  }

  // Роль должна быть связана с хабом
  const hubRoles = [
    'директор', 'руководитель', 'менеджер', 'координатор',
    'администратор', 'хаб', 'hub',
    'жетекші', 'басшы', 'үйлестіруші', 'әкімші',
    'director', 'manager', 'coordinator', 'administrator',
    'программный', 'обучени', 'региональн',
    'бағдарлама', 'оқыту', 'аймақтық',
  ];

  // Если роль указана, она должна содержать хотя бы одно "хабовское" слово
  if (role && !hubRoles.some(r => role.includes(r))) {
    return false;
  }

  return true;
}

// ─── Промпт для извлечения из ТЕКСТА поста ───────────────────────────────────
function buildTextPrompt(hubHandle, city) {
  return `
Ты анализируешь Instagram-пост аккаунта @${hubHandle} — это региональный инновационный хаб Казахстана в городе ${city}.

ТВОЯ ЕДИНСТВЕННАЯ ЗАДАЧА — найти ШТАТНЫХ СОТРУДНИКОВ ЭТОГО ХАБА (${city} Hub / @${hubHandle}).

Текст может быть на русском, казахском или английском.

═══ КТО ЯВЛЯЕТСЯ СОТРУДНИКОМ ХАБА ═══

Только те, кто РАБОТАЕТ в хабе на постоянной основе:
- Директор хаба / Хаб жетекшісі
- Руководитель хаба / Басшы
- Координатор хаба / Үйлестіруші
- Менеджер хаба / программ / обучения
- Администратор хаба / Әкімші
- Региональный менеджер / Аймақтық менеджер

═══ КТО НЕ ЯВЛЯЕТСЯ СОТРУДНИКОМ ХАБА ═══

КАТЕГОРИЧЕСКИ НЕ включай:
- Спикеров мероприятий (даже если указана высокая должность)
- Менторов и тренеров программ
- CEO/CTO/основателей внешних компаний и стартапов
- Участников/выпускников программ
- Гостей мероприятий
- Инвесторов и партнёров
- Блогеров и креаторов

═══ ПРИМЕРЫ ЛОЖНЫХ СРАБАТЫВАНИЙ (НЕ включать!) ═══

❌ "Спикер — Асет Абдуалиев, CEO Silkroad Innovation Hub" → это СПИКЕР, не сотрудник хаба
❌ "Ментор программы — Алмас Х., основатель компании Y" → это ВНЕШНИЙ ментор
❌ "Эксперт: Науриза Бейсен — UGC-креатор" → это ПРИГЛАШЁННЫЙ гость
❌ "Жаттықтырушы: Арман Б. — IT компания директоры" → это тренер, не сотрудник
❌ "Regional Lead, Google" → это сотрудник Google, не хаба
❌ "AI-исследователь из Deep Tech LLC" → это сотрудник другой компании

═══ ПРИМЕРЫ ПРАВИЛЬНЫХ РЕЗУЛЬТАТОВ ═══

✅ "Директор ${city} Hub — Айгерим Касымова" → сотрудник хаба
✅ "Хаб жетекшісі — Нұрлан Ахметов" → сотрудник хаба
✅ "Менеджер обучения — Дана Сериковна" → сотрудник хаба
✅ "Координатор хаба — Асыл Жанат" → сотрудник хаба

═══ ПЕРЕВОДЫ КАЗАХСКИХ ДОЛЖНОСТЕЙ ═══

жетекші / хаб жетекшісі → Директор хаба
басшы → Руководитель
үйлестіруші → Координатор
бағдарлама менеджері → Программный менеджер
оқыту менеджері → Менеджер обучения
аймақтық менеджер → Региональный менеджер
әкімші → Администратор

═══ ФОРМАТ ОТВЕТА ═══

Верни ТОЛЬКО JSON:
{
  "staff": [
    {
      "name": "Имя Фамилия",
      "role": "должность на русском",
      "instagram_handle": "@username или null",
      "contact": "телефон/email/telegram или null",
      "person_type": "hub_staff",
      "confidence": 0.95
    }
  ]
}

Если сотрудников хаба нет — верни { "staff": [] }
ЛУЧШЕ вернуть пустой список, чем включить НЕ сотрудника.
`;
}

// ─── Промпт для извлечения из ИЗОБРАЖЕНИЯ ────────────────────────────────────
function buildImagePrompt(hubHandle, city) {
  return `
Ты анализируешь изображение из Instagram аккаунта @${hubHandle} — региональный инновационный хаб Казахстана, город ${city}.

Найди ТОЛЬКО ШТАТНЫХ СОТРУДНИКОВ ЭТОГО ХАБА.

НЕ включай:
- спикеров, менторов, тренеров, гостей
- CEO/основателей внешних компаний
- участников/выпускников программ
- инвесторов, партнёров, блогеров

Сотрудники хаба = директор, руководитель, координатор, менеджер, администратор хаба.

Текст на изображении может быть на русском, казахском или английском.
Переводи казахские должности: жетекші→Директор, басшы→Руководитель, үйлестіруші→Координатор.

Верни JSON:
{
  "staff": [
    {
      "name": "Имя Фамилия",
      "role": "должность на русском",
      "instagram_handle": null,
      "contact": null,
      "confidence": 0.95
    }
  ],
  "has_team_info": true
}

Если сотрудников нет: { "staff": [], "has_team_info": false }
ЛУЧШЕ вернуть пустой список, чем включить НЕ сотрудника.
`;
}

// ─── Извлечение из текста поста ──────────────────────────────────────────────
async function extractStaffFromText(caption, city, postId, hubHandle) {
  if (!caption || caption.trim().length < 10) {
    return [];
  }

  try {
    const systemPrompt = buildTextPrompt(hubHandle || 'unknown', city);
    const userContent = `Текст поста:\n\n"""${caption}"""`;

    const completion =
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 1000,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      });

    const result = JSON.parse(
      completion.choices[0].message.content
    );

    return (result.staff || [])
      .filter(
        s =>
          s.person_type === 'hub_staff' &&
          (s.confidence || 0) >= 0.85 &&
          isValidHubStaff(s) &&
          s.name  // должно быть имя
      )
      .map(s => ({
        ...s,
        hub_city: city,
        source_post_id: postId,
        source_type: 'post_text',
      }));

  } catch (err) {
    console.error(
      '[StaffExtractor] Ошибка текст:',
      err.message
    );
    return [];
  }
}

// ─── Извлечение из изображения поста ─────────────────────────────────────────
async function extractStaffFromImage(
  imageUrl,
  city,
  postId,
  hubHandle
) {
  if (!imageUrl) {
    return [];
  }

  try {
    const prompt = buildImagePrompt(hubHandle || 'unknown', city);
    const result = await analyzeImage(
      imageUrl,
      prompt
    );

    if (
      !result ||
      !result.has_team_info ||
      !result.staff?.length
    ) {
      return [];
    }

    return result.staff
      .filter(
        s =>
          (s.name || s.role) &&
          (s.confidence || 0.9) >= 0.85 &&
          isValidHubStaff(s)
      )
      .map(s => ({
        ...s,
        hub_city: city,
        source_post_id: postId,
        source_type: 'post_image',
      }));
  } catch (err) {
    console.error(
      '[StaffExtractor] Ошибка image:',
      err.message
    );
    return [];
  }
}

// ─── Обработка одного поста (текст + изображение) ────────────────────────────
async function extractStaffFromPost(post, city, hubHandle) {
  const postId =
    post.id ||
    post.shortCode ||
    post.code;

  const imageUrl =
    post.displayUrl ||
    post.thumbnailUrl ||
    post.imageUrl ||
    null;

  const [fromText, fromImage] =
    await Promise.all([
      extractStaffFromText(
        post.caption,
        city,
        postId,
        hubHandle
      ),
      extractStaffFromImage(
        imageUrl,
        city,
        postId,
        hubHandle
      ),
    ]);

  const all = [...fromText, ...fromImage];

  // Дедупликация по нормализованному имени (одно имя = один результат)
  const seen = new Set();

  return all.filter(s => {
    const key = normalizeName(s.name);

    if (!key) return false;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

module.exports = {
  extractStaffFromPost,
};