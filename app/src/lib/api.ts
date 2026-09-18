// Cliente da API do Festão.
//
// Todas as telas devem falar com o servidor por aqui, em vez de guardar
// dados no localStorage. O token do login fica salvo no navegador e e
// enviado automaticamente em toda requisicao.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'festao-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: { campo: string; erro: string }[];

  constructor(status: number, message: string, details?: ApiError['details']) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const token = getToken();

  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // token vencido: derruba a sessao
    if (response.status === 401) setToken(null);
    throw new ApiError(response.status, data.error || 'Erro na requisicao', data.details);
  }

  return data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ---------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------

export type EventType =
  | 'casamento'
  | 'aniversario'
  | '15anos'
  | 'formatura'
  | 'cha-de-bebe'
  | 'cha-de-panela'
  | 'batizado'
  | 'corporativo'
  | 'outro';

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface Personalization {
  primaryColor: string;
  secondaryColor: string;
  heroImage: string;
  tagline: string;
  showGuestCount: boolean;
  showGiftList: boolean;
  showRsvp: boolean;
  showCountdown: boolean;
}

export interface EventItem {
  id: string;
  publicCode: string;
  name: string;
  type: EventType;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  description: string;
  hosts: string;
  coverImage: string;
  isPublished: boolean;
  features: string[];
  personalization: Personalization | null;
}

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp: RsvpStatus;
  plusOne: boolean;
  plusOneName: string | null;
  companions: number;
  tableName: string | null;
  dietaryNotes: string | null;
  notes: string | null;
  checkedIn: boolean;
  inviteToken: string;
}

export interface GiftOption {
  id: string;
  store: string;
  price: number;
  url: string;
}

export interface Gift {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  received: boolean;
  receivedBy: string | null;
  reservedByName: string | null;
  options: GiftOption[];
}

export interface Vendor {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  description: string;
  city: string;
  state: string;
  priceFrom: number | null;
  priceUnit: string;
  coverImage: string;
  isFeatured: boolean;
  ratingAvg: number;
  reviewCount: number;
  photos?: { id?: string; url: string; caption?: string }[];
}

export interface PublicGift {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  options: GiftOption[];
  taken: boolean;
}

export interface PublicEventInfo {
  id: string;
  publicCode: string;
  name: string;
  type: EventType;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  description: string;
  hosts: string;
  coverImage: string;
  personalization: Personalization | null;
}

export interface PublicGuest {
  id: string;
  name: string;
  rsvp: RsvpStatus;
  plusOne: boolean;
  plusOneName: string | null;
  companions: number;
  dietaryNotes: string | null;
  tableName: string | null;
  respondedAt: string | null;
}

