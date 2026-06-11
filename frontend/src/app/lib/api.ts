import type { HubEvent, TeamMember } from '../data/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function normalizeFormat(format?: string): HubEvent['format'] {
  switch ((format || '').toLowerCase()) {
    case 'online':
      return 'Online';
    case 'hybrid':
      return 'Hybrid';
    case 'offline':
    default:
      return 'Offline';
  }
}

function normalizeEvent(raw: any): HubEvent {
  return {
    id: raw.id || raw.title,
    title: raw.title || 'Без названия',
    date: raw.date || raw.publishedAt || '',
    time: raw.time || '00:00',
    format: normalizeFormat(raw.format),
    city: raw.city || raw.hub?.city || 'Казахстан',
    address: raw.address || raw.location || 'Адрес не указан',
    description: raw.description || raw.summary || '',
    status: 'Upcoming',
    hub: raw.hub?.name || raw.hubName || raw.city || 'Hub',
    tags: raw.hashtags || raw.tags || [],
    sourceUrl: raw.sourceUrl || raw.url || raw.instagramUrl || (raw.hub?.instagramAccount ? `https://www.instagram.com/${raw.hub.instagramAccount}/` : ''),
  };
}

function normalizePerson(raw: any): TeamMember {
  const initials = (raw.name || 'HQ')
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0] || '')
    .join('')
    .toUpperCase();

  return {
    id: raw.id || raw.contact || raw.name,
    name: raw.name || 'Неизвестный сотрудник',
    role: raw.role || 'Сотрудник',
    email: raw.contact || 'Контакт не указан',
    phone: raw.phone || '—',
    city: raw.city || 'Казахстан',
    avatar: initials || 'HQ',
    hub: raw.hub?.name || raw.city || 'Hub',
    sourceUrl: raw.sourceUrl || (raw.instagramAccount ? `https://www.instagram.com/${raw.instagramAccount}/` : ''),
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchEvents(city = '', format = '', query = '') {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (format) params.set('format', format);
  if (query) params.set('query', query);

  try {
    const rawEvents = await getJson<any[]>(`/events${params.toString() ? `?${params.toString()}` : ''}`);
    return rawEvents.map(normalizeEvent);
  } catch {
    return [];
  }
}

export async function fetchPeople(city = '') {
  const params = new URLSearchParams();
  if (city) params.set('city', city);

  try {
    const rawPeople = await getJson<any[]>(`/people${params.toString() ? `?${params.toString()}` : ''}`);
    return rawPeople.map(normalizePerson);
  } catch {
    return [];
  }
}

export async function fetchHubs() {
  try {
    const rawHubs = await getJson<any[]>('/hubs');
    return rawHubs.map((hub) => ({
      city: hub.city || hub.region || 'Казахстан',
      name: hub.name || 'Hub',
      instagram: hub.instagramAccount ? `@${hub.instagramAccount}` : '@hub',
      address: hub.address || '',
      sourceUrl: hub.instagramUrl || (hub.instagramAccount ? `https://www.instagram.com/${hub.instagramAccount}/` : ''),
      members: Number(hub.employeeCount || 0),
      events: Number(hub.eventCount || 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchStats() {
  try {
    return await getJson<any>('/stats');
  } catch {
    return null;
  }
}

export async function fetchNotifications() {
  try {
    return await getJson<any[]>('/notifications');
  } catch {
    return [];
  }
}

export async function syncInstagram() {
  const response = await fetch(`${API_BASE}/ingest/instagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useExternal: true }),
  });
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  return response.json();
}

export interface AssistantReply {
  text: string;
  events: HubEvent[];
  member?: TeamMember;
}

export async function askAssistant(question: string, city = ''): Promise<AssistantReply> {
  try {
    const params = new URLSearchParams({ question });
    if (city) params.set('city', city);
    const result = await getJson<any>(`/agent/query?${params.toString()}`);
    return {
      text: result.answer || 'Я нашёл несколько вариантов.',
      events: (result.relevantEvents || []).map(normalizeEvent),
      member: result.relevantPeople?.[0] ? normalizePerson(result.relevantPeople[0]) : undefined,
    };
  } catch {
    return {
      text: 'Сейчас не удалось получить ответ от сервера. Попробуйте ещё раз или уточните вопрос по событиям, обучению или контактам.',
      events: [],
    };
  }
}
