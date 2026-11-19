import type { Spin } from './pool';
import { computeStats, currentColorStreak, lawOfThird, mergeStats, ranked, spinsSinceLast } from './stats';
import { colorOf, expectedDistinct, neighbours, SECTORS, WHEEL_ORDER } from './roulette';

const spins = (nums: number[], size = 24): Spin[] => nums.map((n, i) => ({ n, t: i, size }));

describe('roulette facts', () => {
  it('wheel has every number exactly once', () => {
    expect([...WHEEL_ORDER].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i));
  });
  it('sectors cover the wheel exactly once', () => {
    const all = [...SECTORS.voisins, ...SECTORS.tiers, ...SECTORS.orphelins].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 37 }, (_, i) => i));
  });
  it('18 red, 18 black, 1 green', () => {
    const c = Array.from({ length: 37 }, (_, i) => colorOf(i));
    expect(c.filter((x) => x === 'red')).toHaveLength(18);
    expect(c.filter((x) => x === 'black')).toHaveLength(18);
  });
  it('neighbours wrap around zero', () => {
    expect(neighbours(0, 2)).toEqual([3, 26, 32, 15]);
  });
  it('law of the third expectation ≈ 23.6 for 37 spins', () => {
    expect(expectedDistinct(37)).toBeCloseTo(23.57, 1);
  });
});

describe('stats', () => {
  it('counts basics', () => {
    const s = computeStats(spins([0, 1, 2, 2, 36]));
    expect(s.total).toBe(5);
    expect(s.counts[2]).toBe(2);
    expect(s.green).toBe(1);
    expect(s.red).toBe(2); // 1, 36
    expect(s.black).toBe(2); // 2, 2
    expect(s.repeats).toBe(1);
    expect(s.dozens).toEqual([3, 0, 1]);
    expect(s.columns).toEqual([1, 2, 1]);
    expect(s.low + s.high).toBe(4);
  });

  it('pool hit rate', () => {
    const s = computeStats(spins([1, 2, 1, 3, 2], 2));
    // 1 new, 2 new, 1 hit, 3 new (drops 2), 2 new (drops 1)
    expect(s.poolHits).toBe(1);
    expect(s.poolFullSpins).toBe(3);
    expect(s.poolFullHits).toBe(1);
    expect(s.poolExpected).toBeCloseTo((0 + 1 + 2 + 2 + 2) / 37);
  });

  it('streaks and gaps', () => {
    const s = computeStats(spins([1, 3, 5, 2, 0, 1]));
    expect(s.longestColorStreak).toEqual({ key: 'red', length: 3 });
    expect(s.longestParityStreak).toEqual({ key: 'odd', length: 3 });
    expect(s.longestGap).toEqual({ n: 1, length: 4 });
  });

  it('merges sessions', () => {
    const m = mergeStats([computeStats(spins([1, 2])), computeStats(spins([1]))]);
    expect(m.total).toBe(3);
    expect(m.counts[1]).toBe(2);
  });

  it('spins since last', () => {
    const since = spinsSinceLast(spins([5, 7, 5, 9]));
    expect(since[9]).toBe(0);
    expect(since[5]).toBe(1);
    expect(since[7]).toBe(2);
    expect(since[1]).toBeNull();
  });

  it('current colour streak', () => {
    expect(currentColorStreak(spins([2, 1, 3]))).toEqual({ color: 'red', length: 2 });
    expect(currentColorStreak([])).toBeNull();
  });

  it('law of third window', () => {
    const r = lawOfThird(spins([1, 1, 2]));
    expect(r.distinct).toBe(2);
    expect(r.window).toBe(3);
  });

  it('ranked is stable', () => {
    const c = Array(37).fill(0);
    c[5] = 3;
    c[2] = 3;
    c[9] = 1;
    expect(ranked(c).slice(0, 3)).toEqual([2, 5, 9]);
  });
});
