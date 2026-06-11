require('dotenv').config();
const fs     = require('fs');
const path   = require('path');
const OpenAI = require('openai');
const { load, save } = require('../db/database');

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DATA_DIR = path.join(__dirname, '../../data');
const sleep    = (ms) => new Promise(r => setTimeout(r, ms));

const FOLDER_TO_CITY = {
  'alatau.hub':     'Alatau',
  'almaty_hub':     'Almaty',
  'aqmola.hub':     'Aqmola',
  'aqtobe.hub':     'Aqtobe',
  'astana.hub':     'Astana',
  'atyrau_it_hub':  'Atyrau',
  'batys.hub':      'Uralsk',
  'jetisu_digital': 'Jetisu',
  'kyzylordahub':   'Kyzylorda',
  'mangystau.hub':  'Mangystau',
  'oskemen.hub':    'Oskemen',
  'pavlodar.hub':   'Pavlodar',
  'qostanai.hub':   'Qostanai',
  'shymkent__hub':  'Shymkent',
  'sko_hub':        'Petropavl',
  'turkistan.hub':  'Turkistan',
  'ulytau.hub':     'Ulytau',
  'zhambyl_hub':    'Zhambyl',
};

// Паттерны которые означают "это наш сотрудник хаба"
const STAFF_PATTERNS = [
  // Русские
  'наш директор', 'наш менеджер', 'наш координатор', 'наш руководитель',
  'познакомьтесь с', 'представляем', 'наша команда',
  'директор хаба', 'менеджер хаба', 'руководитель хаба',
  'офис поддержки', 'команда хаба',
  // Казахские
  'біздің директор', 'біздің менеджер', 'біздің команда',
  'таныс болыңыздар', 'таныстырамыз', 'біздің жетекші',
  'хаб директоры', 'хаб менеджері', 'хаб жетекшісі',
  // Английские
  'meet our', 'our director', 'our manager', 'our team', 'hub director',
];

function isStaffPost(caption) {
  if (!caption) return false;
  const lower = caption.toLowerCase();
  return STAFF_PATTERNS.some(p => lower.includes(p));
}

function normalize(str) {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// ─── GPT: извлечение из поста ─────────────────────────────────────────────────
async function extractFromPost(caption, city, postId) {
  const prompt = `
Этот пост опубликован от имени регионального инновационного хаба Казахстана.
В посте хаб представляет СВОЕГО сотрудника.

Твоя задача: извлечь только того человека, которого хаб называет СВОИМ сотрудником.

Признаки что человек — сотрудник хаба:
- "наш директор X", "познакомьтесь с нашим директором X"
- "біздің директор X", "таныс болыңыздар — X, хаб директоры"
- "директор хаба X", "менеджер хаба X"
- Пост о команде хаба где перечислены сотрудники

НЕ включай если:
- Человек директор/основатель СВОЕЙ компании (партнёр, резидент, стартапер)
- Человек спикер мероприятия
- Человек гость, ментор со стороны, инвестор

Верни ТОЛЬКО JSON: { "staff": [] }
Формат: { "name": "Имя Фамилия", "role": "должность на русском", "instagram_handle": "@username или null", "contact": null }

Переводи: жетекші→Директор, үйлестіруші→Координатор, басшы→Руководитель
Если нет однозначного сотрудника хаба — верни { "staff": [] }

Текст поста:
"""${caption.slice(0, 2000)}"""
`;

  try {
    const res = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0,
      max_tokens:      300,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(res.choices[0].message.content);
    return (result.staff || [])
      .filter(s => s.name && s.name.length > 2)
      .map(s => ({ ...s, hub_city: city, source_type: 'staff_post', source_post_id: postId }));
  } catch (err) {
    console.error(`  [GPT] Ошибка:`, err.message);
    return [];
  }
}

// ─── GPT: извлечение из bio ───────────────────────────────────────────────────
async function extractFromBio(bio, fullName, handle, city) {
  if (!bio) return [];

  const prompt = `
Bio Instagram-профиля инновационного хаба Казахстана.
Извлеки сотрудников которых хаб указал прямо в bio.

Верни ТОЛЬКО JSON: { "staff": [] }
Формат: { "name": "Имя Фамилия", "role": "должность на русском", "instagram_handle": "@username или null", "contact": "телефон/telegram или null" }

Переводи: жетекші→Директор, үйлестіруші→Координатор, басшы→Руководитель
Если людей нет — { "staff": [] }

Bio: """${bio}"""
`;

  try {
    const res = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'user', content: prompt }],
      temperature:     0,
      max_tokens:      300,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(res.choices[0].message.content);
    return (result.staff || [])
      .filter(s => s.name && s.name.length > 2)
      .map(s => ({ ...s, hub_city: city, source_type: 'profile_bio' }));
  } catch (err) {
    console.error(`  [GPT Bio] Ошибка:`, err.message);
    return [];
  }
}

