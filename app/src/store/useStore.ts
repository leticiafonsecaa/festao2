import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: 'pending' | 'confirmed' | 'declined';
  plusOne: boolean;
  plusOneName?: string;
  table?: string;
  notes?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  category: string;
  image: string;
  options: GiftOption[];
  received: boolean;
  receivedBy?: string;
}

export interface GiftOption {
  store: string;
  price: number;
  url: string;
}

export interface EventPersonalization {
  primaryColor: string;
  secondaryColor: string;
  heroImage: string;
  tagline: string;
  showGuestCount: boolean;
  showGiftList: boolean;
  showRsvp: boolean;
  showCountdown: boolean;
}

export interface Event {
  id: string;
  name: string;
  type: 'casamento' | '15 anos' | 'aniversario' | 'corporativo' | 'outro';
  date: string;
  time: string;
  venue: string;
  city: string;
  description: string;
  hosts: string;
  guests: Guest[];
  gifts: GiftItem[];
  personalization: EventPersonalization;
  createdAt: string;
}

interface AppState {
  events: Event[];
  activeEventId: string | null;
  
  // Event actions
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'guests' | 'gifts' | 'personalization'>) => string;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setActiveEvent: (id: string | null) => void;
  getActiveEvent: () => Event | undefined;
  
  // Guest actions
  addGuest: (eventId: string, guest: Omit<Guest, 'id'>) => void;
  updateGuest: (eventId: string, guestId: string, updates: Partial<Guest>) => void;
  removeGuest: (eventId: string, guestId: string) => void;
  
  // Gift actions
  addGift: (eventId: string, gift: Omit<GiftItem, 'id'>) => void;
  updateGift: (eventId: string, giftId: string, updates: Partial<GiftItem>) => void;
  removeGift: (eventId: string, giftId: string) => void;
  toggleGiftReceived: (eventId: string, giftId: string, receivedBy?: string) => void;
  
  // Personalization
  updatePersonalization: (eventId: string, updates: Partial<EventPersonalization>) => void;
}

const defaultPersonalization: EventPersonalization = {
  primaryColor: '#D4A89C',
  secondaryColor: '#C47D6B',
  heroImage: '',
  tagline: 'Celebre conosco este momento especial',
  showGuestCount: true,
  showGiftList: true,
  showRsvp: true,
  showCountdown: true,
};

let idCounter = 0;
const genId = () => `${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      events: [],
      activeEventId: null,

      createEvent: (eventData) => {
        const id = genId();
        const newEvent: Event = {
          ...eventData,
          id,
          guests: [],
          gifts: [],
          personalization: { ...defaultPersonalization },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
          activeEventId: id,
        }));
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          activeEventId: state.activeEventId === id ? null : state.activeEventId,
        }));
      },

      setActiveEvent: (id) => set({ activeEventId: id }),

      getActiveEvent: () => {
        const state = get();
        return state.events.find((e) => e.id === state.activeEventId);
      },

      // Guests
      addGuest: (eventId, guestData) => {
        const guest: Guest = { ...guestData, id: genId() };
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, guests: [...e.guests, guest] }
              : e
          ),
        }));
      },

      updateGuest: (eventId, guestId, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  guests: e.guests.map((g) =>
                    g.id === guestId ? { ...g, ...updates } : g
                  ),
                }
              : e
          ),
        }));
      },

      removeGuest: (eventId, guestId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, guests: e.guests.filter((g) => g.id !== guestId) }
              : e
          ),
        }));
      },

      // Gifts
      addGift: (eventId, giftData) => {
        const gift: GiftItem = { ...giftData, id: genId() };
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, gifts: [...e.gifts, gift] }
              : e
          ),
        }));
      },

      updateGift: (eventId, giftId, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  gifts: e.gifts.map((g) =>
                    g.id === giftId ? { ...g, ...updates } : g
                  ),
                }
              : e
          ),
        }));
      },

      removeGift: (eventId, giftId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, gifts: e.gifts.filter((g) => g.id !== giftId) }
              : e
          ),
        }));
      },

      toggleGiftReceived: (eventId, giftId, receivedBy) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  gifts: e.gifts.map((g) =>
                    g.id === giftId
                      ? { ...g, received: !g.received, receivedBy: g.received ? undefined : receivedBy }
                      : g
                  ),
                }
              : e
          ),
        }));
      },

      // Personalization
      updatePersonalization: (eventId, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, personalization: { ...e.personalization, ...updates } }
              : e
          ),
        }));
      },
    }),
    {
      name: 'festsao-storage',
    }
  )
);
