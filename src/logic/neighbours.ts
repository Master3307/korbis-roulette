import { WHEEL_ORDER } from './roulette';

/** Casino standard: a number with 2 neighbours on each side = 5 pockets. */
export const NB_SIDE = 2;

export interface NeighbourCall {
  /** The number you announce ("17 mit Nachbarn"). */
  center: number;
  /** The pockets it covers, in wheel order (left … center … right). */
  covers: number[];
}

export interface NeighbourPlan {
  calls: NeighbourCall[];
  /** Pool numbers not covered by a call, ascending. */
  singles: number[];
  /** number -> index of the call that covers it. */
  coveredBy: Map<number, number>;
}

/**
 * Smart neighbour detection: which pool numbers can be played as
 * "X mit Nachbarn" (X plus `side` neighbours left and right on the wheel)
 * without betting on a single number that is NOT in the pool?
 *
 * Looks for unbroken stretches of pool numbers around the wheel and cuts
 * each stretch into as many whole blocks of 2·side+1 as fit. Everything
 * left over is played as single numbers. Blocks never overlap, so no
 * number is bet twice.
 */
export function neighbourPlan(pool: readonly number[], side = NB_SIDE): NeighbourPlan {
  const inPool = new Set(pool);
  const block = 2 * side + 1;
  const calls: NeighbourCall[] = [];
  const coveredBy = new Map<number, number>();
  const W = WHEEL_ORDER.length;

  // Start right after a pocket that is not in the pool, so no stretch is split
  // at the wrap-around. (All 37 in the pool cannot happen: max pool is 36.)
  const start = WHEEL_ORDER.findIndex((n) => !inPool.has(n));
  if (start !== -1 && side >= 0) {
    let run: number[] = [];
    const flush = () => {
      for (let b = 0; b + block <= run.length; b += block) {
        const covers = run.slice(b, b + block);
        const idx = calls.push({ center: covers[side], covers }) - 1;
        covers.forEach((n) => coveredBy.set(n, idx));
      }
      run = [];
    };
    for (let i = 1; i <= W; i++) {
      const n = WHEEL_ORDER[(start + i) % W];
      if (inPool.has(n)) run.push(n);
      else flush();
    }
    flush();
  }

  const singles = [...inPool].filter((n) => !coveredBy.has(n)).sort((a, b) => a - b);
  return { calls, singles, coveredBy };
}
