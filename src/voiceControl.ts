/**
 * Reading aloud + voice input controller.
 *
 * Rule: the app never talks while it listens (otherwise the microphone hears
 * the app itself and enters numbers). Listening always has priority; reading
 * pauses and restarts from the top afterwards.
 */
import { create } from 'zustand';
import { analyzeSpins } from './logic/pool';
import { parseAlternatives, type VoiceCommand } from './logic/voice';
import { ensureMicPermission, listenOnce, recognitionAvailable, speak, stopListening, stopSpeaking } from './speech';
import { READ_RATES, useStore } from './store';
import { STRINGS } from './i18n/strings';
import { tapFeedback } from './native';

export interface Feedback {
  heard: string;
  message: string;
  ok: boolean;
  at: number;
}

interface VoiceUi {
  /** Microphone session active (one-shot or hands-free). */
  listening: boolean;
  /** Pool slot (0-based) currently being read. */
  readingIndex: number | null;
  feedback: Feedback | null;
}

export const useVoiceUi = create<VoiceUi>(() => ({ listening: false, readingIndex: null, feedback: null }));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const t = () => STRINGS[useStore.getState().settings.lang];
const rate = () => READ_RATES[useStore.getState().settings.readSpeed] ?? 0.7;

function activePool(): number[] {
  const st = useStore.getState();
  const s = st.sessions.find((x) => x.id === st.activeId);
  if (!s) return [];
  return analyzeSpins(s.spins).recency.slice(0, s.poolSize);
}

// ---------------------------------------------------------------- reading

let readGen = 0;
let appVisible = true;

function shouldRead() {
  return appVisible && useStore.getState().settings.readAloud && !useVoiceUi.getState().listening && activePool().length > 0;
}

/** (Re)start the reading loop from slot 1, or stop it if reading is off. */
export function restartReading() {
  const gen = ++readGen;
  stopSpeaking();
  useVoiceUi.setState({ readingIndex: null });
  if (shouldRead()) void readLoop(gen);
}

async function readLoop(gen: number) {
  await sleep(350);
  let i = 0;
  let failures = 0;
  while (gen === readGen) {
    const pool = activePool();
    if (!pool.length || !shouldRead()) break;
    if (i >= pool.length) {
      useVoiceUi.setState({ readingIndex: null });
      await sleep(2200 / rate());
      i = 0;
      continue;
    }
    useVoiceUi.setState({ readingIndex: i });
    try {
      await speak(String(pool[i]), useStore.getState().settings.lang, rate());
      failures = 0;
    } catch {
      failures++;
      if (failures >= 3) {
        // No working voice on this phone: tell the user once instead of failing silently.
        feedback('', t().ttsMissing, false);
        useVoiceUi.setState({ readingIndex: null });
        return;
      }
      await sleep(800);
    }
    if (gen !== readGen) return;
    await sleep(Math.round(550 / rate()));
    i++;
  }
  if (gen === readGen) useVoiceUi.setState({ readingIndex: null });
}

// ---------------------------------------------------------------- listening

let listenGen = 0;

function feedback(heard: string, message: string, ok: boolean) {
  useVoiceUi.setState({ feedback: { heard, message, ok, at: Date.now() } });
}

export async function startListening() {
  if (useVoiceUi.getState().listening) return;
  const s = t();
  if (!(await recognitionAvailable())) {
    feedback('', s.micUnavailable, false);
    return;
  }
  if (!(await ensureMicPermission())) {
    feedback('', s.micDenied, false);
    return;
  }
  const gen = ++listenGen;
  useVoiceUi.setState({ listening: true, feedback: null });
  restartReading(); // pauses reading
  await stopSpeaking();
  tapFeedback();

  let emptyInRow = 0;
  while (gen === listenGen) {
    const lang = useStore.getState().settings.lang;
    const matches = await listenOnce(lang);
    if (gen !== listenGen) break;

    if (!matches.length) {
      emptyInRow++;
      if (!useStore.getState().settings.handsFree || emptyInRow >= 8) {
        feedback('', t().heardNothing, false);
        break;
      }
      await sleep(250);
      continue;
    }
    emptyInRow = 0;
    const { command, heard } = parseAlternatives(matches);
    const say = applyCommand(command, heard);
    if (command.kind === 'stop') break;
    if (say) {
      try {
        await speak(say, lang, 1);
      } catch {
        /* ignore */
      }
    }
    if (!useStore.getState().settings.handsFree || command.kind === 'help') break;
    await sleep(200);
  }
  if (gen === listenGen) {
    useVoiceUi.setState({ listening: false });
    restartReading();
  }
}

