import { colorOf, WHEEL_ORDER } from '../logic/roulette';

const C = 150;
const R_OUT = 140;
const R_IN = 96;
const STEP = 360 / 37;

const FILL = { red: '#c0182f', black: '#161616', green: '#0d8a3e' } as const;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
}

function wedge(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

/**
 * European wheel. mode="pool": highlight numbers in `pool`.
 * mode="heat": brightness by `counts`.
 */
export function Wheel({
  mode,
  pool = [],
  counts = [],
  last,
}: {
  mode: 'pool' | 'heat';
  pool?: number[];
  counts?: number[];
  last?: number | null;
}) {
  const inPool = new Set(pool);
  const max = Math.max(1, ...counts);
  return (
    <svg viewBox="0 0 300 300" className="wheel" role="img" aria-label="Roulette wheel">
      <defs>
        <radialGradient id="wh-rim" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="#5a3a12" />
          <stop offset="100%" stopColor="#2b1a06" />
        </radialGradient>
        <radialGradient id="wh-cone" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#1d6b44" />
          <stop offset="100%" stopColor="#08301c" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={149} fill="url(#wh-rim)" />
      <circle cx={C} cy={C} r={R_OUT + 1} fill="none" stroke="#d4af37" strokeWidth="1.5" />
      {WHEEL_ORDER.map((n, i) => {
        const a1 = i * STEP - STEP / 2;
        const a2 = a1 + STEP;
        const [tx, ty] = polar((R_OUT + R_IN) / 2 + 6, i * STEP);
        const on = mode === 'pool' ? inPool.has(n) : true;
        const opacity = mode === 'pool' ? (on ? 1 : 0.28) : 0.22 + 0.78 * ((counts[n] ?? 0) / max);
        return (
          <g key={n}>
            <path d={wedge(R_IN, R_OUT, a1, a2)} fill={FILL[colorOf(n)]} opacity={opacity} stroke="#d4af37" strokeWidth="0.6" />
            {mode === 'pool' && on && <path d={wedge(R_OUT - 5, R_OUT, a1 + 0.4, a2 - 0.4)} fill="#f1d77a" />}
            <text
              x={tx}
              y={ty}
              transform={`rotate(${i * STEP > 90 && i * STEP < 270 ? i * STEP + 180 : i * STEP} ${tx} ${ty})`}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12.5"
              fontWeight="800"
              fill={mode === 'pool' && on ? '#fff7d6' : '#f5f0e1'}
              opacity={mode === 'pool' ? (on ? 1 : 0.45) : 1}
            >
              {n}
            </text>
            {last === n && (
              <circle cx={polar(R_IN - 9, i * STEP)[0]} cy={polar(R_IN - 9, i * STEP)[1]} r="6" fill="#fafafa" stroke="#999" strokeWidth="1" />
            )}
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R_IN} fill="none" stroke="#d4af37" strokeWidth="1.5" />
      <circle cx={C} cy={C} r={R_IN - 18} fill="url(#wh-cone)" stroke="#8a6d1e" strokeWidth="1" />
      <circle cx={C} cy={C} r={14} fill="#d4af37" />
      <circle cx={C} cy={C} r={7} fill="#8a6d1e" />
    </svg>
  );
}
