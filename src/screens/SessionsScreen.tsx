import { useState } from 'react';
import { formatDateTime, useStore, useT } from '../store';
import { Toggle } from '../ui/components';
import { confirmDialog, openDialog, Sheet } from '../ui/dialog';
import { tapFeedback } from '../native';

export function SessionsScreen() {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeId);
  const endSession = useStore((s) => s.endSession);
  const setTab = useStore((s) => s.setTab);
  const resumeSession = useStore((s) => s.resumeSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const showSessionStats = useStore((s) => s.showSessionStats);

  const sorted = [...sessions].sort((a, b) => (b.id === activeId ? 1 : 0) - (a.id === activeId ? 1 : 0) || b.updatedAt - a.updatedAt);

  const newSession = async () => {
    if (activeId) {
      const ok = await confirmDialog({
        title: t.newSession,
        message: t.startNewConfirm,
        confirmLabel: t.yes,
        cancelLabel: t.no,
      });
      if (!ok) return;
      endSession();
    }
    setTab('play');
  };

  return (
    <div className="screen screen-scroll">
      <h1 className="screen-title">{t.sessionsTitle}</h1>
      <button className="btn btn-gold btn-lg" onClick={newSession}>
        ＋ {t.newSession}
      </button>
      <p className="hint center">{t.savedAuto}</p>

      {!sorted.length && <p className="empty-note">{t.noSessions}</p>}

      <ul className="session-list">
        {sorted.map((s) => {
          const isActive = s.id === activeId;
          return (
            <li key={s.id} className={`session-card ${isActive ? 'is-active' : ''}`}>
              <div className="session-top">
                <div className="session-name">{s.name}</div>
                <div className="badges">
                  {isActive && <span className="badge badge-active">{t.active}</span>}
                  {s.practice && <span className="badge badge-practice">{t.practiceMode}</span>}
                </div>
              </div>
              <div className="session-meta">
                {formatDateTime(s.createdAt, lang)} · <b>{s.spins.length}</b> {t.spins} · {t.poolSizeLabel(s.poolSize)}
                {s.endedAt && !isActive ? ` · ${t.ended}` : ''}
              </div>
              <div className="session-actions">
                {!isActive && (
                  <button className="btn btn-gold" onClick={() => resumeSession(s.id)}>
                    ▶ {t.open}
                  </button>
                )}
                {isActive && (
                  <button className="btn btn-gold" onClick={() => setTab('play')}>
                    ▶ {t.tabPlay}
                  </button>
                )}
                <button className="btn btn-plain" onClick={() => showSessionStats(s.id)}>
                  {t.tabStats}
                </button>
                <button
                  className="btn btn-plain"
                  onClick={() => openDialog((close) => <EditSessionSheet sessionId={s.id} close={close} />)}
                >
                  ✎ {t.edit}
                </button>
                <button
                  className="btn btn-danger-outline"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: t.delete,
                      message: t.deleteSessionConfirm(s.name),
                      confirmLabel: t.delete,
                      cancelLabel: t.cancel,
                      danger: true,
                    });
                    if (ok) {
                      tapFeedback(true);
                      deleteSession(s.id);
                    }
                  }}
                >
                  🗑 {t.delete}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EditSessionSheet({ sessionId, close }: { sessionId: string; close: () => void }) {
  const t = useT();
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId));
  const updateSession = useStore((s) => s.updateSession);
  const [name, setName] = useState(session?.name ?? '');
  const [practice, setPractice] = useState(session?.practice ?? false);
  if (!session) return null;
  return (
    <Sheet title={t.editSession}>
      <label className="field">
        <span className="field-label">{t.name}</span>
        <input className="input" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)} />
      </label>
      <Toggle checked={!practice} onChange={(v) => setPractice(!v)} label={t.countsToStats} hint={practice ? t.practiceModeHint : undefined} />
      <div className="dialog-actions">
        <button className="btn btn-plain" onClick={close}>
          {t.cancel}
        </button>
        <button
          className="btn btn-gold"
          onClick={() => {
            updateSession(session.id, { name, practice });
            close();
          }}
        >
          {t.save}
        </button>
      </div>
    </Sheet>
  );
}
