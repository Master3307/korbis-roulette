/**
 * Rolling number pool ("Stammzahlen").
 *
 * Rules:
 *  - The pool holds at most `size` distinct numbers, newest on top (index 0).
 *  - A number not currently in the pool is inserted on top. If the pool is
 *    full, the bottom number (the one that has not come for the longest
 *    time) drops out.
 *  - A number already in the pool jumps to the top. Nothing drops out.
 *
 * This is exactly "the `size` most recently seen distinct numbers, ordered
 * by when they last came". Because of that the pool can always be derived
 * from the spin history alone – which makes undo and changing the pool size
 * mid-session trivially correct.
 */

export interface Spin {
  /** The number that fell, 0-36. */
  n: number;
  /** Timestamp (ms). */
  t: number;
  /** Pool size that was active when this spin was entered. */
  size: number;
}

export type SpinOutcome =
  /** Already in the pool – moved from `fromSlot` (1-based) to the top. */
  | { kind: 'hit'; fromSlot: number }
  /** Not in the pool – added on top. `dropped` fell out (null if pool had room). */
  | { kind: 'new'; dropped: number | null };

export interface SpinStep {
  spin: Spin;
  outcome: SpinOutcome;
  /** How many numbers were in the pool right before this spin. */
  fillBefore: number;
}

export interface PoolAnalysis {
  /** Every distinct number seen so far, most recent first. */
  recency: number[];
  steps: SpinStep[];
}

export function analyzeSpins(spins: readonly Spin[]): PoolAnalysis {
  const recency: number[] = [];
  const steps: SpinStep[] = [];
  for (const spin of spins) {
    const size = clampPoolSize(spin.size);
    const idx = recency.indexOf(spin.n);
    const fillBefore = Math.min(size, recency.length);
    let outcome: SpinOutcome;
    if (idx !== -1 && idx < size) {
      outcome = { kind: 'hit', fromSlot: idx + 1 };
    } else {
      const dropped = recency.length >= size ? recency[size - 1] : null;
      outcome = { kind: 'new', dropped };
    }
    if (idx !== -1) recency.splice(idx, 1);
    recency.unshift(spin.n);
    steps.push({ spin, outcome, fillBefore });
  }
  return { recency, steps };
}

/** The current pool (newest first) for the given size. */
export function currentPool(spins: readonly Spin[], size: number): number[] {
  return analyzeSpins(spins).recency.slice(0, clampPoolSize(size));
}

export const MIN_POOL = 1;
export const MAX_POOL = 36;
export const DEFAULT_POOL = 24;

export function clampPoolSize(size: number): number {
  if (!Number.isFinite(size)) return DEFAULT_POOL;
  return Math.max(MIN_POOL, Math.min(MAX_POOL, Math.round(size)));
}
