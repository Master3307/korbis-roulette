import { analyzeSpins, type Spin } from './pool';
import { colorOf, columnOf, dozenOf, expectedDistinct, sectorOf, type Color, type SectorId } from './roulette';

export interface Streak {
  key: string;
  length: number;
}

export interface Stats {
  total: number;
  /** Hits per number 0-36. */
  counts: number[];
  red: number;
  black: number;
  green: number;
  even: number;
  odd: number;
  low: number;
  high: number;
  dozens: [number, number, number];
  columns: [number, number, number];
  sectors: Record<SectorId, number>;
  /** Spins whose number was in the pool before it fell. */
  poolHits: number;
  /** Sum over spins of (pool fill / 37): what pure chance would give. */
  poolExpected: number;
  /** Spins where the pool was already completely full. */
  poolFullSpins: number;
  poolFullHits: number;
  /** Same number twice in a row. */
  repeats: number;
  longestColorStreak: Streak;
  longestParityStreak: Streak;
  /** Longest stretch (in spins) any number was absent between two hits. */
  longestGap: { n: number; length: number } | null;
}

function emptyStats(): Stats {
  return {
    total: 0,
    counts: Array(37).fill(0),
    red: 0,
    black: 0,
    green: 0,
    even: 0,
    odd: 0,
    low: 0,
    high: 0,
    dozens: [0, 0, 0],
    columns: [0, 0, 0],
    sectors: { voisins: 0, tiers: 0, orphelins: 0 },
    poolHits: 0,
    poolExpected: 0,
    poolFullSpins: 0,
    poolFullHits: 0,
    repeats: 0,
    longestColorStreak: { key: '', length: 0 },
    longestParityStreak: { key: '', length: 0 },
    longestGap: null,
  };
}

/** Stats for one session's spins. */
export function computeStats(spins: readonly Spin[]): Stats {
  const s = emptyStats();
  const { steps } = analyzeSpins(spins);
  const lastIdx = new Map<number, number>();
  let colorRun: Streak = { key: '', length: 0 };
  let parityRun: Streak = { key: '', length: 0 };

  steps.forEach((step, i) => {
    const n = step.spin.n;
    s.total++;
    s.counts[n]++;
    const c = colorOf(n);
    s[c]++;
    if (n !== 0) {
      if (n % 2 === 0) s.even++;
      else s.odd++;
      if (n <= 18) s.low++;
      else s.high++;
      s.dozens[dozenOf(n)! - 1]++;
      s.columns[columnOf(n)! - 1]++;
    }
    s.sectors[sectorOf(n)]++;

    const size = step.spin.size;
    s.poolExpected += step.fillBefore / 37;
    if (step.outcome.kind === 'hit') s.poolHits++;
    if (step.fillBefore >= size) {
      s.poolFullSpins++;
      if (step.outcome.kind === 'hit') s.poolFullHits++;
    }

    if (i > 0 && steps[i - 1].spin.n === n) s.repeats++;

    const prev = lastIdx.get(n);
    if (prev !== undefined) {
      const gap = i - prev - 1;
      if (!s.longestGap || gap > s.longestGap.length) s.longestGap = { n, length: gap };
    }
    lastIdx.set(n, i);

    colorRun = extend(colorRun, c === 'green' ? null : c);
    if (colorRun.length > s.longestColorStreak.length) s.longestColorStreak = { ...colorRun };
    parityRun = extend(parityRun, n === 0 ? null : n % 2 === 0 ? 'even' : 'odd');
    if (parityRun.length > s.longestParityStreak.length) s.longestParityStreak = { ...parityRun };
  });

  return s;
}

function extend(run: Streak, key: string | null): Streak {
  if (key === null) return { key: '', length: 0 };
  return run.key === key ? { key, length: run.length + 1 } : { key, length: 1 };
}

/** Combine per-session stats (pools never span sessions). */
export function mergeStats(list: readonly Stats[]): Stats {
  const out = emptyStats();
  for (const s of list) {
    out.total += s.total;
    for (let i = 0; i < 37; i++) out.counts[i] += s.counts[i];
    out.red += s.red;
    out.black += s.black;
    out.green += s.green;
    out.even += s.even;
    out.odd += s.odd;
    out.low += s.low;
    out.high += s.high;
    for (let i = 0; i < 3; i++) {
      out.dozens[i] += s.dozens[i];
      out.columns[i] += s.columns[i];
    }
    out.sectors.voisins += s.sectors.voisins;
    out.sectors.tiers += s.sectors.tiers;
    out.sectors.orphelins += s.sectors.orphelins;
    out.poolHits += s.poolHits;
    out.poolExpected += s.poolExpected;
    out.poolFullSpins += s.poolFullSpins;
    out.poolFullHits += s.poolFullHits;
    out.repeats += s.repeats;
    if (s.longestColorStreak.length > out.longestColorStreak.length) out.longestColorStreak = s.longestColorStreak;
    if (s.longestParityStreak.length > out.longestParityStreak.length) out.longestParityStreak = s.longestParityStreak;
    if (s.longestGap && (!out.longestGap || s.longestGap.length > out.longestGap.length)) out.longestGap = s.longestGap;
  }
  return out;
}

/** Spins since each number last fell (null = not yet in this session). */
export function spinsSinceLast(spins: readonly Spin[]): (number | null)[] {
  const out: (number | null)[] = Array(37).fill(null);
  for (let i = spins.length - 1; i >= 0; i--) {
    const n = spins[i].n;
    if (out[n] === null) out[n] = spins.length - 1 - i;
  }
  return out;
}

/** The current run of the same colour at the end of the history. */
export function currentColorStreak(spins: readonly Spin[]): { color: Color; length: number } | null {
  if (!spins.length) return null;
  const color = colorOf(spins[spins.length - 1].n);
  let length = 0;
  for (let i = spins.length - 1; i >= 0 && colorOf(spins[i].n) === color; i--) length++;
  return { color, length };
}

/** "Law of the third": distinct numbers in the last `window` spins vs. expectation. */
export function lawOfThird(spins: readonly Spin[], window = 37) {
  const recent = spins.slice(-window);
  const distinct = new Set(recent.map((s) => s.n)).size;
  return { window: recent.length, distinct, expected: expectedDistinct(recent.length) };
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** Top/bottom numbers by count. Ties broken by number ascending. */
export function ranked(counts: readonly number[]): number[] {
  return counts
    .map((c, n) => ({ c, n }))
    .sort((a, b) => b.c - a.c || a.n - b.n)
    .map((x) => x.n);
}

/**
 * The `k` most frequent numbers (at least one hit), most frequent first.
 * Ties go to the number that fell more recently.
 */
export function hotNumbers(spins: readonly Spin[], k: number): number[] {
  const counts = Array(37).fill(0) as number[];
  const last = Array(37).fill(-1) as number[];
  spins.forEach((s, i) => {
    counts[s.n]++;
    last[s.n] = i;
  });
  return counts
    .map((c, n) => ({ n, c, l: last[n] }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c || b.l - a.l)
    .slice(0, Math.max(0, k))
    .map((x) => x.n);
}

/** Total hits on a group of numbers (each number counted once). */
export function groupHits(counts: readonly number[], numbers: readonly number[]): number {
  return [...new Set(numbers)].reduce((sum, n) => sum + (counts[n] ?? 0), 0);
}
