import { MAX_POOL, MIN_POOL } from '../logic/pool';
import { READ_RATES, useStore, useT, type Orientation, type TextScale } from '../store';
import { speak, stopSpeaking } from '../speech';
import { openVoiceHelpSheet } from '../ui/VoiceUi';
import { GamblingNote, NeighbourSettings, openAbout, openGamblingHelp, openHowTo } from '../ui/Extras';
import { Card, Segmented, Stepper, Toggle } from '../ui/components';
import { confirmDialog, openDialog, Sheet } from '../ui/dialog';

declare const __APP_VERSION__: string;

export function SettingsScreen() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const deleteAll = useStore((s) => s.deleteAll);

  return (
    <div className="screen screen-scroll">
      <h1 className="screen-title">{t.tabSettings}</h1>
      <div className="intro-btns">
        <button className="btn btn-plain howto-btn" onClick={openHowTo}>
          ❔ {t.howButton}
        </button>
        <button className="btn btn-plain howto-btn" onClick={openAbout}>
          ℹ {t.aboutButton}
        </button>
      </div>

      <Card title={t.language}>
        <Segmented
          value={settings.lang}
          onChange={(lang) => update({ lang })}
          options={[
            { value: 'de', label: '🇩🇪 Deutsch' },
            { value: 'en', label: '🇬🇧 English' },
          ]}
        />
      </Card>

      <Card title={t.textSize}>
        <Segmented<TextScale>
          value={settings.textScale}
          onChange={(textScale) => update({ textScale })}
          options={[
            { value: 1, label: <span style={{ fontSize: '0.9em' }}>{t.textNormal}</span> },
            { value: 1.15, label: <span style={{ fontSize: '1.05em' }}>{t.textLarge}</span> },
            { value: 1.3, label: <span style={{ fontSize: '1.2em' }}>{t.textXL}</span> },
          ]}
        />
      </Card>

      <Card>
        <Toggle checked={settings.haptics} onChange={(haptics) => update({ haptics })} label={t.vibration} />
        <Toggle checked={settings.keepAwake} onChange={(keepAwake) => update({ keepAwake })} label={t.keepAwake} />
      </Card>

      <Card title={`🔊 ${t.voiceCard}`}>
        <Toggle checked={settings.readAloud} onChange={(readAloud) => update({ readAloud })} label={t.readAloud} hint={t.readAloudHint} />
        <div className="field-label">{t.readSpeed}</div>
        <div className="speed-list">
          {t.speeds.map((label, i) => (
            <button
              key={label}
              className={`speed-btn ${settings.readSpeed === i ? 'speed-on' : ''}`}
              aria-pressed={settings.readSpeed === i}
              onClick={() => update({ readSpeed: i })}
            >
              <span className="speed-bars" aria-hidden>
                {Array.from({ length: 5 }, (_, k) => (
                  <i key={k} className={k <= i ? 'on' : ''} />
                ))}
              </span>
              {label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-plain btn-lg"
          onClick={async () => {
            await stopSpeaking();
            speak(t.testVoiceText, settings.lang, READ_RATES[settings.readSpeed]).catch(() =>
              openDialog((close) => (
                <Sheet title={t.voiceCard}>
                  <p className="dialog-msg">{t.ttsMissing}</p>
                  <button className="btn btn-gold btn-lg" onClick={close}>
                    {t.ok}
                  </button>
                </Sheet>
              )),
            );
          }}
        >
          ▶ {t.testVoice}
        </button>
        <div className="divider" />
        <Toggle checked={settings.voiceInput} onChange={(voiceInput) => update({ voiceInput })} label={`🎤 ${t.voiceInput}`} hint={t.voiceInputHint} />
        {settings.voiceInput && (
          <>
            <Toggle checked={settings.handsFree} onChange={(handsFree) => update({ handsFree })} label={t.handsFree} hint={t.handsFreeHint} />
            <button className="btn btn-plain btn-lg" onClick={openVoiceHelpSheet}>
              ❔ {t.voiceHelp}
            </button>
          </>
        )}
      </Card>

      <Card title={`🎯 ${t.nbMode}`}>
        <NeighbourSettings />
      </Card>

      <Card title={t.orientation}>
        <Segmented<Orientation>
          value={settings.orientation}
          onChange={(orientation) => update({ orientation })}
          options={[
            { value: 'portrait', label: <span className="orient-opt"><span className="orient-ic orient-p" />{t.orientPortrait}</span> },
            { value: 'landscape', label: <span className="orient-opt"><span className="orient-ic orient-l" />{t.orientLandscape}</span> },
            { value: 'auto', label: <span className="orient-opt"><span className="orient-ic orient-a">⟳</span>{t.orientAuto}</span> },
          ]}
        />
        <p className="hint">{t.orientHint}</p>
      </Card>

      <Card title={t.defaultPool}>
        <Stepper
          value={settings.defaultPoolSize}
          onChange={(defaultPoolSize) => update({ defaultPoolSize })}
          min={MIN_POOL}
          max={MAX_POOL}
          presets={[12, 18, 24, 30]}
        />
      </Card>

      <Card title={t.data}>
        <p className="hint">{t.savedAuto}</p>
        <button
          className="btn btn-danger-outline btn-lg"
          onClick={async () => {
            const a = await confirmDialog({
              title: t.deleteAll,
              message: t.deleteAllConfirm,
              confirmLabel: t.delete,
              cancelLabel: t.cancel,
              danger: true,
            });
            if (!a) return;
            const b = await confirmDialog({
              title: t.deleteAll,
              message: t.deleteAllConfirm2,
              confirmLabel: t.deleteAll,
              cancelLabel: t.cancel,
              danger: true,
            });
            if (b) deleteAll();
          }}
        >
          🗑 {t.deleteAll}
        </button>
      </Card>

      <Card title={`♥ ${t.rgTitle}`}>
        <p className="disclaimer">{t.rgIntro}</p>
        <button className="btn btn-gold btn-lg" onClick={openGamblingHelp}>
          {t.rgButton}
        </button>
      </Card>

      <Card title={t.about}>
        <div className="about-name">{t.appName}</div>
        <p className="hint">
          {t.version} {__APP_VERSION__}
        </p>
        <p className="disclaimer">{t.disclaimer}</p>
      </Card>
      <GamblingNote />
    </div>
  );
}
