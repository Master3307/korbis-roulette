import { useMemo, useState } from 'react';
import { analyzeSpins, type Spin } from '../logic/pool';
import { colorOf } from '../logic/roulette';
import {
  computeStats,
  currentColorStreak,
  lawOfThird,
  mergeStats,
  pct,
  ranked,
  spinsSinceLast,
  type Stats,
} from '../logic/stats';
import { useStore, useT, type Session } from '../store';
import { Card, Chip, Segmented, ShareBar, StatTile } from '../ui/components';
import { confirmDialog } from '../ui/dialog';
import { Wheel } from '../ui/Wheel';
import type { Strings } from '../i18n/strings';

type View = 'session' | 'overall';

const fmt = (v: number) => `${v.toFixed(1)}%`;

export function StatsScreen() {
  const t = useT();
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeId);
  const viewSessionId = useStore((s) => s.viewSessionId);
  const [view, setView] = useState<View>('session');

  const session =
    sessions.find((s) => s.id === viewSessionId) ??
    sessions.find((s) => s.id === activeId) ??
    [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0] ??
    null;

  return (
    <div className="screen screen-scroll">
      <h1 className="screen-title">{t.tabStats}</h1>
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'session', label: t.thisSession },
          { value: 'overall', label: t.overall },
        ]}
      />
      {view === 'session' ? (
        session ? (
          <SessionStats session={session} />
        ) : (
          <p className="empty-note">{t.noActiveSession}</p>
        )
      ) : (
        <OverallStats sessions={sessions} />
      )}
    </div>
  );
}

