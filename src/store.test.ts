// @vitest-environment jsdom
import { useStore } from './store';
import { analyzeSpins } from './logic/pool';

const st = () => useStore.getState();
const active = () => st().sessions.find((s) => s.id === st().activeId)!;

beforeEach(() => {
  useStore.setState({ sessions: [], activeId: null, viewSessionId: null, tab: 'play' });
});

describe('store', () => {
  it('starts a session with default name and pool size', () => {
    st().startSession({ poolSize: 24, practice: false });
    expect(active().poolSize).toBe(24);
    expect(active().name.length).toBeGreaterThan(3);
  });

  it('adds spins, rejects invalid numbers, undoes', () => {
    st().startSession({ poolSize: 3, practice: false });
    [1, 2, 3, 4].forEach((n) => st().addSpin(n));
    st().addSpin(37);
    st().addSpin(-1);
    st().addSpin(2.5);
    expect(active().spins.map((s) => s.n)).toEqual([1, 2, 3, 4]);
    st().undoSpin();
    expect(active().spins.map((s) => s.n)).toEqual([1, 2, 3]);
  });

  it('records the pool size active at each spin', () => {
    st().startSession({ poolSize: 5, practice: false });
    st().addSpin(1);
    st().setPoolSize(2);
    st().addSpin(2);
    expect(active().spins.map((s) => s.size)).toEqual([5, 2]);
  });

  it('starting a new session ends the old one', () => {
    st().startSession({ name: 'A', poolSize: 24, practice: false });
    const a = st().activeId;
    st().startSession({ name: 'B', poolSize: 24, practice: true });
    const old = st().sessions.find((s) => s.id === a)!;
    expect(old.endedAt).not.toBeNull();
    expect(active().name).toBe('B');
    expect(active().practice).toBe(true);
  });

  it('end, resume, rename (blank keeps name), delete', () => {
    st().startSession({ name: 'A', poolSize: 24, practice: false });
    const id = st().activeId!;
    st().endSession();
    expect(st().activeId).toBeNull();
    st().resumeSession(id);
    expect(st().activeId).toBe(id);
    expect(active().endedAt).toBeNull();
    st().updateSession(id, { name: '   ' });
    expect(active().name).toBe('A');
    st().updateSession(id, { name: ' Tisch 3 ', practice: true });
    expect(active().name).toBe('Tisch 3');
    expect(active().practice).toBe(true);
    st().deleteSession(id);
    expect(st().sessions).toHaveLength(0);
    expect(st().activeId).toBeNull();
  });

  it('adding a spin without an active session does nothing', () => {
    st().addSpin(5);
    expect(st().sessions).toHaveLength(0);
  });

  it('deleting a spin recomputes the pool', () => {
    st().startSession({ poolSize: 2, practice: false });
    [1, 2, 3].forEach((n) => st().addSpin(n));
    st().deleteSpin(st().activeId!, 2);
    expect(analyzeSpins(active().spins).recency.slice(0, 2)).toEqual([2, 1]);
  });

  it('loads damaged persisted data safely', async () => {
    const bad = {
      state: {
        sessions: [
          { id: 'x', name: 'ok', poolSize: 999, spins: [{ n: 5, t: 1, size: 24 }, { n: 99 }, null, { n: '3' }] },
          null,
          { foo: 1 },
        ],
        activeId: 'missing',
        settings: { lang: 'en' },
      },
      version: 1,
    };
    localStorage.setItem('CapacitorStorage.korbis-roulette-v1', JSON.stringify(bad));
    await useStore.persist.rehydrate();
    expect(st().sessions).toHaveLength(1);
    expect(st().sessions[0].poolSize).toBe(36);
    expect(st().sessions[0].spins.map((s) => s.n)).toEqual([5]);
    expect(st().activeId).toBeNull();
    expect(st().settings.lang).toBe('en');
    expect(st().settings.haptics).toBe(true);
  });
});
