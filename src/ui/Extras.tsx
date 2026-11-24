import { useMemo } from 'react';
import { wheelNeighbours } from '../logic/roulette';
import { lawOfThird } from '../logic/stats';
import { analyzeSpins } from '../logic/pool';
import { NB_SIDE, neighbourPlan } from '../logic/neighbours';
import { useStore, useT } from '../store';
import { Chip, Toggle } from './components';
import { openDialog, Sheet } from './dialog';

// ------------------------------------------------------------ neighbours

/** One colour per neighbour call – same colour on the pool boxes and in the strip. */
export const NB_COLORS = ['#f1d77a', '#5fd3e8', '#c49bff', '#ff9f5a', '#7ee08f', '#ff7eb6', '#9fb4ff'];
export const nbColor = (i: number) => NB_COLORS[i % NB_COLORS.length];

/**
 * Strip on the play screen: which pool numbers can be announced as
 * "X mit Nachbarn" (X with 2 neighbours on each side), plus what is left
 * to play as single numbers. Tap to see the full announcement.
 */
export function NeighbourStrip({ pool }: { pool: number[] }) {
  const t = useT();
  const plan = useMemo(() => neighbourPlan(pool), [pool]);
  return (
    <button className="nb-strip" onClick={() => openNeighbourSheet(pool)} aria-label={t.nbSheetTitle}>
      <span className="nb-head">
        <span className="nb-title">🎯 {t.nbShort}</span>
      </span>
      {!pool.length ? (
        <span className="nb-empty">{t.nbEmpty}</span>
      ) : !plan.calls.length ? (
        <span className="nb-empty">{t.nbNone}</span>
      ) : (
        <span className="nb-calls">
          {plan.calls.map((c, i) => (
            <span className="nb-call" key={c.center} style={{ '--nb-c': nbColor(i) } as React.CSSProperties}>
              <Chip n={c.center} size="sm" />
            </span>
          ))}
          {plan.singles.length > 0 && <span className="nb-singles">{t.nbSinglesShort(plan.singles.length)}</span>}
        </span>
      )}
      <span className="nb-more" aria-hidden>
        ›
      </span>
    </button>
  );
}

/** "17 with neighbours" picture: 2 25 [17] 34 6. */
function CallRow({ covers, center, color }: { covers: number[]; center: number; color?: string }) {
  return (
    <div className="nb-group" style={color ? ({ '--nb-c': color } as React.CSSProperties) : undefined}>
      {covers.map((x) => (
        <span key={x} className={`nb-cell ${x === center ? 'nb-center' : ''}`}>
          <Chip n={x} size="sm" />
        </span>
      ))}
    </div>
  );
}

/** Settings card: on/off + what it means. */
export function NeighbourSettings() {
  const t = useT();
  const on = useStore((st) => st.settings.neighbourMode);
  const update = useStore((st) => st.updateSettings);
  return (
    <>
      <Toggle checked={on} onChange={(neighbourMode) => update({ neighbourMode })} label={`🎯 ${t.nbMode}`} hint={t.nbModeHint} />
      <NeighbourExample />
    </>
  );
}

function NeighbourExample() {
  const t = useT();
  return (
    <div className="nb-example">
      <CallRow covers={wheelNeighbours(17, NB_SIDE, NB_SIDE)} center={17} color={nbColor(0)} />
      <p className="hint">{t.nbExplain}</p>
    </div>
  );
}

export function openNeighbourSheet(pool?: number[]) {
  openDialog((close) => <NeighbourSheet pool={pool} close={close} />);
}

function NeighbourSheet({ pool: given, close }: { pool?: number[]; close: () => void }) {
  const t = useT();
  const session = useStore((s) => s.sessions.find((x) => x.id === s.activeId));
  const pool = useMemo(
    () => given ?? (session ? analyzeSpins(session.spins).recency.slice(0, session.poolSize) : []),
    [given, session],
  );
  const plan = useMemo(() => neighbourPlan(pool), [pool]);
  const block = NB_SIDE * 2 + 1;
  return (
    <Sheet title={t.nbSheetTitle}>
      {plan.calls.length > 0 ? (
        <div className="nb-plan">
          {plan.calls.map((c, i) => (
            <div className="nb-plan-call" key={c.center} style={{ '--nb-c': nbColor(i) } as React.CSSProperties}>
              <div className="nb-say">„{t.nbSay(c.center)}“</div>
              <CallRow covers={c.covers} center={c.center} color={nbColor(i)} />
            </div>
          ))}
          {plan.singles.length > 0 && (
            <div className="nb-plan-singles">
              <div className="field-label">{t.nbSinglesTitle}</div>
              <div className="nb-single-chips">
                {plan.singles.map((n) => (
                  <Chip key={n} n={n} size="sm" />
                ))}
              </div>
            </div>
          )}
          <p className="nb-total">{t.nbTotal(plan.calls.length, block, plan.singles.length)}</p>
        </div>
      ) : (
        <p className="dialog-msg">{pool.length ? t.nbNone : t.nbEmpty}</p>
      )}
      <div className="rg-box">
        <div className="field-label">❔ {t.nbWhatTitle}</div>
        <NeighbourExample />
        <p className="hint">{t.nbColorsHint}</p>
      </div>
      <NeighbourToggle />
      <button className="btn btn-gold btn-lg" onClick={close}>
        {t.ok}
      </button>
    </Sheet>
  );
}

function NeighbourToggle() {
  const t = useT();
  const on = useStore((st) => st.settings.neighbourMode);
  const update = useStore((st) => st.updateSettings);
  return <Toggle checked={on} onChange={(neighbourMode) => update({ neighbourMode })} label={`🎯 ${t.nbMode}`} />;
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
        <li>
          <span className="howto-num">5</span>
          <div>
            <b>{t.how5Title}</b>
            <p>{t.how5}</p>
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
