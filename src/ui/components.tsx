import type { ReactNode } from 'react';
import { colorOf } from '../logic/roulette';
import { tapFeedback } from '../native';
import { useStore } from '../store';
import { formatPct } from '../i18n/strings';

export function Chip({ n, size = 'md', className = '' }: { n: number; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <span className={`chip chip-${colorOf(n)} chip-${size} ${className}`}>{n}</span>;
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  presets,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  presets?: number[];
  label?: string;
}) {
  const set = (v: number) => {
    const c = Math.max(min, Math.min(max, v));
    if (c !== value) tapFeedback();
    onChange(c);
  };
  return (
    <div className="stepper-wrap">
      <div className="stepper" aria-label={label}>
        <button className="stepper-btn" onClick={() => set(value - 1)} disabled={value <= min} aria-label="−">
          −
        </button>
        <div className="stepper-value" aria-live="polite">
          {value}
        </div>
        <button className="stepper-btn" onClick={() => set(value + 1)} disabled={value >= max} aria-label="+">
          +
        </button>
      </div>
      {presets && (
        <div className="presets">
          {presets.map((p) => (
            <button key={p} className={`preset ${p === value ? 'preset-on' : ''}`} onClick={() => set(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      className={`toggle-row ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => {
        tapFeedback();
        onChange(!checked);
      }}
    >
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <span className="switch" aria-hidden>
        <span className="knob" />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? 'seg-on' : ''}
          onClick={() => {
            tapFeedback();
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ title, children, className = '', right }: { title?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <h3 className="card-title">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Horizontal share bar: label, value, %, and expected marker. */
export function ShareBar({
  label,
  value,
  total,
  expected,
  tone = 'gold',
}: {
  label: ReactNode;
  value: number;
  total: number;
  /** Expected share 0-1. */
  expected?: number;
  tone?: 'gold' | 'red' | 'black' | 'green';
}) {
  const p = total ? value / total : 0;
  return (
    <div className="sharebar">
      <div className="sharebar-top">
        <span className="sharebar-label">{label}</span>
        <span className="sharebar-val">
          <b>{formatPct(p * 100, useStore.getState().settings.lang)}</b> <small>({value})</small>
        </span>
      </div>
      <div className="sharebar-track">
        <div className={`sharebar-fill tone-${tone}`} style={{ width: `${Math.min(100, p * 100)}%` }} />
        {expected !== undefined && <div className="sharebar-exp" style={{ left: `${expected * 100}%` }} />}
      </div>
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      {sub && <div className="tile-sub">{sub}</div>}
    </div>
  );
}