// ---------------------------------------------------------------
// Chamadas
// ---------------------------------------------------------------

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; phone?: string }) =>
      post<{ user: User; token: string }>('/auth/register', body),
    login: (body: { email: string; password: string }) =>
      post<{ user: User; token: string }>('/auth/login', body),
    me: () => get<{ user: User; vendor: { id: string; businessName: string } | null }>('/auth/me'),
    logout: () => setToken(null),
  },

  events: {
    list: () => get<{ events: EventItem[] }>('/events'),
    create: (body: Partial<EventItem>) => post<{ event: EventItem }>('/events', body),
    get: (id: string) =>
      get<{ event: EventItem; summary: Record<string, never> }>(`/events/${id}`),
    update: (id: string, body: Partial<EventItem>) =>
      patch<{ event: EventItem }>(`/events/${id}`, body),
    remove: (id: string) => del<void>(`/events/${id}`),
    updatePersonalization: (id: string, body: Partial<Personalization>) =>
      patch<{ personalization: Personalization }>(`/events/${id}/personalization`, body),
    budget: (id: string) => get(`/events/${id}/budget`),
    addBudgetItem: (id: string, body: unknown) => post(`/events/${id}/budget`, body),
  },

  guests: {
    list: (eventId: string, params?: { rsvp?: RsvpStatus; q?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
      ).toString();
      return get<{ guests: Guest[]; stats: Record<string, number> }>(
        `/events/${eventId}/guests${qs ? `?${qs}` : ''}`
      );
    },
    create: (eventId: string, body: Partial<Guest>) =>
      post<{ guest: Guest }>(`/events/${eventId}/guests`, body),
    importMany: (eventId: string, guests: { name: string; email?: string; phone?: string }[]) =>
      post<{ createdCount: number; skipped: string[] }>(`/events/${eventId}/guests/import`, {
        guests,
      }),
    update: (eventId: string, guestId: string, body: Partial<Guest>) =>
      patch<{ guest: Guest }>(`/events/${eventId}/guests/${guestId}`, body),
    toggleCheckIn: (eventId: string, guestId: string) =>
      post<{ guest: Guest }>(`/events/${eventId}/guests/${guestId}/checkin`),
    remove: (eventId: string, guestId: string) =>
      del<void>(`/events/${eventId}/guests/${guestId}`),
  },

  gifts: {
    list: (eventId: string) =>
      get<{ gifts: Gift[]; stats: Record<string, number> }>(`/events/${eventId}/gifts`),
    create: (eventId: string, body: Partial<Gift>) =>
      post<{ gift: Gift }>(`/events/${eventId}/gifts`, body),
    update: (eventId: string, giftId: string, body: Partial<Gift>) =>
      patch<{ gift: Gift }>(`/events/${eventId}/gifts/${giftId}`, body),
    toggleReceived: (eventId: string, giftId: string, receivedBy?: string) =>
      post<{ gift: Gift }>(`/events/${eventId}/gifts/${giftId}/received`, { receivedBy }),
    clearReservation: (eventId: string, giftId: string) =>
      del<{ gift: Gift }>(`/events/${eventId}/gifts/${giftId}/reservation`),
    remove: (eventId: string, giftId: string) => del<void>(`/events/${eventId}/gifts/${giftId}`),
  },

  vendors: {
    search: (params: { category?: string; city?: string; q?: string; page?: number }) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as [string, string][]
      ).toString();
      return get<{ vendors: Vendor[]; total: number; pages: number }>(
        `/vendors${qs ? `?${qs}` : ''}`
      );
    },
    get: (idOrSlug: string) => get<{ vendor: Vendor }>(`/vendors/${idOrSlug}`),
    createProfile: (body: Partial<Vendor>) => post<{ vendor: Vendor }>('/vendors', body),
    myProfile: () => get<{ vendor: Vendor }>('/vendors/me'),
    updateProfile: (body: Partial<Vendor>) => patch<{ vendor: Vendor }>('/vendors/me', body),
    addPhoto: (body: { url: string; caption?: string }) => post('/vendors/me/photos', body),
    removePhoto: (photoId: string) => del<void>(`/vendors/me/photos/${photoId}`),
    myQuotes: () => get('/vendors/me/quotes'),
    replyQuote: (quoteId: string, body: unknown) => patch(`/vendors/me/quotes/${quoteId}`, body),
    requestQuote: (idOrSlug: string, body: unknown) => post(`/vendors/${idOrSlug}/quotes`, body),
    review: (idOrSlug: string, body: { rating: number; comment?: string }) =>
      post(`/vendors/${idOrSlug}/reviews`, body),
  },

  // Rotas que o convidado acessa sem login
  public: {
    event: (publicCode: string) =>
      get<{ event: PublicEventInfo; gifts: PublicGift[]; confirmedCount: number | null }>(
        `/public/events/${publicCode}`
      ),
    invite: (inviteToken: string) =>
      get<{ guest: PublicGuest; event: PublicEventInfo; gifts: PublicGift[] }>(
        `/public/invite/${inviteToken}`
      ),
    rsvp: (
      inviteToken: string,
      body: {
        rsvp: 'confirmed' | 'declined';
        plusOne?: boolean;
        plusOneName?: string;
        companions?: number;
        dietaryNotes?: string;
        phone?: string;
      }
    ) => post<{ guest: PublicGuest }>(`/public/invite/${inviteToken}/rsvp`, body),
    reserveGift: (giftId: string, body: { inviteToken?: string; name?: string }) =>
      post<{ gift: PublicGift }>(`/public/gifts/${giftId}/reserve`, body),
  },
};
