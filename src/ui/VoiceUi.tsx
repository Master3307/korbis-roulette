import { useEffect, useState } from 'react';
import { useStore, useT } from '../store';
import { cancelListening, startListening, useVoiceUi } from '../voiceControl';
import { tapFeedback } from '../native';
import { Sheet, openDialog } from './dialog';
import { IconMic, IconSpeaker } from './icons';

export function openVoiceHelpSheet() {
  openDialog((close) => <VoiceHelpSheet close={close} />);
}

function VoiceHelpSheet({ close }: { close: () => void }) {
  const t = useT();
  return (
    <Sheet title={t.voiceHelp}>
      <ul className="help-list">
        {t.voiceHelpItems.map(([say, what]) => (
          <li key={say}>
            <span className="help-say">{say}</span>
            <span className="help-what">{what}</span>
          </li>
        ))}
      </ul>
      <p className="hint center">{t.voiceHelpNote}</p>
      <button className="btn btn-gold btn-lg" onClick={close}>
        {t.ok}
      </button>
    </Sheet>
  );
}

export function ReadToggleButton() {
  const t = useT();
  const on = useStore((s) => s.settings.readAloud);
  const update = useStore((s) => s.updateSettings);
  return (
    <button
      className={`icon-btn ${on ? 'icon-btn-on' : ''}`}
      aria-pressed={on}
      onClick={() => {
        tapFeedback();
        update({ readAloud: !on });
      }}
    >
      <IconSpeaker on={on} />
      <span>{t.readShort}</span>
    </button>
  );
}

export function MicButton() {
  const t = useT();
  const listening = useVoiceUi((s) => s.listening);
  return (
    <button
      className={`icon-btn mic-btn ${listening ? 'mic-on' : ''}`}
      aria-pressed={listening}
      onClick={() => (listening ? cancelListening() : startListening())}
    >
      <IconMic />
      <span>{listening ? t.stopShort : t.speakShort}</span>
    </button>
  );
}

/** Banner over the play screen: "listening…" or what was understood. */
export function VoiceBanner() {
  const t = useT();
  const listening = useVoiceUi((s) => s.listening);
  const fb = useVoiceUi((s) => s.feedback);
  const [, force] = useState(0);
  // Long messages stay longer so slower readers can finish them.
  const duration = fb ? Math.max(4000, fb.message.length * 75) : 0;
  useEffect(() => {
    if (!fb) return;
    const id = setTimeout(() => force((x) => x + 1), duration + 200);
    return () => clearTimeout(id);
  }, [fb, duration]);
  const showFb = fb && Date.now() - fb.at < duration;

  if (!listening && !showFb) return null;
  return (
    <div className={`voice-banner ${listening ? 'vb-listening' : fb?.ok ? 'vb-ok' : 'vb-bad'}`} role="status" aria-live="polite">
      {showFb && (
        <div className="vb-result">
          {fb.heard && <span className="vb-heard">„{fb.heard}"</span>}
          <span className="vb-msg">
            {fb.ok ? '✓ ' : '✗ '}
            {fb.message}
          </span>
        </div>
      )}
      {listening && (
        <div className="vb-listen">
          <span className="vb-pulse" aria-hidden />
          <span>
            <b>{t.listening}</b>
            {!showFb && <small>{t.listeningHint}</small>}
          </span>
        </div>
      )}
    </div>
  );
}
