import { analyzeSpins, clampPoolSize, currentPool, displayPool, type Spin } from './pool';

const spins = (nums: number[], size = 24): Spin[] => nums.map((n, i) => ({ n, t: i, size }));

describe('rolling pool', () => {
  it('fills from the top, newest first', () => {
    expect(currentPool(spins([5, 17, 32]), 24)).toEqual([32, 17, 5]);
  });

  it('a repeat jumps to the top and nothing drops out', () => {
    const { steps, recency } = analyzeSpins(spins([5, 17, 32, 5]));
    expect(recency).toEqual([5, 32, 17]);
    expect(steps[3].outcome).toEqual({ kind: 'hit', fromSlot: 3 });
  });

  it('a repeat already on top stays on top', () => {
    const { steps, recency } = analyzeSpins(spins([5, 17, 17]));
    expect(recency).toEqual([17, 5]);
    expect(steps[2].outcome).toEqual({ kind: 'hit', fromSlot: 1 });
  });

  it('a new number in a full pool pushes the oldest out', () => {
    const s = spins([1, 2, 3, 4], 3);
    const { steps } = analyzeSpins(s);
    expect(currentPool(s, 3)).toEqual([4, 3, 2]);
    expect(steps[3].outcome).toEqual({ kind: 'new', dropped: 1 });
  });

  it('a number that dropped out comes back as fresh on top', () => {
    const s = spins([1, 2, 3, 4, 1], 3);
    const { steps } = analyzeSpins(s);
    expect(steps[4].outcome).toEqual({ kind: 'new', dropped: 2 });
    expect(currentPool(s, 3)).toEqual([1, 4, 3]);
  });

  it('a hit keeps the pool from losing that number', () => {
    // 1 keeps coming back, so it never drops even though it was first.
    const s = spins([1, 2, 3, 1, 4, 5], 3);
    expect(currentPool(s, 3)).toEqual([5, 4, 1]);
  });

  it('works with the default 24 and a full 37 numbers', () => {
    const all = Array.from({ length: 37 }, (_, i) => i);
    const s = spins(all, 24);
    const pool = currentPool(s, 24);
    expect(pool).toHaveLength(24);
    expect(pool[0]).toBe(36);
    expect(pool[23]).toBe(13);
    const { steps } = analyzeSpins(s);
    expect(steps.filter((x) => x.outcome.kind === 'new' && x.outcome.dropped !== null)).toHaveLength(13);
  });

  it('shrinking the pool size mid-session drops the oldest', () => {
    const s = spins([1, 2, 3, 4, 5], 24);
    expect(currentPool(s, 3)).toEqual([5, 4, 3]);
  });

  it('a number outside a shrunk pool counts as new', () => {
    const s: Spin[] = [...spins([1, 2, 3, 4], 24), { n: 1, t: 9, size: 2 }];
    const { steps } = analyzeSpins(s);
    expect(steps[4].outcome).toEqual({ kind: 'new', dropped: 3 });
    expect(currentPool(s, 2)).toEqual([1, 4]);
  });

  it('undo = drop the last spin', () => {
    const s = spins([1, 2, 3, 4], 3);
    expect(currentPool(s.slice(0, -1), 3)).toEqual([3, 2, 1]);
  });

  it('clamps pool sizes', () => {
    expect(clampPoolSize(0)).toBe(1);
    expect(clampPoolSize(99)).toBe(36);
    expect(clampPoolSize(NaN)).toBe(24);
  });

  it('reports pool fill before each spin', () => {
    const { steps } = analyzeSpins(spins([1, 2, 1, 3], 2));
    expect(steps.map((x) => x.fillBefore)).toEqual([0, 1, 2, 2]);
  });
});

describe('matches a literal step-by-step implementation of the rules', () => {
  function literal(nums: number[], size: number) {
    const pool: number[] = [];
    for (const n of nums) {
      const i = pool.indexOf(n);
      if (i !== -1) {
        pool.splice(i, 1); // duplicate -> jump to top
      } else if (pool.length === size) {
        pool.pop(); // full -> the oldest drops out
      }
      pool.unshift(n);
    }
    return pool;
  }
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

  it.each([1, 5, 12, 18, 24, 30, 36])('pool size %i over 3000 random spins', (size) => {
    const nums: number[] = [];
    for (let k = 0; k < 3000; k++) {
      nums.push(Math.floor(rnd() * 37));
      expect(currentPool(spins(nums, size), size)).toEqual(literal(nums, size));
    }
  });
});

describe('displayPool', () => {
  it('keeps time order by default', () => {
    expect(displayPool([17, 5, 32], false)).toEqual([
      { n: 17, rank: 0 },
      { n: 5, rank: 1 },
      { n: 32, rank: 2 },
    ]);
  });
  it('sorts 0-36 and keeps each number\'s time rank', () => {
    expect(displayPool([17, 0, 32, 5], true)).toEqual([
      { n: 0, rank: 1 },
      { n: 5, rank: 3 },
      { n: 17, rank: 0 },
      { n: 32, rank: 2 },
    ]);
  });
  it('does not change the input', () => {
    const pool = [3, 1, 2];
    displayPool(pool, true);
    expect(pool).toEqual([3, 1, 2]);
  });
});
