import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useStore } from './store';

const isNative = Capacitor.isNativePlatform();

export function tapFeedback(strong = false) {
  if (!useStore.getState().settings.haptics) return;
  if (isNative) {
    Haptics.impact({ style: strong ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
  } else if ('vibrate' in navigator) {
    navigator.vibrate?.(strong ? 30 : 12);
  }
}

export async function applyKeepAwake(on: boolean) {
  if (!isNative) return;
  try {
    if (on) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch {
    /* not critical */
  }
}

export async function setupStatusBar() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#072a18' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    /* not critical */
  }
}