// ─── Сохранение без дублей ────────────────────────────────────────────────────
function saveStaff(newStaff) {
  const db = load();
  let added = 0;

  for (const member of newStaff) {
    if (!member.name) continue;
    const exists = db.staff.find(
      s => s.hub_city === member.hub_city &&
           normalize(s.name) === normalize(member.name)
    );
    if (exists) {
      exists.role             = exists.role             || member.role;
      exists.instagram_handle = exists.instagram_handle || member.instagram_handle;
      exists.contact          = exists.contact          || member.contact;
    } else {
      db.staff.push({ ...member, id: Date.now() + Math.random() });
      added++;
    }
  }

  save(db);
  return added;
}

// ─── Парсим один хаб ─────────────────────────────────────────────────────────
async function parseHub(folderName, city) {
  const hubDir      = path.join(DATA_DIR, folderName);
  const profilePath = path.join(hubDir, 'profile.json');
  const postsDir    = path.join(hubDir, 'posts');

  console.log(`\n👥 ${city} (@${folderName})`);

  // 1. Bio
  if (fs.existsSync(profilePath)) {
    try {
      const profile  = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
      const bio      = profile.biography || profile.bio || '';
      const fullName = profile.full_name || profile.fullName || '';
      const handle   = profile.username  || folderName;

      if (bio) {
        const staff = await extractFromBio(bio, fullName, handle, city);
        const added = saveStaff(staff);
        staff.forEach(s => console.log(`  ✅ [Bio] ${s.name} · ${s.role}`));
        if (!staff.length) console.log(`  ℹ️  Bio: сотрудников не найдено`);
        await sleep(300);
      }
    } catch (err) {
      console.warn(`  [Bio] Ошибка:`, err.message);
    }
  }

  // 2. Посты — только те где паттерн "наш директор/команда"
  if (fs.existsSync(postsDir)) {
    const files      = fs.readdirSync(postsDir).filter(f => f.endsWith('.json'));
    const staffPosts = [];

    for (const file of files) {
      try {
        const post    = JSON.parse(fs.readFileSync(path.join(postsDir, file), 'utf-8'));
        const caption = post.caption || post.iphone_struct?.caption?.text || '';
        if (isStaffPost(caption)) staffPosts.push({ file, caption, postId: post.shortcode || post.id });
      } catch {}
    }

    console.log(`  [Posts] Постов со staff-паттернами: ${staffPosts.length} из ${files.length}`);

    for (const { caption, postId, file } of staffPosts) {
      const staff = await extractFromPost(caption, city, postId);
      const added = saveStaff(staff);
      if (added) {
        staff.forEach(s => console.log(`  ✅ [Post] ${s.name} · ${s.role}`));
      }
      await sleep(300);
    }
  }
}

// ─── Главная ──────────────────────────────────────────────────────────────────
async function main() {
  const arg = process.argv[2];

  // Очищаем staff
  const db = load();
  db.staff = [];
  save(db);
  console.log('🗑️  Staff очищен\n');

  const entries = Object.entries(FOLDER_TO_CITY);
  let list = entries;

  if (arg) {
    const idx = entries.findIndex(([, city]) => city === arg);
    if (idx === -1) {
      console.error(`❌ Город "${arg}" не найден.`);
      entries.forEach(([, c]) => console.log(`  - ${c}`));
      process.exit(1);
    }
    list = entries.slice(idx);
  }

  console.log('🚀 Парсинг сотрудников...\n');
  const start = Date.now();

  for (const [folder, city] of list) {
    if (!fs.existsSync(path.join(DATA_DIR, folder))) {
      console.log(`⚠️  Не найдено: ${folder}`);
      continue;
    }
    await parseHub(folder, city);
    await sleep(500);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const finalDb = load();
  console.log(`\n✅ Готово за ${elapsed}с`);
  console.log(`👥 Итого сотрудников: ${finalDb.staff.length}`);
  console.log('\nПо городам:');
  const byCity = {};
  finalDb.staff.forEach(s => { byCity[s.hub_city] = (byCity[s.hub_city] || 0) + 1; });
  Object.entries(byCity).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('❌', err.message); process.exit(1); });