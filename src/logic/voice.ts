/**
 * Forgiving voice-command parser for German and English.
 *
 * Understands (in either language, mixed freely):
 *  - numbers 0-36 as digits ("17") or words ("siebzehn", "seventeen",
 *    "einundzwanzig", "ein und zwanzig", "twenty one", "zwo"...)
 *  - several numbers at once ("17 5 32")
 *  - undo:    "rückgängig", "zurück", "undo", "oops" ...
 *  - delete:  "lösch die 17", "delete 17"       -> removes the latest 17
 *  - correct: "falsch, 17", "nicht 5 sondern 17", "correction 17" -> replaces the last spin
 *  - reading: "vorlesen" / "read aloud" (on), "vorlesen aus" / "stop reading" (off)
 *  - stop:    "stopp", "stop", "ruhe", "quiet"
 *  - help:    "hilfe", "help"
 * Filler words ("die", "Zahl", "the number", "rot", "black" ...) are ignored.
 */

export type VoiceCommand =
  | { kind: 'numbers'; numbers: number[] }
  | { kind: 'undo' }
  | { kind: 'delete'; n: number }
  | { kind: 'replace'; n: number }
  | { kind: 'readOn' }
  | { kind: 'readOff' }
  | { kind: 'stop' }
  | { kind: 'help' }
  | { kind: 'unknown'; tooBig?: number };

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d)([a-z])/g, '$1 $2') // "17er" -> "17 er"
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---------- number words ----------
const DE_UNITS: Record<string, number> = {
  null: 0, nul: 0, nulle: 0,
  eins: 1, ein: 1, eine: 1, einen: 1, eis: 1,
  zwei: 2, zwo: 2, zwai: 2,
  drei: 3, drai: 3,
  vier: 4, vir: 4,
  fuenf: 5, funf: 5, fuemf: 5, fuff: 5,
  sechs: 6, sex: 6, sechz: 6,
  sieben: 7, siebn: 7, sibn: 7,
  acht: 8,
  neun: 9, neune: 9,
  zehn: 10, zen: 10,
  elf: 11, elfe: 11,
  zwoelf: 12, zwolf: 12,
  dreizehn: 13, vierzehn: 14, fuenfzehn: 15, funfzehn: 15, sechzehn: 16, siebzehn: 17,
  achtzehn: 18, neunzehn: 19,
  zwanzig: 20, zwanzich: 20,
  dreissig: 30, dreisig: 30, dreizig: 30, dreissich: 30,
};

const EN_UNITS: Record<string, number> = {
  zero: 0, nil: 0, nought: 0,
  one: 1, won: 1,
  two: 2, to: 2, too: 2,
  three: 3, tree: 3,
  four: 4, for: 4, fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8, ate: 8,
  nine: 9, niner: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20,
  thirty: 30,
};

const WORDS: Record<string, number> = { ...DE_UNITS, ...EN_UNITS };

// German compounds "einundzwanzig" ... "sechsunddreissig"
const DE_UNIT_STEMS: [string, number][] = [
  ['ein', 1], ['zwei', 2], ['zwo', 2], ['drei', 3], ['vier', 4], ['fuenf', 5], ['funf', 5],
  ['sechs', 6], ['sieben', 7], ['acht', 8], ['neun', 9],
];
for (const [stem, u] of DE_UNIT_STEMS) {
  WORDS[`${stem}undzwanzig`] = 20 + u;
  if (u <= 6) {
    WORDS[`${stem}unddreissig`] = 30 + u;
    WORDS[`${stem}unddreisig`] = 30 + u;
  }
}

const FILLER = new Set([
  'die', 'der', 'das', 'den', 'dem', 'eine', 'ist', 'war', 'es', 'zahl', 'nummer', 'nr', 'kam', 'kommt',
  'gefallen', 'faellt', 'bitte', 'ja', 'jetzt', 'noch', 'mal', 'dann', 'also', 'und', 'er', 'e',
  'rot', 'rote', 'roten', 'schwarz', 'schwarze', 'gruen',
  'the', 'a', 'an', 'number', 'is', 'was', 'it', 'its', 'came', 'please', 'now', 'and', 'then', 'okay',
  'ok', 'red', 'black', 'green', 'please', 'machen', 'mach', 'letzte', 'letzten', 'last', 'one',
]);

