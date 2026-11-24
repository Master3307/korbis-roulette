import { neighbourPlan } from './neighbours';
import { WHEEL_ORDER } from './roulette';

describe('neighbourPlan (smart 2·2 neighbour calls)', () => {
  it('finds "17 with neighbours" when 2 25 17 34 6 are all in the pool', () => {
    const p = neighbourPlan([6, 34, 17, 25, 2, 11]);
    expect(p.calls).toEqual([{ center: 17, covers: [2, 25, 17, 34, 6] }]);
    expect(p.singles).toEqual([11]);
    expect(p.coveredBy.get(25)).toBe(0);
  });

  it('needs all five pockets – four in a row is not enough', () => {
    const p = neighbourPlan([2, 25, 17, 34]);
    expect(p.calls).toEqual([]);
    expect(p.singles).toEqual([2, 17, 25, 34]);
  });

  it('works across the 0 / 26 wrap-around of the wheel', () => {
    // wheel: … 3 26 | 0 32 15 …
    const p = neighbourPlan([3, 26, 0, 32, 15]);
    expect(p.calls).toEqual([{ center: 0, covers: [3, 26, 0, 32, 15] }]);
    expect(p.singles).toEqual([]);
  });

  it('cuts a long stretch into several non-overlapping calls', () => {
    const run = WHEEL_ORDER.slice(1, 12); // 11 pockets in a row
    const p = neighbourPlan(run);
    expect(p.calls.map((c) => c.center)).toEqual([WHEEL_ORDER[3], WHEEL_ORDER[8]]);
    expect(p.singles).toEqual([WHEEL_ORDER[11]]);
    const covered = p.calls.flatMap((c) => c.covers);
    expect(new Set(covered).size).toBe(covered.length);
  });

  it('every pool number is either covered once or a single', () => {
    const pool = [17, 5, 32, 0, 8, 23, 11, 36, 2, 25, 14, 9, 1, 30, 4, 19, 6, 27, 13, 34, 21, 15, 22, 3];
    const p = neighbourPlan(pool);
    const covered = p.calls.flatMap((c) => c.covers);
    expect([...covered, ...p.singles].sort((a, b) => a - b)).toEqual([...pool].sort((a, b) => a - b));
  });

  it('handles an empty pool and a pool of 36', () => {
    expect(neighbourPlan([])).toEqual({ calls: [], singles: [], coveredBy: new Map() });
    const all36 = WHEEL_ORDER.filter((n) => n !== 0);
    const p = neighbourPlan(all36);
    expect(p.calls.length).toBe(7); // 36 in a row -> 7 × 5 + 1 single
    expect(p.singles.length).toBe(1);
  });
});
