import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { clampPoolSize, DEFAULT_POOL, type Spin } from './logic/pool';
import { isValidNumber } from './logic/roulette';
import { detectLang, STRINGS, type Lang } from './i18n/strings';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  endedAt: number | null;
  poolSize: number;
  /** Practice sessions are never counted in the overall statistics. */
  practice: boolean;
  spins: Spin[];
}

export type TextScale = 1 | 1.15 | 1.3;
export type Tab = 'play' | 'stats' | 'sessions' | 'settings';

export interface Settings {
  lang: Lang;
  textScale: TextScale;
  haptics: boolean;
  keepAwake: boolean;
  defaultPoolSize: number;
}

interface State {
  sessions: Session[];
  activeId: string | null;
  settings: Settings;
  tab: Tab;
  /** Session shown on the stats screen (null = active / latest). Not persisted. */
  viewSessionId: string | null;
  hydrated: boolean;

  setTab(tab: Tab): void;
  showSessionStats(id: string): void;
  startSession(opts: { name?: string; poolSize: number; practice: boolean }): void;
  addSpin(n: number): void;
  undoSpin(): void;
  deleteSpin(sessionId: string, index: number): void;
  setPoolSize(size: number): void;
  updateSession(id: string, patch: Partial<Pick<Session, 'name' | 'practice'>>): void;
  endSession(): void;
  resumeSession(id: string): void;
  deleteSession(id: string): void;
  updateSettings(patch: Partial<Settings>): void;
  deleteAll(): void;
}

const prefsStorage: StateStorage = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function formatDateTime(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function patchActive(state: State, fn: (s: Session) => Session): Partial<State> {
  if (!state.activeId) return {};
  return {
    sessions: state.sessions.map((s) => (s.id === state.activeId ? { ...fn(s), updatedAt: Date.now() } : s)),
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      settings: {
        lang: detectLang(),
        textScale: 1.15,
        haptics: true,
        keepAwake: true,
        defaultPoolSize: DEFAULT_POOL,
      },
      tab: 'play',
      viewSessionId: null,
      hydrated: false,

      setTab: (tab) => set({ tab }),
      showSessionStats: (id) => set({ viewSessionId: id, tab: 'stats' }),

      startSession: ({ name, poolSize, practice }) => {
        const now = Date.now();
        const { lang } = get().settings;
        const session: Session = {
          id: uid(),
          name: name?.trim() || STRINGS[lang].defaultSessionName(formatDateTime(now, lang)),
          createdAt: now,
          updatedAt: now,
          endedAt: null,
          poolSize: clampPoolSize(poolSize),
          practice,
          spins: [],
        };
        set((st) => ({
          // Only one active session at a time: close the old one.
          sessions: [
            session,
            ...st.sessions.map((s) => (s.id === st.activeId && s.endedAt === null ? { ...s, endedAt: now } : s)),
          ],
          activeId: session.id,
          viewSessionId: null,
          tab: 'play',
        }));
      },

      addSpin: (n) => {
        if (!isValidNumber(n)) return;
        set((st) => patchActive(st, (s) => ({ ...s, spins: [...s.spins, { n, t: Date.now(), size: s.poolSize }] })));
      },

      undoSpin: () => set((st) => patchActive(st, (s) => ({ ...s, spins: s.spins.slice(0, -1) }))),

      deleteSpin: (sessionId, index) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === sessionId ? { ...s, spins: s.spins.filter((_, i) => i !== index), updatedAt: Date.now() } : s,
          ),
        })),

      setPoolSize: (size) => set((st) => patchActive(st, (s) => ({ ...s, poolSize: clampPoolSize(size) }))),

      updateSession: (id, patch) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...patch,
                  name: patch.name !== undefined ? patch.name.trim() || s.name : s.name,
                  updatedAt: Date.now(),
                }
              : s,
          ),
        })),

      endSession: () =>
        set((st) => ({
          ...patchActive(st, (s) => ({ ...s, endedAt: Date.now() })),
          activeId: null,
        })),

      resumeSession: (id) =>
        set((st) => {
          const now = Date.now();
          return {
            sessions: st.sessions.map((s) => {
              if (s.id === id) return { ...s, endedAt: null, updatedAt: now };
              if (s.id === st.activeId) return { ...s, endedAt: now };
              return s;
            }),
            activeId: id,
            tab: 'play',
          };
        }),

      deleteSession: (id) =>
        set((st) => ({
          sessions: st.sessions.filter((s) => s.id !== id),
          activeId: st.activeId === id ? null : st.activeId,
          viewSessionId: st.viewSessionId === id ? null : st.viewSessionId,
        })),

      updateSettings: (patch) =>
        set((st) => ({
          settings: {
            ...st.settings,
            ...patch,
            defaultPoolSize: clampPoolSize(patch.defaultPoolSize ?? st.settings.defaultPoolSize),
          },
        })),

      deleteAll: () => set({ sessions: [], activeId: null, viewSessionId: null }),
    }),
    {
      name: 'korbis-roulette-v1',
      version: 1,
      storage: createJSONStorage(() => prefsStorage),
      partialize: (st) => ({ sessions: st.sessions, activeId: st.activeId, settings: st.settings }),
      merge: (persisted, current) => sanitize(persisted, current),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Defensive load: never crash on old or damaged data. */
function sanitize(persisted: unknown, current: State): State {
  const p = (persisted ?? {}) as Partial<State>;
  const sessions = Array.isArray(p.sessions)
    ? p.sessions
        .filter((s): s is Session => !!s && typeof s.id === 'string')
        .map((s) => ({
          ...s,
          name: String(s.name ?? ''),
          poolSize: clampPoolSize(s.poolSize),
          practice: !!s.practice,
          endedAt: s.endedAt ?? null,
          spins: Array.isArray(s.spins)
            ? s.spins
                .filter((x) => x && isValidNumber(x.n))
                .map((x) => ({ n: x.n, t: Number(x.t) || 0, size: clampPoolSize(x.size) }))
            : [],
        }))
    : [];
  const activeId = sessions.some((s) => s.id === p.activeId) ? (p.activeId as string) : null;
  return {
    ...current,
    sessions,
    activeId,
    settings: { ...current.settings, ...(p.settings ?? {}) },
  };
}

export const useActiveSession = () =>
  useStore((st) => st.sessions.find((s) => s.id === st.activeId) ?? null);

export const useT = () => STRINGS[useStore((st) => st.settings.lang)];