// ---------- command words (matched as token prefixes) ----------
const UNDO = ['rueckgaengig', 'rueckgangig', 'ruckgangig', 'rueckgaeng', 'zurueck', 'zuruck', 'undo', 'oops', 'ups', 'hoppla', 'back'];
const DELETE = ['loesch', 'losch', 'entfern', 'streich', 'weg', 'delete', 'remove', 'erase', 'scratch', 'clear'];
const CORRECT = ['falsch', 'korrektur', 'korrigier', 'sondern', 'statt', 'stattdessen', 'fehler', 'wrong', 'correct', 'instead', 'actually', 'mistake'];
const READ = ['vorlesen', 'vorles', 'lies', 'lesen', 'ansag', 'read', 'speak', 'sprich'];
const OFF = ['aus', 'off', 'stopp', 'stop', 'halt', 'ruhe', 'leise', 'quiet', 'silence', 'schluss', 'beenden', 'end'];
const STOP = ['stopp', 'stop', 'halt', 'ruhe', 'leise', 'quiet', 'silence', 'schluss', 'aufhoeren', 'aufhoren'];
const HELP = ['hilfe', 'help', 'helfen'];

const has = (tokens: string[], list: string[]) => tokens.some((t) => list.some((w) => t === w || (w.length >= 4 && t.startsWith(w))));

/** Extract numbers in order; values > 36 are reported via `tooBig`. */
export function extractNumbers(tokens: string[]): { numbers: number[]; tooBig?: number } {
  const numbers: number[] = [];
  let tooBig: number | undefined;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let v: number | undefined;
    if (/^\d+$/.test(tok)) {
      v = parseInt(tok, 10);
    } else if (tok in WORDS && !(FILLER.has(tok) && !isStrongNumber(tok))) {
      v = WORDS[tok];
      // German split compound: "ein und zwanzig"
      if (v >= 1 && v <= 9 && tokens[i + 1] === 'und' && (tokens[i + 2] === 'zwanzig' || tokens[i + 2]?.startsWith('dreis') || tokens[i + 2] === 'dreizig')) {
        v += WORDS[tokens[i + 2]] ?? (tokens[i + 2].startsWith('dreis') ? 30 : 0);
        i += 2;
      } else if ((v === 20 || v === 30) && i + 1 < tokens.length) {
        // English "twenty one"
        const next = tokens[i + 1];
        const u = EN_UNITS[next];
        if (u !== undefined && u >= 1 && u <= 9 && next !== 'to' && next !== 'too' && next !== 'for') {
          v += u;
          i += 1;
        }
      }
    }
    if (v === undefined) continue;
    if (v > 36) {
      tooBig = v;
      continue;
    }
    numbers.push(v);
  }
  return { numbers, tooBig };
}

/** "eine"/"one" are filler words unless they are the only thing said. */
function isStrongNumber(tok: string) {
  return !['eine', 'one'].includes(tok);
}

export function parseVoice(text: string): VoiceCommand {
  const tokens = normalize(text).split(' ').filter(Boolean);
  if (!tokens.length) return { kind: 'unknown' };

  // "eine" / "one" alone = 1
  if (tokens.length === 1 && (tokens[0] === 'eine' || tokens[0] === 'one')) return { kind: 'numbers', numbers: [1] };

  const { numbers, tooBig } = extractNumbers(tokens);
  const isRead = has(tokens, READ);
  const isOff = has(tokens, OFF);

  if (has(tokens, HELP)) return { kind: 'help' };
  if (isRead) return isOff ? { kind: 'readOff' } : { kind: 'readOn' };
  if (has(tokens, CORRECT) && numbers.length) return { kind: 'replace', n: numbers[numbers.length - 1] };
  if (has(tokens, DELETE) && numbers.length) return { kind: 'delete', n: numbers[numbers.length - 1] };
  if (has(tokens, UNDO) || has(tokens, DELETE) || has(tokens, CORRECT)) return { kind: 'undo' };
  if (has(tokens, STOP) && !numbers.length) return { kind: 'stop' };
  if (numbers.length) return { kind: 'numbers', numbers };
  return { kind: 'unknown', tooBig };
}

/** Recognisers return several guesses – take the first one that makes sense. */
export function parseAlternatives(matches: string[]): { command: VoiceCommand; heard: string } {
  for (const m of matches) {
    const command = parseVoice(m);
    if (command.kind !== 'unknown') return { command, heard: m };
  }
  const first = matches[0] ?? '';
  return { command: parseVoice(first), heard: first };
}
