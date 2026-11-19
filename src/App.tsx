import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useStore, useT, type Tab } from './store';
import { DialogHost, useDialogs } from './ui/dialog';
import { IconPlay, IconSessions, IconSettings, IconStats } from './ui/icons';
import { PlayScreen } from './screens/PlayScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SessionsScreen } from './screens/SessionsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { applyKeepAwake, applyOrientation, setupStatusBar, tapFeedback } from './native';
import { initVoiceControl, registerVoiceHelp, setAppVisible } from './voiceControl';
import { openVoiceHelpSheet } from './ui/VoiceUi';
import { openHowTo } from './ui/Extras';

export function App() {
  const t = useT();
  const hydrated = useStore((s) => s.hydrated);
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const textScale = useStore((s) => s.settings.textScale);
  const keepAwake = useStore((s) => s.settings.keepAwake);
  const lang = useStore((s) => s.settings.lang);
  const orientation = useStore((s) => s.settings.orientation);

  useEffect(() => {
    applyOrientation(orientation);
  }, [orientation]);

  useEffect(() => {
    if (!hydrated) return;
    registerVoiceHelp(openVoiceHelpSheet);
    initVoiceControl();
    if (!useStore.getState().settings.seenIntro) {
      openHowTo();
      useStore.getState().updateSettings({ seenIntro: true });
    }
  }, [hydrated]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * textScale}px`;
  }, [textScale]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    applyKeepAwake(keepAwake);
  }, [keepAwake]);

  useEffect(() => {
    setupStatusBar();
    const sub = CapApp.addListener('backButton', () => {
      if (useDialogs.getState().closeTop()) return;
      const st = useStore.getState();
      if (st.tab !== 'play') {
        st.setTab('play');
        return;
      }
      CapApp.minimizeApp();
    });
    const state = CapApp.addListener('appStateChange', ({ isActive }) => setAppVisible(isActive));
    const onVis = () => setAppVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      sub.then((h) => h.remove());
      state.then((h) => h.remove());
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="splash">
        <div className="brand-title">Korbi's Roulette</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'play', label: t.tabPlay, icon: <IconPlay /> },
    { id: 'stats', label: t.tabStats, icon: <IconStats /> },
    { id: 'sessions', label: t.tabSessions, icon: <IconSessions /> },
    { id: 'settings', label: t.tabSettings, icon: <IconSettings /> },
  ];

  return (
    <div className="app">
      <main className="main">
        {tab === 'play' && <PlayScreen />}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'sessions' && <SessionsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <nav className="tabbar">
        {tabs.map((x) => (
          <button
            key={x.id}
            className={`tab ${tab === x.id ? 'tab-on' : ''}`}
            onClick={() => {
              tapFeedback();
              if (x.id === 'stats' && tab !== 'stats') useStore.setState({ viewSessionId: null });
              setTab(x.id);
            }}
          >
            {x.icon}
            <span>{x.label}</span>
          </button>
        ))}
      </nav>
      <DialogHost />
    </div>
  );
}
