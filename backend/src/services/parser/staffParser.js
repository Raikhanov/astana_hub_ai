require('dotenv').config();
const { ApifyClient } = require('apify-client');
const OpenAI          = require('openai');
const staffRepo       = require('../../db/staffRepo');
const hubs            = require('../../config/hubs');

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

// ─── Ключевые слова для постов о команде ─────────────────────────────────────
const TEAM_KEYWORDS = [
  'команда', 'team', 'staff', 'сотрудник',
  'директор', 'менеджер', 'coordinator', 'координатор',
  'познакомьтесь', 'meet', 'біздің команда', 'хаб жетекші',
  'наш директор', 'наш менеджер', 'руководитель хаба',
  'hub team', 'our team', 'жетекші', 'басшы', 'үйлестіруші',
  'біздің хаб', 'хаб ұжымы', 'жұмысшылар', 'қызметкерлер',
];

function isTeamPost(caption) {
  if (!caption) return false;
  const lower = caption.toLowerCase();
  return TEAM_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Запрещённые роли ────────────────────────────────────────────────────────
const BANNED_ROLES = [
  'спикер', 'speaker', 'founder', 'ceo', 'cto', 'coo',
  'стартап', 'ментор', 'mentor', 'эксперт', 'expert',
  'гость', 'guest', 'участник', 'participant',
  'тренер', 'trainer', 'инвестор', 'investor',
  'партнер', 'partner', 'выпускник', 'түлек',
  'основатель', 'сооснователь', 'co-founder',
  'предприниматель', 'кәсіпкер', 'блогер', 'креатор',
  'негізін қалаушы', 'сарапшы', 'жаттықтырушы',
  'спикері', 'қонақ', 'қатысушы', 'тәлімгер',
];

function isValidHubStaff(staff) {
  const role = (staff.role || '').toLowerCase();
  return !BANNED_ROLES.some(word => role.includes(word));
}

// ─── Bio профиля ─────────────────────────────────────────────────────────────
async function scrapeProfileBio(hub) {
  console.log(`  [Bio] Парсим профиль @${hub.handle}...`);
  try {
    const run = await client.actor('apify/instagram-profile-scraper').call({
      username: [hub.handle],
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items.length) return null;
    const profile = items[0];
    return {
      bio:      profile.biography || profile.bio || '',
      fullName: profile.fullName  || profile.full_name || '',
      handle:   hub.handle,
    };
  } catch (err) {
    console.warn(`  [Bio] @${hub.handle} недоступен:`, err.message);
    return null;
  }
}

// ─── Посты о команде ─────────────────────────────────────────────────────────
async function scrapeTeamPosts(hub) {
  console.log(`  [Posts] Ищем посты о команде @${hub.handle}...`);
  try {
    const run = await client.actor('apify/instagram-post-scraper').call({
      username:    [hub.handle],
      resultsLimit: 30,
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const teamPosts = items.filter(p => isTeamPost(p.caption));
    console.log(`  [Posts] Постов о команде: ${teamPosts.length} из ${items.length}`);
    return teamPosts;
  } catch (err) {
    console.warn(`  [Posts] @${hub.handle} ошибка:`, err.message);
    return [];
  }
}

// ─── GPT: извлечение из bio ───────────────────────────────────────────────────
async function extractStaffFromBio(profile, city) {
  if (!profile?.bio && !profile?.fullName) return [];

  const prompt = `
Из bio Instagram-профиля инновационного хаба Казахстана (город ${city}, аккаунт @${profile.handle}) извлеки ШТАТНЫХ сотрудников хаба.
Верни ТОЛЬКО JSON: { "staff": [...] } или { "staff": [] }.

Формат:
{
  "name": "Имя Фамилия",
  "role": "должность на русском",
  "instagram_handle": "@username или null",
  "contact": "телефон/email/telegram или null"
}

Переводи казахские должности:
жетекші / хаб жетекшісі → Директор хаба
басшы → Руководитель
үйлестіруші → Координатор
тәлімгер → Ментор хаба
бағдарлама менеджері → Программный менеджер
оқыту менеджері → Менеджер обучения
аймақтық менеджер → Региональный менеджер
әкімші → Администратор

Включай ТОЛЬКО штатных сотрудников хаба: директор, менеджер, координатор, руководитель, администратор.
НЕ включай: спикеров, стартаперов, гостей, менторов, CEO/основателей внешних компаний, партнёров, инвесторов.

ЛУЧШЕ вернуть пустой список, чем включить НЕ сотрудника хаба.

Название: "${profile.fullName}"
Bio: """${profile.bio}"""
Instagram: @${profile.handle}
`;

  try {
    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0,
      max_tokens:      500,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (!result.staff?.length) return [];
    return result.staff
      .filter(s => s.name && isValidHubStaff(s))
      .map(s => ({ ...s, hub_city: city, source_type: 'profile_bio' }));
  } catch (err) {
    console.error(`  [GPT Bio] Ошибка:`, err.message);
    return [];
  }
}

// ─── GPT Vision: извлечение из картинки ──────────────────────────────────────
async function extractStaffFromImage(imageUrl, city, postId, hubHandle) {
  if (!imageUrl) return [];

  const prompt = `
Ты анализируешь фото из Instagram аккаунта @${hubHandle} — региональный инновационный хаб Казахстана, город ${city}.
Найди на изображении информацию о ШТАТНЫХ СОТРУДНИКАХ ЭТОГО ХАБА.

Верни ТОЛЬКО JSON:
{
  "staff": [
    {
      "name": "Имя Фамилия или null",
      "role": "должность на русском или null",
      "instagram_handle": "@username или null",
      "contact": "телефон/email/telegram или null"
    }
  ],
  "has_staff": true или false
}

Ищи:
- Подписи под фото людей с должностью
- Карточки сотрудников с именем и ролью
- Текст на баннере/постере: "Директор — Имя"
- Контактные данные сотрудников

Включай ТОЛЬКО: директор, менеджер, координатор, руководитель, администратор хаба.
НЕ включай: спикеров событий, участников программ, стартаперов, гостей, менторов, CEO внешних компаний.
Переводи казахские должности: жетекші→Директор, үйлестіруші→Координатор, басшы→Руководитель.

ЛУЧШЕ вернуть пустой список, чем включить НЕ сотрудника хаба.
Если сотрудников нет — { "staff": [], "has_staff": false }
`;

  try {
    const completion = await openai.chat.completions.create({
      model:      'gpt-4o',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (!result.has_staff || !result.staff?.length) return [];

    return result.staff
      .filter(s => (s.name || s.role) && isValidHubStaff(s))
      .map(s => ({
        ...s,
        hub_city:       city,
        source_type:    'post_image',
        source_post_id: postId,
      }));
  } catch (err) {
    // Instagram CDN ссылки протухают — молча пропускаем
    if (err.status === 400) return [];
    console.error(`  [Vision] Ошибка:`, err.message);
    return [];
  }
}

// ─── GPT: извлечение из текста поста ─────────────────────────────────────────
async function extractStaffFromText(caption, city, postId, hubHandle) {
  if (!caption || caption.trim().length < 10) return [];

  const prompt = `
Из Instagram-поста аккаунта @${hubHandle} (хаб в городе ${city}) извлеки ТОЛЬКО штатных сотрудников хаба.
Верни ТОЛЬКО JSON: { "staff": [...] } или { "staff": [] }.

Формат:
{
  "name": "Имя Фамилия",
  "role": "должность на русском",
  "instagram_handle": "@username или null",
  "contact": "телефон/email/telegram или null"
}

Включай ТОЛЬКО штатных сотрудников хаба: директор, менеджер, координатор, руководитель, администратор.
НЕ включай: спикеров событий, участников программ, стартаперов, гостей, менторов, тренеров, CEO/основателей внешних компаний, инвесторов, партнёров, блогеров, креаторов.

Переводи казахские должности:
жетекші / хаб жетекшісі → Директор хаба
үйлестіруші → Координатор
басшы → Руководитель
бағдарлама менеджері → Программный менеджер
оқыту менеджері → Менеджер обучения
аймақтық менеджер → Региональный менеджер

ПРИМЕРЫ ЛОЖНЫХ СРАБАТЫВАНИЙ (НЕ включать!):
❌ "Спикер — CEO компании X" → это спикер, не сотрудник хаба
❌ "Ментор — основатель стартапа Y" → это внешний ментор
❌ "Эксперт — UGC-креатор" → это гость

ЛУЧШЕ вернуть пустой список, чем включить НЕ сотрудника хаба.

Текст: """${caption}"""
`;

  try {
    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0,
      max_tokens:      500,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (!result.staff?.length) return [];
    return result.staff
      .filter(s => s.name && isValidHubStaff(s))
      .map(s => ({
        ...s,
        hub_city:       city,
        source_type:    'team_post',
        source_post_id: postId,
      }));
  } catch (err) {
    console.error(`  [GPT Text] Ошибка:`, err.message);
    return [];
  }
}

// ─── Мёрж без дублей (по нормализованному имени) ─────────────────────────────
function mergeStaff(fromText, fromImage) {
  const all  = [...fromText, ...fromImage];
  const seen = new Set();
  return all.filter(s => {
    const key = normalizeName(s.name);
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Один хаб ────────────────────────────────────────────────────────────────
async function parseStaffForHub(hub) {
  console.log(`\n👥 Сотрудники: ${hub.city} (@${hub.handle})`);
  let saved = 0;

  // 1. Bio профиля
  const profile = await scrapeProfileBio(hub);
  if (profile) {
    const staff = await extractStaffFromBio(profile, hub.city);
    for (const s of staff) {
      if (s.name) {
        staffRepo.upsert(s);
        saved++;
        console.log(` [Bio] ${s.name} · ${s.role}`);
      }
    }
  }

  await sleep(1000);

  // 2. Посты о команде — текст + картинка параллельно
  const teamPosts = await scrapeTeamPosts(hub);

  for (const post of teamPosts) {
    const postId   = post.id || post.shortCode;
    const imageUrl = post.displayUrl || post.thumbnailUrl || null;

    const [fromText, fromImage] = await Promise.all([
      extractStaffFromText(post.caption, hub.city, postId, hub.handle),
      extractStaffFromImage(imageUrl, hub.city, postId, hub.handle),
    ]);

    const merged = mergeStaff(fromText, fromImage);

    for (const s of merged) {
      if (s.name) {
        staffRepo.upsert(s);
        saved++;
        console.log(` [Post] ${s.name} · ${s.role} [${s.source_type}]`);
      }
    }

    await sleep(500);
  }

  console.log(` ${hub.city}: сохранено ${saved} сотрудников`);
}

// ─── Все хабы ─────────────────────────────────────────────────────────────────
async function parseAllStaff() {
  console.log('🚀 Парсинг сотрудников всех хабов...');
  const start = Date.now();

  for (const hub of hubs) {
    try {
      await parseStaffForHub(hub);
    } catch (err) {
      if (err.statusCode === 403) {
        console.error('Лимит Apify исчерпан.');
        break;
      }
      console.warn(`${hub.city} пропущен:`, err.message);
    }
    await sleep(2000);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nГотово за ${elapsed}с`);
}

module.exports = { parseAllStaff, parseStaffForHub };