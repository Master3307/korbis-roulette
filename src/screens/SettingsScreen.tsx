import { MAX_POOL, MIN_POOL } from '../logic/pool';
import { useStore, useT, type TextScale } from '../store';
import { Card, Segmented, Stepper, Toggle } from '../ui/components';
import { confirmDialog } from '../ui/dialog';

declare const __APP_VERSION__: string;

export function SettingsScreen() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const deleteAll = useStore((s) => s.deleteAll);

  return (
    <div className="screen screen-scroll">
      <h1 className="screen-title">{t.tabSettings}</h1>

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

      <Card title={t.about}>
        <div className="about-name">{t.appName}</div>
        <p className="hint">
          {t.version} {__APP_VERSION__}
        </p>
        <p className="disclaimer">{t.disclaimer}</p>
      </Card>
    </div>
  );
}
