/** Thin wrappers around native (Capacitor) and browser speech APIs. */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import type { Lang } from './i18n/strings';

const isNative = Capacitor.isNativePlatform();
const locale = (lang: Lang) => (lang === 'de' ? 'de-DE' : 'en-US');

// ---------------- Text to speech ----------------

export async function speak(text: string, lang: Lang, rate = 0.8): Promise<void> {
  if (isNative) {
    await TextToSpeech.speak({ text, lang: locale(lang), rate, pitch: 1, volume: 1, category: 'playback' });
    return;
  }
  if (typeof speechSynthesis === 'undefined') return;
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale(lang);
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
    // Safety net: some browsers never fire onend.
    setTimeout(resolve, 4000 + text.length * 250);
  });
}

export async function stopSpeaking(): Promise<void> {
  try {
    if (isNative) await TextToSpeech.stop();
    else if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

// ---------------- Speech recognition ----------------

type WebRecognition = {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function webRecognitionCtor(): (new () => WebRecognition) | null {
  const w = globalThis as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => WebRecognition) | null;
}

let webRec: WebRecognition | null = null;

export async function recognitionAvailable(): Promise<boolean> {
  try {
    if (isNative) return (await SpeechRecognition.available()).available;
    return !!webRecognitionCtor();
  } catch {
    return false;
  }
}

/** Ask for microphone permission. Returns true when granted. */
export async function ensureMicPermission(): Promise<boolean> {
  if (!isNative) return true; // browser asks by itself
  try {
    let st = await SpeechRecognition.checkPermissions();
    if (st.speechRecognition !== 'granted') st = await SpeechRecognition.requestPermissions();
    return st.speechRecognition === 'granted';
  } catch {
    return false;
  }
}

/** Listen for one phrase. Resolves with the recogniser's guesses (may be empty). */
export async function listenOnce(lang: Lang): Promise<string[]> {
  if (isNative) {
    try {
      const res = await SpeechRecognition.start({
        language: locale(lang),
        maxResults: 5,
        partialResults: false,
        popup: false,
      });
      return res.matches ?? [];
    } catch {
      return []; // "no match" / timeout
    }
  }
  const Ctor = webRecognitionCtor();
  if (!Ctor) return [];
  return new Promise((resolve) => {
    const rec = new Ctor();
    webRec = rec;
    rec.lang = locale(lang);
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    let done = false;
    const finish = (v: string[]) => {
      if (done) return;
      done = true;
      webRec = null;
      resolve(v);
    };
    rec.onresult = (e) => {
      const alts = e.results[0];
      const out: string[] = [];
      for (let i = 0; i < alts.length; i++) out.push(alts[i].transcript);
      finish(out);
    };
    rec.onerror = () => finish([]);
    rec.onend = () => finish([]);
    rec.start();
  });
}

export async function stopListening(): Promise<void> {
  try {
    if (isNative) await SpeechRecognition.stop();
    else webRec?.abort();
  } catch {
    /* ignore */
  }
}
