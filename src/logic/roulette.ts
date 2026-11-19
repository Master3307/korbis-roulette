/** Static facts about a single-zero (European) roulette wheel. */

export const NUMBERS = Array.from({ length: 37 }, (_, i) => i);

/** Pocket order on a European wheel, clockwise starting at 0. */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type Color = 'red' | 'black' | 'green';

export function colorOf(n: number): Color {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

export function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 36;
}

/** 1 = 1-12, 2 = 13-24, 3 = 25-36, null for zero. */
export function dozenOf(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  return n <= 12 ? 1 : n <= 24 ? 2 : 3;
}

/** Table column: 1 = (1,4,7..34), 2 = (2,5..35), 3 = (3,6..36), null for zero. */
export function columnOf(n: number): 1 | 2 | 3 | null {
  if (n === 0) return null;
  return (((n - 1) % 3) + 1) as 1 | 2 | 3;
}

export type SectorId = 'voisins' | 'tiers' | 'orphelins';

/** Classic French wheel sections. Jeu Zéro is a subset of Voisins. */
export const SECTORS: Record<SectorId, number[]> = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  orphelins: [1, 20, 14, 31, 9, 17, 34, 6],
};

export const JEU_ZERO = [12, 35, 3, 26, 0, 32, 15];

export function sectorOf(n: number): SectorId {
  if (SECTORS.voisins.includes(n)) return 'voisins';
  if (SECTORS.tiers.includes(n)) return 'tiers';
  return 'orphelins';
}

/** Wheel neighbours (left and right, `k` on each side). */
export function neighbours(n: number, k = 2): number[] {
  const i = WHEEL_ORDER.indexOf(n as (typeof WHEEL_ORDER)[number]);
  const out: number[] = [];
  for (let d = -k; d <= k; d++) {
    if (d === 0) continue;
    out.push(WHEEL_ORDER[(i + d + 37) % 37]);
  }
  return out;
}

/**
 * Expected number of distinct numbers seen in `spins` spins of a fair
 * 37-pocket wheel: 37 * (1 - (36/37)^spins). For 37 spins this is ≈ 23.6,
 * the "law of the third" / Zwei-Drittel-Gesetz.
 */
export function expectedDistinct(spins: number): number {
  return 37 * (1 - Math.pow(36 / 37, spins));
}
