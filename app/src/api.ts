const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  stats: () => get<import('./types').Stats>('/stats'),

  people: (params?: { q?: string; surname?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.surname) sp.set('surname', params.surname);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return get<{ total: number; page: number; rows: import('./types').Person[] }>(`/people${qs ? `?${qs}` : ''}`);
  },

  person: (id: number) => get<import('./types').PersonDetail>(`/people/${id}`),

  timeline: (params?: { type?: string; surname?: string; from?: number; to?: number; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.type) sp.set('type', params.type);
    if (params?.surname) sp.set('surname', params.surname);
    if (params?.from) sp.set('from', String(params.from));
    if (params?.to) sp.set('to', String(params.to));
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return get<{ total: number; page: number; rows: import('./types').FamilyEvent[] }>(`/timeline${qs ? `?${qs}` : ''}`);
  },

  surnames: () => get<import('./types').SurnameCount[]>('/surnames'),
  sources: () => get<Array<{ id: number; name: string; ref_number: string; citation_count: number }>>('/sources'),
  eventTypes: () => get<Array<{ event_type: string; count: number }>>('/event-types'),
};
