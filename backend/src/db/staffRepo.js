const { load, save } = require('./database');

// ─── Казахская транслитерация для нормализации ───────────────────────────────
const KZ_TRANSLIT = {
  'ұ': 'у', 'ү': 'у', 'қ': 'к', 'ө': 'о',
  'ә': 'а', 'і': 'и', 'ң': 'н', 'ғ': 'г',
  'һ': 'х', 'ё': 'е',
};

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[ұүқөәіңғһё]/g, c => KZ_TRANSLIT[c] || c)
    .replace(/\s+/g, ' ')
    .trim();
}

function isBetterRole(newRole, oldRole) {
  if (!oldRole) return true;
  if (!newRole) return false;

  const score = role => {
    role = (role || '').toLowerCase();

    if (role.includes('директор')) return 100;
    if (role.includes('руководитель')) return 90;
    if (role.includes('региональный')) return 85;
    if (role.includes('менеджер обучения')) return 80;
    if (role.includes('программный менеджер')) return 75;
    if (role.includes('менеджер')) return 70;
    if (role.includes('координатор')) return 60;
    if (role.includes('администратор')) return 50;

    return 10;
  };

  return score(newRole) > score(oldRole);
}

const staffRepo = {

  upsert(member) {

    if (!member?.name) {
      return;
    }

    const db = load();

    // Ищем дубль по нормализованному имени в рамках города
    const normalizedName = normalize(member.name);
    const idx = db.staff.findIndex(
      s =>
        s.hub_city === member.hub_city &&
        normalize(s.name) === normalizedName
    );

    if (idx >= 0) {

      const existing = db.staff[idx];

      db.staff[idx] = {
        ...existing,

        // Обновляем роль только если новая "лучше"
        role: isBetterRole(
          member.role,
          existing.role
        )
          ? member.role
          : existing.role,

        // Обновляем контактные данные только если у старой записи их нет
        instagram_handle:
          member.instagram_handle ||
          existing.instagram_handle,

        contact:
          member.contact ||
          existing.contact,

        source_type:
          member.source_type ||
          existing.source_type,

        source_post_id:
          member.source_post_id ||
          existing.source_post_id,

        updated_at:
          new Date().toISOString(),
      };

      save(db);
      return;
    }

    // Проверяем, нет ли такого же имени в другом городе (защита от кросс-дублей)
    const crossIdx = db.staff.findIndex(
      s => normalize(s.name) === normalizedName
    );

    // Если нашли в другом городе — это может быть другой человек, добавляем
    // (одинаковые имена в разных городах — это нормально)

    db.staff.push({
      id: Date.now(),

      name: member.name,

      role: member.role || null,

      instagram_handle:
        member.instagram_handle || null,

      contact:
        member.contact || null,

      hub_city:
        member.hub_city || null,

      source_type:
        member.source_type || null,

      source_post_id:
        member.source_post_id || null,

      created_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    });

    save(db);
  },

  getByCity(city) {
    return load().staff.filter(
      s => s.hub_city === city
    );
  },

  getDirector(city) {

    const staff =
      this.getByCity(city);

    return (
      staff.find(s =>
        (s.role || '')
          .toLowerCase()
          .includes('директор')
      ) || null
    );
  },

  getManagers(city) {

    return this.getByCity(city)
      .filter(
        s =>
          (s.role || '')
            .toLowerCase()
            .includes('менеджер')
      );
  },

  findByRole(city, keyword) {
    return this.getByCity(city).filter(s =>
      (s.role || '').toLowerCase().includes(keyword.toLowerCase())
    );
  },

  clearByCity(city) {
    const db = load();
    db.staff = db.staff.filter(s => s.hub_city !== city);
    save(db);
  },

  clearAll() {
    const db = load();
    db.staff = [];
    save(db);
  },

  getAll() {
    return load().staff;
  },

};

module.exports = staffRepo;