export async function cancelListening() {
  listenGen++;
  useVoiceUi.setState({ listening: false });
  await stopListening();
  restartReading();
}

/** Carry out a recognised command. Returns a short phrase to say back. */
export function applyCommand(cmd: VoiceCommand, heard: string): string | null {
  const st = useStore.getState();
  const s = t();
  const session = st.sessions.find((x) => x.id === st.activeId);
  const needsSession = cmd.kind === 'numbers' || cmd.kind === 'undo' || cmd.kind === 'delete' || cmd.kind === 'replace';
  if (needsSession && !session) {
    feedback(heard, s.heardNoSession, false);
    return null;
  }
  switch (cmd.kind) {
    case 'numbers': {
      cmd.numbers.forEach((n) => st.addSpin(n));
      const list = cmd.numbers.join(', ');
      feedback(heard, s.heardAdded(list), true);
      tapFeedback(true);
      return list;
    }
    case 'undo':
      if (!session!.spins.length) {
        feedback(heard, s.nothingYet, false);
        return null;
      }
      st.undoSpin();
      feedback(heard, s.heardUndo, true);
      return s.sayUndo;
    case 'delete': {
      const idx = session!.spins.map((x) => x.n).lastIndexOf(cmd.n);
      if (idx === -1) {
        feedback(heard, s.heardNotFound(cmd.n), false);
        return null;
      }
      st.deleteSpin(session!.id, idx);
      feedback(heard, s.heardDeleted(cmd.n), true);
      return s.heardDeleted(cmd.n);
    }
    case 'replace':
      if (!session!.spins.length) st.addSpin(cmd.n);
      else st.replaceLastSpin(cmd.n);
      feedback(heard, s.heardReplaced(cmd.n), true);
      return s.heardReplaced(cmd.n);
    case 'readOn':
      st.updateSettings({ readAloud: true });
      feedback(heard, s.heardReadOn, true);
      return null;
    case 'readOff':
      st.updateSettings({ readAloud: false });
      feedback(heard, s.heardReadOff, true);
      return null;
    case 'stop':
      st.updateSettings({ readAloud: false });
      feedback(heard, s.heardStop, true);
      return null;
    case 'neighboursOn':
      st.updateSettings({ neighbourMode: true });
      feedback(heard, s.heardNbOn, true);
      return null;
    case 'neighboursOff':
      st.updateSettings({ neighbourMode: false });
      feedback(heard, s.heardNbOff, true);
      return null;
    case 'help':
      feedback(heard, s.voiceHelp, true);
      openVoiceHelp();
      return null;
    case 'unknown':
      feedback(heard, cmd.tooBig !== undefined ? s.heardTooBig(cmd.tooBig) : s.heardUnknown, false);
      return s.sayUnknown;
  }
}

let helpOpener: (() => void) | null = null;
/** Registered by the UI so the controller can open the help sheet. */
export function registerVoiceHelp(fn: () => void) {
  helpOpener = fn;
}
function openVoiceHelp() {
  helpOpener?.();
}

// ---------------------------------------------------------------- wiring

let started = false;
/** Call once at app start: restarts reading whenever something relevant changes. */
export function initVoiceControl() {
  if (started) return;
  started = true;
  let lastKey = '';
  const key = () => {
    const st = useStore.getState();
    const s = st.sessions.find((x) => x.id === st.activeId);
    return [st.settings.readAloud, st.settings.lang, st.settings.readSpeed, st.activeId, s?.spins.length, s?.spins.at(-1)?.n, s?.poolSize].join('|');
  };
  useStore.subscribe(() => {
    const k = key();
    if (k === lastKey) return;
    lastKey = k;
    restartReading();
  });
  lastKey = key();
  restartReading();
}

export function setAppVisible(v: boolean) {
  appVisible = v;
  if (!v) {
    void cancelListening();
  }
  restartReading();
}
