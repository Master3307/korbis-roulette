import { useState } from 'react';
import { MAX_POOL, MIN_POOL } from '../logic/pool';
import { formatDateTime, useStore, useT } from '../store';
import { Card, Stepper, Toggle } from '../ui/components';
import { tapFeedback } from '../native';

export function NewSession() {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const defaultSize = useStore((s) => s.settings.defaultPoolSize);
  const startSession = useStore((s) => s.startSession);
  const resumeSession = useStore((s) => s.resumeSession);
  const last = useStore((s) => s.sessions[0]);
  const [size, setSize] = useState(defaultSize);
  const [name, setName] = useState('');
  const [practice, setPractice] = useState(false);

  return (
    <div className="screen screen-scroll">
      <div className="brand">
        <div className="brand-title">Korbi's Roulette</div>
        <div className="brand-sub">Logging</div>
      </div>

      <Card title={t.poolSizeQuestion}>
        <Stepper value={size} onChange={setSize} min={MIN_POOL} max={MAX_POOL} presets={[12, 18, 24, 30]} />
        <p className="hint center">{t.poolSizeHint}</p>
      </Card>

      <Card>
        <label className="field">
          <span className="field-label">{t.sessionName}</span>
          <input
            className="input"
            value={name}
            maxLength={40}
            placeholder={t.defaultSessionName(formatDateTime(Date.now(), lang))}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Toggle checked={practice} onChange={setPractice} label={t.practiceMode} hint={t.practiceModeHint} />
      </Card>

      <button
        className="btn btn-gold btn-xl"
        onClick={() => {
          tapFeedback(true);
          startSession({ name, poolSize: size, practice });
        }}
      >
        ▶ {t.startSession}
      </button>

      {last && (
        <button className="btn btn-plain btn-lg continue-btn" onClick={() => resumeSession(last.id)}>
          ↺ {t.continueLast}: <b>{last.name}</b>
          <small>
            {' '}
            · {last.spins.length} {t.spins}
          </small>
        </button>
      )}
    </div>
  );
}
