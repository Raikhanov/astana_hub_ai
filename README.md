# Hub Events AI — Казахстан 🇰🇿

AI-агент для поиска актуальных событий и контактов региональных инновационных хабов Казахстана. Парсит Instagram-аккаунты хабов, извлекает мероприятия и сотрудников, отвечает на вопросы в свободной форме.

**Стек:** React + TypeScript · Node.js + Express · OpenAI API · Apify · JSON-хранилище

---

## Демо

> [Ссылка на задеплоенный проект](#) <!-- заменить после деплоя -->

**Пример диалога:**
```
Пользователь: Привет, я из Кызылорды. Что есть в ближайшее время?

AI-агент: Нашёл 3 мероприятия от Kyzylorda Hub:

[OFFLINE] AI Bootcamp воркшобы
📅 2026-06-01 · ⏰ 10:00 · 📍 ул. Абая 1
Практический воркшоп по искусственному интеллекту.

📸 Подробности в Instagram: https://www.instagram.com/kyzylordahub/

Пользователь: Кто директор хаба?

AI-агент: Команда Kyzylorda Hub:
— Жанарыс Тубекбаев · Директор
```

---

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
│  HeroSection · EventsSection · AIAssistant · AdminDash  │
│                    Vite + TypeScript                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼──────────────────────────────────┐
│                   BACKEND (Node.js)                     │
│                                                         │
│  /api/chat          — AI чат (OpenAI)                   │
│  /api/agent/query   — AI агент с региональным фильтром  │
│  /api/events        — список событий                    │
│  /api/people        — сотрудники хабов                  │
│  /api/hubs          — список хабов                      │
│  /api/stats         — статистика                        │
│  /api/notifications — новые события за 24ч              │
│  /api/ingest/instagram — запуск парсинга                │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼────────────────────────┐
│   OpenAI GPT-4o     │  │      data/db.json               │
│   - Chat agent      │  │   { events: [], staff: [] }     │
│   - City detection  │  │   JSON-файл (локальная БД)      │
│   - Staff extract   │  └────────────────────────────────┘
│   - Event extract   │
└─────────────────────┘
           │
┌──────────▼──────────┐
│   Apify Scraper     │
│   instagram-post-   │
│   scraper actor     │
└─────────────────────┘
```

---

## Структура проекта

```
astana_hub_ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── hubs.js              # список 17 хабов и их Instagram handles
│   │   ├── db/
│   │   │   ├── database.js          # JSON read/write
│   │   │   ├── eventsRepo.js        # CRUD событий
│   │   │   └── staffRepo.js         # CRUD сотрудников
│   │   ├── middleware/
│   │   │   └── adminAuth.js         # защита /api/ingest
│   │   ├── routes/
│   │   │   ├── agent.js             # GET /api/agent/query
│   │   │   ├── chat.js              # POST /api/chat
│   │   │   ├── events.js            # GET /api/events
│   │   │   ├── hubs.js              # GET /api/hubs
│   │   │   ├── ingest.js            # POST /api/ingest/instagram
│   │   │   ├── notifications.js     # GET /api/notifications
│   │   │   ├── people.js            # GET /api/people
│   │   │   └── stats.js             # GET /api/stats
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── agentPrompt.js   # system prompt с данными из БД
│   │   │   │   └── cityDetector.js  # определение города через GPT
│   │   │   └── parser/
│   │   │       ├── apifyClient.js       # Apify API wrapper
│   │   │       ├── dataExtractor.js     # извлечение событий из постов
│   │   │       ├── instagramParser.js   # парсинг постов
│   │   │       └── staffParser.js       # парсинг сотрудников
│   │   ├── scripts/
│   │   │   ├── runParser.js         # npm run parse
│   │   │   ├── runStaffParser.js    # npm run parse:staff
│   │   │   └── parseLocalStaff.js   # npm run parse:local-staff
│   │   └── server.js
│   ├── data/
│   │   ├── db.json                  # основная БД (events + staff)
│   │   ├── astana.hub/              # локальные данные Instagram
│   │   │   ├── profile.json
│   │   │   └── posts/
│   │   └── ...                      # папки остальных 16 хабов
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── AIAssistant.tsx      # чат с AI-агентом
    │   │   │   ├── AdminDashboard.tsx   # дашборд с таблицей событий
    │   │   │   ├── EventCard.tsx        # карточка события
    │   │   │   ├── EventsSection.tsx    # список событий с фильтрами
    │   │   │   ├── Header.tsx
    │   │   │   ├── HeroSection.tsx
    │   │   │   ├── MobileNav.tsx
    │   │   │   └── StatsSection.tsx
    │   │   └── App.tsx
    │   ├── data/
    │   │   └── types.ts             # HubEvent, TeamMember, CITIES
    │   └── lib/
    │       └── api.ts               # fetch-обёртки, нормализация данных
    └── package.json
```

---

## Как работает парсинг

### События
```
Instagram посты (Apify / локальные JSON)
        ↓
dataExtractor.js — GPT-4o-mini извлекает:
  title, event_date, event_time, format, address, description
        ↓
eventsRepo.upsert() — сохраняет в data/db.json
```

### Сотрудники
```
1. profile.json каждого хаба (bio профиля)
2. Посты с паттернами "наш директор", "познакомьтесь", "біздің жетекші"
        ↓
GPT-4o-mini — извлекает только штатных сотрудников хаба
  (директор, менеджер, координатор — без спикеров и гостей)
        ↓
staffRepo.upsert() — дедупликация по имени + городу
```

### AI-агент
```
Пользователь пишет вопрос
        ↓
cityDetector.js — GPT определяет город (Тараз → "Zhambyl")
        ↓
agentPrompt.js — собирает system prompt:
  - события из eventsRepo.getRecent(city)
  - сотрудники из staffRepo.getByCity(city)
        ↓
GPT-4o-mini генерирует ответ
        ↓
Пользователь получает форматированный ответ
```

---

## Региональные хабы (17 хабов)

| Город | Instagram |
|-------|-----------|
| Astana | @astana.hub |
| Almaty | @almaty_hub |
| Alatau | @alatau.hub |
| Shymkent | @shymkent__hub |
| Zhambyl | @zhambyl_hub |
| Kyzylorda | @kyzylordahub |
| Atyrau | @atyrau_it_hub |
| Pavlodar | @pavlodar.hub |
| Uralsk | @batys.hub |
| Oskemen | @oskemen.hub |
| Jetisu | @jetisu_digital |
| Mangystau | @mangystau.hub |
| Turkistan | @turkistan.hub |
| Ulytau | @ulytau.hub |
| Aqtobe | @aqtobe.hub |
| Aqmola | @aqmola.hub |
| Petropavl | @sko_hub |

---

## Запуск локально

### Backend

```bash
cd backend
npm install

# Создать .env
cp .env.example .env
# Заполнить: OPENAI_API_KEY, APIFY_TOKEN, ADMIN_SECRET
```

```bash
# Парсинг событий из Instagram (через Apify)
npm run parse

# Парсинг с конкретного города
npm run parse -- Astana

# Парсинг сотрудников из локальных данных
npm run parse:local-staff

# Запуск сервера
npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Создать .env
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env

npm run dev
```

---

## API endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/events?city=Astana&format=offline` | Список событий с фильтрами |
| `GET` | `/api/people?city=Astana` | Сотрудники хаба |
| `GET` | `/api/hubs` | Все хабы со счётчиками |
| `GET` | `/api/stats` | Общая статистика |
| `GET` | `/api/notifications` | Новые события за 24ч |
| `GET` | `/api/agent/query?question=...&city=...` | AI-агент |
| `POST` | `/api/chat` | AI чат (история сообщений) |
| `POST` | `/api/ingest/instagram` | Запуск парсинга (требует `x-admin-secret`) |
| `GET` | `/health` | Health check |

---

## Переменные окружения

```env
# backend/.env
OPENAI_API_KEY=sk-...
APIFY_TOKEN=apify_api_...
ADMIN_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
```

```env
# frontend/.env
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

---

## Деплой

**Backend → Railway**
```bash
# railway.toml уже настроен
# Добавь переменные окружения в Railway Dashboard
```

**Frontend → Vercel**
```bash
cd frontend
vercel --prod
# Добавь VITE_API_BASE_URL в Vercel Environment Variables
```

---

## Бонус-фичи реализованные

- ✅ Авто-обновление по cron (каждые 6 часов)
- ✅ Уведомления о новых событиях (`/api/notifications`)
- ✅ Мобильная версия (responsive + MobileNav)
- ✅ Поиск по всем хабам сразу
- ✅ Интерфейс на русском и казахском языках

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js 20+, Express.js |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| Парсер | Apify instagram-post-scraper |
| База данных | JSON-файл (data/db.json) |
| Cron | node-cron |
| Деплой | Railway (backend), Vercel (frontend) |

---

*Astana Hub · Regional Development Office · 2025*
