import { useMemo } from 'react';
import { analyzeSpins, MAX_POOL, MIN_POOL } from '../logic/pool';
import { colorOf } from '../logic/roulette';
import { useActiveSession, useStore, useT, type Session } from '../store';
import { tapFeedback } from '../native';
import { Chip, Stepper, Toggle } from '../ui/components';
import { confirmDialog, openDialog, Sheet } from '../ui/dialog';
import { IconMenu, IconUndo } from '../ui/icons';
import { NewSession } from './NewSession';
import { MicButton, ReadToggleButton, VoiceBanner, openVoiceHelpSheet } from '../ui/VoiceUi';
import { useVoiceUi } from '../voiceControl';
import { NeighbourStrip, openHowTo, openNeighbourSheet } from '../ui/Extras';
import { EditSessionSheet } from './SessionsScreen';

const KEYPAD_ROWS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30],
  [31, 32, 33, 34, 35, 36],
];

export function PlayScreen() {
  const session = useActiveSession();
  if (!session) return <NewSession />;
  return <ActivePlay session={session} />;
}

function ActivePlay({ session }: { session: Session }) {
  const t = useT();
  const addSpin = useStore((s) => s.addSpin);
  const undoSpin = useStore((s) => s.undoSpin);
  const voiceInput = useStore((s) => s.settings.voiceInput);
  const neighbourMode = useStore((s) => s.settings.neighbourMode);
  const readingIndex = useVoiceUi((s) => s.readingIndex);

  const { pool, counts, lastStep } = useMemo(() => {
    const a = analyzeSpins(session.spins);
    const counts = Array(37).fill(0) as number[];
    for (const s of session.spins) counts[s.n]++;
    return { pool: a.recency.slice(0, session.poolSize), counts, lastStep: a.steps.at(-1) ?? null };
  }, [session.spins, session.poolSize]);

  const inPool = new Set(pool);
  const full = pool.length >= session.poolSize;

  const press = (n: number) => {
    const willDrop = !inPool.has(n) && full;
    tapFeedback(willDrop);
    addSpin(n);
  };

  return (
    <div className={`screen play ${session.poolSize > 24 ? 'play-big-pool' : ''} ${neighbourMode ? 'play-nb' : ''}`}>
      <header className="play-head">
        <div className="play-head-text">
          <VoiceBanner />
          <div className="play-name">{session.name}</div>
          <div className="play-meta">
            {t.spin} <b>{session.spins.length}</b> ·{' '}
            <b>
              {pool.length}/{session.poolSize}
            </b>
          </div>
        </div>
        <ReadToggleButton />
        {voiceInput && <MicButton />}
        <button className="icon-btn" onClick={() => openSessionMenu(session)} aria-label={t.menu}>
          <IconMenu />
          <span>{t.menu}</span>
        </button>
      </header>
      {session.practice && <div className="practice-badge">{t.practiceBadge}</div>}

      <div className={`result ${lastStep ? `result-${lastStep.outcome.kind}` : ''}`}>
        {lastStep ? (
          <>
            <Chip n={lastStep.spin.n} size="lg" className="pop" key={session.spins.length} />
            <div className="result-text">
              <div className="result-main">{lastStep.outcome.kind === 'hit' ? t.resultHit : t.resultNew}</div>
              {lastStep.outcome.kind === 'hit' ? (
                <div className="result-sub">{t.resultHitSub(lastStep.outcome.fromSlot)}</div>
              ) : lastStep.outcome.dropped !== null ? (
                <div className="result-drop">
                  <Chip n={lastStep.outcome.dropped} size="sm" /> {t.resultDropped(lastStep.outcome.dropped)}
                </div>
              ) : (
                <div className="result-sub">{t.resultNewSub}</div>
              )}
            </div>
          </>
        ) : (
          <div className="result-text">
            <div className="result-main muted">{t.nothingYet}</div>
          </div>
        )}
        <button
          className="undo-btn"
          disabled={!session.spins.length}
          onClick={() => {
            tapFeedback();
            undoSpin();
          }}
        >
          <IconUndo />
          <span>{t.undo}</span>
        </button>
      </div>

      <section className="pool" aria-label={t.pool}>
        <div className="pool-head">
          <span className="pool-title">{t.poolTitle(session.poolSize)}</span>
          <span className="pool-hint">{t.poolHint}</span>
        </div>
        <div className="pool-grid" style={{ gridTemplateRows: `repeat(${Math.ceil(session.poolSize / 6)}, minmax(var(--slot-min), 1fr))` }}>
          {Array.from({ length: session.poolSize }, (_, i) => {
            const n = pool[i];
            const isNextOut = full && i === session.poolSize - 1;
            return (
              <div
                key={i}
                className={`slot ${n === undefined ? 'slot-empty' : `slot-${colorOf(n)}`} ${isNextOut ? 'slot-out' : ''} ${i === 0 && n !== undefined ? 'slot-top' : ''} ${readingIndex === i ? 'slot-reading' : ''}`}
              >
                <span className="slot-pos">{i + 1}</span>
                {n === undefined ? (
                  <span className="slot-free">{t.empty}</span>
                ) : (
                  <>
                    <span className="slot-num" key={i === 0 ? `${n}-${session.spins.length}` : n}>
                      {n}
                    </span>
                    <span className="slot-count">
                      {t.timesShort}
                      {counts[n]}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="keypad" aria-label={t.tapNumber}>
        {neighbourMode ? (
          <NeighbourStrip spins={session.spins} />
        ) : (
          <div className="keypad-label">
            <span>{t.tapNumber}</span>
            <span className="legend-pool">
              <i className="dot" /> {t.inPoolLegend}
            </span>
          </div>
        )}
        <div className="key-grid">
          <button className={`key key-green key-zero ${inPool.has(0) ? 'key-pool' : ''}`} onClick={() => press(0)}>
            0
          </button>
          {KEYPAD_ROWS.flat().map((n) => (
            <button key={n} className={`key key-${colorOf(n)} ${inPool.has(n) ? 'key-pool' : ''}`} onClick={() => press(n)}>
              {n}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function openSessionMenu(session: Session) {
  openDialog((close) => <SessionMenu sessionId={session.id} close={close} />);
}

function SessionMenu({ sessionId, close }: { sessionId: string; close: () => void }) {
  const t = useT();
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId));
  const setPoolSize = useStore((s) => s.setPoolSize);
  const updateSession = useStore((s) => s.updateSession);
  const endSession = useStore((s) => s.endSession);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  if (!session) return null;
  return (
    <Sheet title={session.name}>
      <div className="sheet-section">
        <div className="field-label">{t.changePoolSize}</div>
        <Stepper value={session.poolSize} onChange={setPoolSize} min={MIN_POOL} max={MAX_POOL} presets={[12, 18, 24, 30]} />
      </div>
      <Toggle
        checked={session.practice}
        onChange={(v) => updateSession(session.id, { practice: v })}
        label={t.practiceMode}
        hint={t.practiceModeHint}
      />
      <Toggle checked={settings.readAloud} onChange={(v) => updateSettings({ readAloud: v })} label={t.readAloud} hint={t.readAloudHint} />
      <Toggle checked={settings.voiceInput} onChange={(v) => updateSettings({ voiceInput: v })} label={t.voiceInput} hint={t.voiceInputHint} />
      <Toggle checked={settings.neighbourMode} onChange={(v) => updateSettings({ neighbourMode: v })} label={`🎯 ${t.nbMode}`} hint={t.nbModeHint} />
      <div className="sheet-buttons">
        {settings.neighbourMode && (
          <button
            className="btn btn-plain btn-lg"
            onClick={() => {
              close();
              openNeighbourSheet();
            }}
          >
            ⚙ {t.nbMode}: {settings.neighbourLeft}·{settings.neighbourRight}
          </button>
        )}
        <button
          className="btn btn-plain btn-lg"
          onClick={() => {
            close();
            openHowTo();
          }}
        >
          ❔ {t.howButton}
        </button>
        {settings.voiceInput && (
          <button
            className="btn btn-plain btn-lg"
            onClick={() => {
              close();
              openVoiceHelpSheet();
            }}
          >
            🎤 {t.voiceHelp}
          </button>
        )}
        <button
          className="btn btn-plain btn-lg"
          onClick={() => {
            close();
            openDialog((c) => <EditSessionSheet sessionId={session.id} close={c} />);
          }}
        >
          ✎ {t.rename}
        </button>
        <button
          className="btn btn-danger btn-lg"
          onClick={async () => {
            close();
            const ok = await confirmDialog({
              title: t.endSession,
              message: t.endSessionConfirm,
              confirmLabel: t.endSession,
              cancelLabel: t.cancel,
              danger: true,
            });
            if (ok) endSession();
          }}
        >
          ■ {t.endSession}
        </button>
        <button className="btn btn-gold btn-lg" onClick={close}>
          {t.ok}
        </button>
      </div>
    </Sheet>
  );
}