function SessionStats({ session }: { session: Session }) {
  const t = useT();
  const deleteSpin = useStore((s) => s.deleteSpin);
  const stats = useMemo(() => computeStats(session.spins), [session.spins]);
  const pool = useMemo(() => analyzeSpins(session.spins).recency.slice(0, session.poolSize), [session.spins, session.poolSize]);
  const since = useMemo(() => spinsSinceLast(session.spins), [session.spins]);
  const law = lawOfThird(session.spins);
  const streak = currentColorStreak(session.spins);

  const sleepers = since
    .map((v, n) => ({ n, v: v === null ? Infinity : v }))
    .sort((a, b) => b.v - a.v || a.n - b.n)
    .slice(0, 8);

  return (
    <>
      <div className="session-label">
        {session.name}
        {session.practice && <span className="badge badge-practice">{t.practiceMode}</span>}
      </div>
      {!session.spins.length ? (
        <p className="empty-note">{t.noData}</p>
      ) : (
        <>
          <KeyFigures stats={stats} t={t} />
          <Card title={t.lawOfThird}>
            <p className="big-line">{t.lawOfThirdText(law.distinct, law.window, law.expected.toFixed(1))}</p>
          </Card>

          <Card title={t.wheel} right={<span className="hint">{t.wheelPoolHint}</span>}>
            <Wheel mode="pool" pool={pool} last={session.spins.at(-1)?.n} />
          </Card>

          <HotCold stats={stats} t={t} />

          <Card title={t.sleepers}>
            <div className="chip-list">
              {sleepers.map(({ n, v }) => (
                <div className="chip-stat" key={n}>
                  <Chip n={n} />
                  <span>{v === Infinity ? t.never : t.ago(v)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Chances stats={stats} t={t} />

          <Streaks stats={stats} t={t}>
            {streak && streak.color !== 'green' && (
              <StatRow label={t.currentStreak} value={`${t.streakKey(streak.color)} · ${t.inARow(streak.length)}`} />
            )}
          </Streaks>

          <Frequency counts={stats.counts} t={t} />

          <History spins={session.spins} t={t} onDelete={(i) => deleteSpin(session.id, i)} />
        </>
      )}
    </>
  );
}

function OverallStats({ sessions }: { sessions: Session[] }) {
  const t = useT();
  const { counted, stats } = useMemo(() => {
    const counted = sessions.filter((s) => !s.practice);
    return { counted, stats: mergeStats(counted.map((s) => computeStats(s.spins))) };
  }, [sessions]);
  const practiceCount = sessions.length - counted.length;

  return (
    <>
      <div className="tiles">
        <StatTile label={t.sessionsCounted} value={counted.length} />
        <StatTile label={t.spins} value={stats.total} />
      </div>
      {practiceCount > 0 && <p className="hint center">{t.practiceExcluded(practiceCount)}</p>}
      {!stats.total ? (
        <p className="empty-note">{t.noData}</p>
      ) : (
        <>
          <KeyFigures stats={stats} t={t} />
          <Card title={t.wheel} right={<span className="hint">{t.wheelHeatHint}</span>}>
            <Wheel mode="heat" counts={stats.counts} />
          </Card>
          <HotCold stats={stats} t={t} />
          <Chances stats={stats} t={t} />
          <Streaks stats={stats} t={t} />
          <Frequency counts={stats.counts} t={t} />
        </>
      )}
    </>
  );
}

function KeyFigures({ stats, t }: { stats: Stats; t: Strings }) {
  const rate = pct(stats.poolHits, stats.total);
  const exp = pct(stats.poolExpected, stats.total);
  return (
    <div className="tiles">
      <StatTile
        label={t.poolHitRate}
        value={fmt(rate)}
        sub={
          <>
            <span className={rate >= exp ? 'pos' : 'neg'}>{t.poolHitRateHint(fmt(exp))}</span>
            {stats.poolFullSpins > 0 && (
              <>
                <br />
                {t.poolHitFull(fmt(pct(stats.poolFullHits, stats.poolFullSpins)), stats.poolFullSpins)}
              </>
            )}
          </>
        }
      />
      <StatTile label={t.spins} value={stats.total} sub={`${t.repeats}: ${stats.repeats}`} />
    </div>
  );
}

function HotCold({ stats, t }: { stats: Stats; t: Strings }) {
  const order = ranked(stats.counts);
  const hot = order.slice(0, 6).filter((n) => stats.counts[n] > 0);
  const cold = order.slice(-6).reverse();
  return (
    <div className="two-col">
      <Card title={`🔥 ${t.hot}`}>
        <div className="chip-list">
          {hot.map((n) => (
            <div className="chip-stat" key={n}>
              <Chip n={n} />
              <span>
                {t.timesShort}
                {stats.counts[n]}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card title={`❄ ${t.cold}`}>
        <div className="chip-list">
          {cold.map((n) => (
            <div className="chip-stat" key={n}>
              <Chip n={n} />
              <span>
                {t.timesShort}
                {stats.counts[n]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Chances({ stats, t }: { stats: Stats; t: Strings }) {
  const T = stats.total;
  return (
    <>
      <Card title={t.chances}>
        <ShareBar label={t.red} value={stats.red} total={T} expected={18 / 37} tone="red" />
        <ShareBar label={t.black} value={stats.black} total={T} expected={18 / 37} tone="black" />
        <ShareBar label={t.zero} value={stats.green} total={T} expected={1 / 37} tone="green" />
        <div className="divider" />
        <ShareBar label={t.even} value={stats.even} total={T} expected={18 / 37} />
        <ShareBar label={t.odd} value={stats.odd} total={T} expected={18 / 37} />
        <div className="divider" />
        <ShareBar label={t.low} value={stats.low} total={T} expected={18 / 37} />
        <ShareBar label={t.high} value={stats.high} total={T} expected={18 / 37} />
        <p className="hint">
          <span className="exp-mark" /> = {t.expected}
        </p>
      </Card>
      <Card title={`${t.dozens} & ${t.columns}`}>
        {stats.dozens.map((v, i) => (
          <ShareBar key={`d${i}`} label={t.dozen(i)} value={v} total={T} expected={12 / 37} />
        ))}
        <div className="divider" />
        {stats.columns.map((v, i) => (
          <ShareBar key={`c${i}`} label={t.column(i)} value={v} total={T} expected={12 / 37} />
        ))}
      </Card>
      <Card title={t.sectors}>
        <ShareBar label={`${t.voisins} (17)`} value={stats.sectors.voisins} total={T} expected={17 / 37} />
        <ShareBar label={`${t.tiers} (12)`} value={stats.sectors.tiers} total={T} expected={12 / 37} />
        <ShareBar label={`${t.orphelins} (8)`} value={stats.sectors.orphelins} total={T} expected={8 / 37} />
      </Card>
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Streaks({ stats, t, children }: { stats: Stats; t: Strings; children?: React.ReactNode }) {
  const c = stats.longestColorStreak;
  const p = stats.longestParityStreak;
  return (
    <Card title={t.streaks}>
      {children}
      <StatRow label={t.longestColor} value={c.length ? `${t.streakKey(c.key)} · ${t.inARow(c.length)}` : '–'} />
      <StatRow label={t.longestParity} value={p.length ? `${t.streakKey(p.key)} · ${t.inARow(p.length)}` : '–'} />
      <StatRow label={t.longestGap} value={stats.longestGap ? t.gapText(stats.longestGap.n, stats.longestGap.length) : '–'} />
    </Card>
  );
}

function Frequency({ counts, t }: { counts: number[]; t: Strings }) {
  const max = Math.max(1, ...counts);
  return (
    <Card title={t.frequency}>
      <div className="freq-grid">
        {counts.map((c, n) => (
          <div className="freq-cell" key={n}>
            <div className="freq-bar-wrap">
              <div className={`freq-bar bar-${colorOf(n)}`} style={{ height: `${(c / max) * 100}%` }} />
            </div>
            <div className={`freq-num num-${colorOf(n)}`}>{n}</div>
            <div className="freq-count">{c}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function History({ spins, t, onDelete }: { spins: Spin[]; t: Strings; onDelete: (i: number) => void }) {
  const [showAll, setShowAll] = useState(false);
  const list = spins.map((s, i) => ({ s, i })).reverse();
  const shown = showAll ? list : list.slice(0, 60);
  return (
    <Card title={t.history} right={<span className="hint">{t.historyHint}</span>}>
      <div className="history">
        {shown.map(({ s, i }) => (
          <button
            key={i}
            className="history-item"
            onClick={async () => {
              const ok = await confirmDialog({
                message: t.deleteSpinConfirm(s.n, i + 1),
                confirmLabel: t.delete,
                cancelLabel: t.cancel,
                danger: true,
              });
              if (ok) onDelete(i);
            }}
          >
            <Chip n={s.n} size="sm" />
            <small>{i + 1}</small>
          </button>
        ))}
      </div>
      {!showAll && list.length > 60 && (
        <button className="btn btn-plain" onClick={() => setShowAll(true)}>
          … {list.length - 60}
        </button>
      )}
    </Card>
  );
}
