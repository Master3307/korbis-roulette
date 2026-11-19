import { useMemo } from 'react';
import { wheelNeighbours } from '../logic/roulette';
import { hotNumbers, lawOfThird } from '../logic/stats';
import type { Spin } from '../logic/pool';
import { useStore, useT } from '../store';
import { Chip, Toggle } from './components';
import { openDialog, Sheet } from './dialog';
import { tapFeedback } from '../native';

// ------------------------------------------------------------ neighbours

/** Strip on the play screen: hottest numbers with their wheel neighbours. */
export function NeighbourStrip({ spins, pool }: { spins: Spin[]; pool: number[] }) {
  const t = useT();
  const { neighbourLeft: l, neighbourRight: r, neighbourCount: k } = useStore((s) => s.settings);
  const counts = useMemo(() => {
    const c = Array(37).fill(0) as number[];
    spins.forEach((s) => c[s.n]++);
    return c;
  }, [spins]);
  const hot = useMemo(() => hotNumbers(spins, k), [spins, k]);
  const inPool = new Set(pool);

  return (
    <div className="nb-strip" aria-label={t.nbShort}>
      <button className="nb-head" onClick={openNeighbourSheet} aria-label={t.nbMode}>
        <span className="nb-title">🎯</span>
        <span className="nb-title">
          {l}·{r}
        </span>
        <span className="nb-edit">⚙</span>
      </button>
      {!hot.length ? (
        <p className="nb-empty">{t.nbEmpty}</p>
      ) : (
        <div className="nb-groups">
          {hot.map((n) => (
            <div className="nb-group" key={n}>
              {wheelNeighbours(n, l, r).map((x, i) => (
                <span key={i} className={`nb-cell ${x === n ? 'nb-center' : ''} ${inPool.has(x) ? 'nb-in-pool' : ''}`}>
                  <Chip n={x} size="sm" />
                  {x === n && (
                    <small className="nb-count">
                      {t.timesShort}
                      {counts[n]}
                    </small>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => {
    tapFeedback();
    onChange(Math.max(min, Math.min(max, v)));
  };
  return (
    <div className="mini-stepper">
      <span className="mini-label">{label}</span>
      <div className="mini-row">
        <button onClick={() => set(value - 1)} disabled={value <= min} aria-label={`${label} −`}>
          −
        </button>
        <b>{value}</b>
        <button onClick={() => set(value + 1)} disabled={value >= max} aria-label={`${label} +`}>
          +
        </button>
      </div>
    </div>
  );
}

/** All neighbour settings – used in the sheet and in the settings screen. */
export function NeighbourSettings() {
  const t = useT();
  const s = useStore((st) => st.settings);
  const update = useStore((st) => st.updateSettings);
  return (
    <>
      <Toggle checked={s.neighbourMode} onChange={(neighbourMode) => update({ neighbourMode })} label={`🎯 ${t.nbMode}`} hint={t.nbModeHint} />
      <div className="field-label">{t.nbPresets}</div>
      <div className="presets">
        {[1, 2, 3, 4].map((v) => (
          <button
            key={v}
            className={`preset ${s.neighbourLeft === v && s.neighbourRight === v ? 'preset-on' : ''}`}
            onClick={() => {
              tapFeedback();
              update({ neighbourLeft: v, neighbourRight: v });
            }}
          >
            {v}·{v}
          </button>
        ))}
      </div>
      <div className="mini-grid">
        <MiniStepper label={t.nbLeft} value={s.neighbourLeft} min={0} max={4} onChange={(neighbourLeft) => update({ neighbourLeft })} />
        <MiniStepper label={t.nbRight} value={s.neighbourRight} min={0} max={4} onChange={(neighbourRight) => update({ neighbourRight })} />
      </div>
      <MiniStepper label={t.nbCount} value={s.neighbourCount} min={1} max={6} onChange={(neighbourCount) => update({ neighbourCount })} />
      <NeighbourExample />
    </>
  );
}

function NeighbourExample() {
  const t = useT();
  const { neighbourLeft: l, neighbourRight: r } = useStore((s) => s.settings);
  return (
    <div className="nb-example">
      <div className="nb-group">
        {wheelNeighbours(17, l, r).map((x, i) => (
          <span key={i} className={`nb-cell ${x === 17 ? 'nb-center' : ''}`}>
            <Chip n={x} size="sm" />
          </span>
        ))}
      </div>
      <p className="hint">{t.nbExplain(l, r)}</p>
    </div>
  );
}

export function openNeighbourSheet() {
  openDialog((close) => (
    <Sheet title={undefined}>
      <NeighbourSheetBody close={close} />
    </Sheet>
  ));
}

function NeighbourSheetBody({ close }: { close: () => void }) {
  const t = useT();
  return (
    <>
      <h2 className="sheet-title">{t.nbMode}</h2>
      <NeighbourSettings />
      <button className="btn btn-gold btn-lg" onClick={close}>
        {t.ok}
      </button>
    </>
  );
}

// ------------------------------------------------------------ responsible gambling

export const HELPLINE_DISPLAY = '0800 1 37 27 00';
const HELPLINE_TEL = 'tel:08001372700';
const HELP_WEB = 'https://www.check-dein-spiel.de';
const GA_WEB = 'https://www.anonyme-spieler.org';

export function openGamblingHelp() {
  openDialog((close) => <GamblingHelpSheet close={close} />);
}

function GamblingHelpSheet({ close }: { close: () => void }) {
  const t = useT();
  return (
    <Sheet title={t.rgTitle}>
      <p className="rg-intro">{t.rgIntro}</p>
      <div className="rg-box">
        <div className="field-label">{t.rgSignsTitle}</div>
        <ul className="rg-list">
          {t.rgSigns.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="rg-box">
        <div className="field-label">{t.rgTipsTitle}</div>
        <ul className="rg-list rg-tips">
          {t.rgTips.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="field-label">{t.rgHelpTitle}</div>
      <a className="btn btn-gold btn-lg rg-link" href={HELPLINE_TEL}>
        📞 {HELPLINE_DISPLAY}
        <small>{t.rgPhoneLabel}</small>
      </a>
      <a className="btn btn-plain btn-lg rg-link" href={HELP_WEB} target="_blank" rel="noopener noreferrer">
        🌐 check-dein-spiel.de
        <small>{t.rgWebLabel}</small>
      </a>
      <a className="btn btn-plain btn-lg rg-link" href={GA_WEB} target="_blank" rel="noopener noreferrer">
        🤝 anonyme-spieler.org
        <small>{t.rgGaLabel}</small>
      </a>
      <p className="hint">{t.rgSperre}</p>
      <button className="btn btn-plain btn-lg" onClick={close}>
        {t.ok}
      </button>
    </Sheet>
  );
}

/** Small always-visible note with a link to the help sheet. */
export function GamblingNote() {
  const t = useT();
  return (
    <button className="rg-note" onClick={openGamblingHelp}>
      <span>
        ♥ {t.rgShort} <b>{HELPLINE_DISPLAY}</b>
      </span>
      <span className="rg-note-more">›</span>
    </button>
  );
}

// ------------------------------------------------------------ "how it works" guide

export function openHowTo() {
  openDialog((close) => <HowToSheet close={close} />);
}

function HowToSheet({ close }: { close: () => void }) {
  const t = useT();
  return (
    <Sheet title={t.howTitle}>
      <ol className="howto">
        <li>
          <span className="howto-num">1</span>
          <div>
            <b>{t.how1Title}</b>
            <p>{t.how1}</p>
            <div className="howto-demo">
              <span className="key key-red demo-key">17</span>
              <span className="demo-arrow">→</span>
              <span className="slot slot-red slot-top demo-slot">
                <span className="slot-num">17</span>
              </span>
            </div>
          </div>
        </li>
        <li>
          <span className="howto-num">2</span>
          <div>
            <b>{t.how2Title}</b>
            <p>{t.how2}</p>
          </div>
        </li>
        <li>
          <span className="howto-num">3</span>
          <div>
            <b>{t.how3Title}</b>
            <p>{t.how3}</p>
            <div className="howto-demo">
              <span className="slot slot-black slot-out demo-slot">
                <span className="slot-num">8</span>
              </span>
              <span className="demo-arrow">→ ✗</span>
            </div>
          </div>
        </li>
        <li>
          <span className="howto-num">4</span>
          <div>
            <b>{t.how4Title}</b>
            <p>{t.how4}</p>
          </div>
        </li>
      </ol>
      <button
        className="btn btn-plain btn-lg"
        onClick={() => {
          close();
          openAbout();
        }}
      >
        ℹ {t.aboutButton} · ⅔
      </button>
      <button className="btn btn-gold btn-xl" onClick={close}>
        {t.howOk}
      </button>
    </Sheet>
  );
}

// ------------------------------------------------------------ about + law of the third

export function openAbout() {
  openDialog((close) => <AboutSheet close={close} />);
}

function AboutSheet({ close }: { close: () => void }) {
  const t = useT();
  const spins = useStore((s) => s.sessions.find((x) => x.id === s.activeId)?.spins);
  const law = spins && spins.length >= 10 ? lawOfThird(spins) : null;
  return (
    <Sheet title={t.aboutPurposeTitle}>
      <p className="about-text">{t.aboutPurpose}</p>
      <div className="rg-box law-box">
        <div className="field-label">⅔ {t.lawTitle}</div>
        <p className="about-text">{t.lawText1}</p>
        <LawPicture />
        <p className="about-text">{t.lawText2}</p>
        <p className="hint">{t.lawFormula}</p>
        {law && <p className="law-yours">{t.lawYours(law.distinct, law.window)}</p>}
      </div>
      <div className="rg-box">
        <div className="field-label">⚠ {t.lawWarnTitle}</div>
        <p className="about-text">{t.lawWarn}</p>
      </div>
      <button className="btn btn-plain btn-lg" onClick={() => { close(); openGamblingHelp(); }}>
        ♥ {t.rgButton}
      </button>
      <button className="btn btn-gold btn-lg" onClick={close}>
        {t.ok}
      </button>
    </Sheet>
  );
}

/** 37 dots: 24 came (gold), 13 did not (dim). */
function LawPicture() {
  return (
    <div className="law-pic" aria-hidden>
      {Array.from({ length: 37 }, (_, i) => (
        <i key={i} className={i < 24 ? 'came' : ''} />
      ))}
    </div>
  );
}
