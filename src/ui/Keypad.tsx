import { colorOf } from '../logic/roulette';
import type { KeypadLayout } from '../store';

/** Classic big-button grid: 0 on the left, then 1-36 six per row. */
const GRID_ORDER = Array.from({ length: 36 }, (_, i) => i + 1);

/**
 * Casino table ("Tableau"): 0 on the left over all three rows, then twelve
 * columns of three – top row 3 6 9 … 36, middle 2 5 … 35, bottom 1 4 … 34.
 * Exactly how the numbers are printed on a real roulette table.
 */
export const TABLE_ROWS = [3, 2, 1].map((top) => Array.from({ length: 12 }, (_, c) => c * 3 + top));
const TABLE_ORDER = TABLE_ROWS.flat();

export function Keypad({
  layout,
  inPool,
  onPress,
  marks,
}: {
  layout: KeypadLayout;
  inPool: Set<number>;
  onPress: (n: number) => void;
  /** Optional extra class per number (e.g. neighbour-call centres). */
  marks?: Map<number, string>;
}) {
  const order = layout === 'table' ? TABLE_ORDER : GRID_ORDER;
  const cls = (n: number) => `key key-${colorOf(n)} ${inPool.has(n) ? 'key-pool' : ''} ${marks?.get(n) ?? ''}`;
  return (
    <div className={`key-grid kp-${layout}`}>
      <button className={`${cls(0)} key-zero`} onClick={() => onPress(0)}>
        0
      </button>
      {order.map((n) => (
        <button key={n} className={cls(n)} onClick={() => onPress(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}
