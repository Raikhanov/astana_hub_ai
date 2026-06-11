const express   = require('express');
const router    = express.Router();
const staffRepo = require('../db/staffRepo');

const REAL_ROLES = [
  'директор', 'director', 'руководитель', 'басшы', 'жетекші',
  'менеджер', 'manager', 'региональный менеджер',
  'основатель', 'негізін қалаушы', 'founder',
  'координатор', 'үйлестіруші', 'coordinator',
  'заместитель', 'орынбасар', 'deputy',
  'президент', 'president',
  'исполнительный директор', 'ceo',
];

function isRealStaff(role) {
  if (!role) return false;
  const r = role.toLowerCase();
  return REAL_ROLES.some(keyword => r.includes(keyword));
}

// GET /api/people?city=
router.get('/', (req, res) => {
  const { city } = req.query;
  const staff = city ? staffRepo.getByCity(city) : staffRepo.getAll();

  const filtered = staff
    .filter(s => isRealStaff(s.role))
    .map(normalizePerson);

  res.json(filtered);
});

function normalizePerson(s) {
  const initials = (s.name || 'HQ')
    .split(' ')
    .slice(0, 2)
    .map(p => p[0] || '')
    .join('')
    .toUpperCase();

  const instagramHandle = s.instagram_handle
    ? s.instagram_handle.replace('@', '')
    : null;

  return {
    id:        String(s.id || s.name),
    name:      s.name     || 'Неизвестный сотрудник',
    role:      s.role     || 'Сотрудник',
    email:     instagramHandle
      ? `https://www.instagram.com/${instagramHandle}/`
      : (s.contact || 'Контакт не указан'),
    phone:     s.phone    || '—',
    city:      s.hub_city || 'Казахстан',
    avatar:    initials,
    hub:       `${s.hub_city || ''} Hub`,
    sourceUrl: instagramHandle
      ? `https://www.instagram.com/${instagramHandle}/`
      : '',
    instagramHandle: instagramHandle ? `@${instagramHandle}` : null,
  };
}

module.exports = router;