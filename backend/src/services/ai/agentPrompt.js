const eventsRepo = require('../../db/eventsRepo');
const staffRepo  = require('../../db/staffRepo');
const hubs       = require('../../config/hubs');

function buildSystemPrompt(city) {
  const events = city ? eventsRepo.getRecent(city) : [];
  const staff  = city ? staffRepo.getByCity(city)  : [];
  const hub    = city ? hubs.find(h => h.city === city) : null;
  const igLink = hub  ? `https://www.instagram.com/${hub.handle}/` : null;

  const today = new Date().toISOString().split('T')[0];

  const eventsBlock = events.length
    ? events.map(e => {
        const isPast = e.event_date && e.event_date < today;
        const status = isPast ? '[ПРОШЛО]' : '[ПРЕДСТОИТ]';
        return `${status} [${(e.format || 'offline').toUpperCase()}] ${e.title || 'Без названия'}
  📅 ${e.event_date || '?'} · ⏰ ${e.event_time || '—'} · 📍 ${e.address || 'адрес не указан'}
  ${e.description || ''}`;
      }).join('\n\n')
    : 'СОБЫТИЙ НЕТ';

  const staffBlock = staff.length
    ? staff.map(s => `— ${s.name} · ${s.role}`).join('\n')
    : 'СОТРУДНИКОВ НЕТ';

  return `
Ты AI-ассистент региональных инновационных хабов Казахстана.
Отвечай на том же языке что пользователь (русский или казахский).

ГОРОД: ${city || 'не определён'}
INSTAGRAM ХАБА: ${igLink || 'не указан'}

━━━ МЕРОПРИЯТИЯ (${events.length}) ━━━
${eventsBlock}

━━━ КОМАНДА (${staff.length}) ━━━
${staffBlock}

ПРАВИЛА ОТВЕТА:

1. СОБЫТИЯ — когда спрашивают "что есть", "мероприятия", "что будет":
   Показывай так:
   [ФОРМАТ] Название
   📅 дата · ⏰ время · 📍 адрес
   описание
   
   В конце ВСЕГДА добавляй:
   📸 Подробности в Instagram: ${igLink || 'instagram хаба'}

2. КОМАНДА — ТОЛЬКО когда пользователь спрашивает "кто директор", "команда", "с кем связаться":
   Показывай так:
   Команда ${city ? city + ' Hub' : 'хаба'}:
   — Имя · Должность
   
   Контакты (instagram_handle) показывай ТОЛЬКО если пользователь явно попросил связаться или спросил контакт.
   
   В конце добавляй:
   📸 Instagram хаба: ${igLink || 'instagram хаба'}

3. НЕ показывай контакты сотрудников если не спросили
4. НЕ выдумывай данные — только из базы выше
5. Если город не определён — спроси
6. Если событий нет — скажи честно и дай ссылку на Instagram хаба
`.trim();
}

module.exports = { buildSystemPrompt };