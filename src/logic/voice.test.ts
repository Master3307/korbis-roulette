import { parseAlternatives, parseVoice } from './voice';

const nums = (t: string) => {
  const c = parseVoice(t);
  return c.kind === 'numbers' ? c.numbers : c;
};

describe('voice: German numbers', () => {
  it.each([
    ['null', [0]], ['Null', [0]], ['eins', [1]], ['eine', [1]], ['zwei', [2]], ['zwo', [2]], ['drei', [3]],
    ['fünf', [5]], ['sechs', [6]], ['sieben', [7]], ['acht', [8]], ['neun', [9]], ['zehn', [10]], ['elf', [11]],
    ['zwölf', [12]], ['dreizehn', [13]], ['siebzehn', [17]], ['neunzehn', [19]], ['zwanzig', [20]],
    ['einundzwanzig', [21]], ['ein und zwanzig', [21]], ['fünfundzwanzig', [25]], ['neunundzwanzig', [29]],
    ['dreißig', [30]], ['dreissig', [30]], ['sechsunddreißig', [36]], ['zweiunddreißig', [32]],
    ['die 17', [17]], ['Zahl 17', [17]], ['rot 32', [32]], ['schwarz 17', [17]], ['17er', [17]],
  ])('%s', (t, e) => expect(nums(t)).toEqual(e));
});

describe('voice: English numbers', () => {
  it.each([
    ['zero', [0]], ['one', [1]], ['two', [2]], ['four', [4]], ['eight', [8]], ['eleven', [11]],
    ['seventeen', [17]], ['twenty', [20]], ['twenty one', [21]], ['twenty-one', [21]], ['thirty six', [36]],
    ['thirty-two', [32]], ['number 17', [17]], ['the number is 5', [5]], ['red 5', [5]], ['black 22', [22]],
  ])('%s', (t, e) => expect(nums(t)).toEqual(e));
});

describe('voice: several numbers and mixing', () => {
  it('several digits', () => expect(nums('17 5 32')).toEqual([17, 5, 32]));
  it('mixed languages', () => expect(nums('siebzehn and five')).toEqual([17, 5]));
  it('17 und 5', () => expect(nums('17 und 5')).toEqual([17, 5]));
  it('ignores > 36 and reports it', () => expect(parseVoice('45')).toEqual({ kind: 'unknown', tooBig: 45 }));
  it('keeps valid ones next to big ones', () => expect(nums('17 99')).toEqual([17]));
});

describe('voice: commands', () => {
  it.each([
    ['rückgängig', 'undo'], ['Rückgängig machen', 'undo'], ['zurück', 'undo'], ['undo', 'undo'], ['oops', 'undo'],
    ['go back', 'undo'], ['löschen', 'undo'], ['delete', 'undo'], ['falsch', 'undo'],
    ['vorlesen', 'readOn'], ['lies vor', 'readOn'], ['read aloud', 'readOn'], ['start reading', 'readOn'],
    ['vorlesen aus', 'readOff'], ['stop reading', 'readOff'], ['vorlesen stopp', 'readOff'],
    ['stopp', 'stop'], ['stop', 'stop'], ['ruhe', 'stop'], ['quiet', 'stop'],
    ['hilfe', 'help'], ['help', 'help'], ['was kann ich sagen hilfe', 'help'],
    ['nachbarn', 'neighboursOn'], ['Nachbarn an', 'neighboursOn'], ['nachbarn aus', 'neighboursOff'],
    ['show neighbours', 'neighboursOn'], ['neighbors off', 'neighboursOff'],
    ['blabla', 'unknown'], ['', 'unknown'],
  ])('%s -> %s', (t, k) => expect(parseVoice(t).kind).toBe(k));

  it('delete a specific number', () => {
    expect(parseVoice('lösch die 17')).toEqual({ kind: 'delete', n: 17 });
    expect(parseVoice('delete seventeen')).toEqual({ kind: 'delete', n: 17 });
    expect(parseVoice('17 entfernen')).toEqual({ kind: 'delete', n: 17 });
  });
  it('correct the last number', () => {
    expect(parseVoice('falsch, 17')).toEqual({ kind: 'replace', n: 17 });
    expect(parseVoice('nicht 5 sondern 17')).toEqual({ kind: 'replace', n: 17 });
    expect(parseVoice('correction twenty one')).toEqual({ kind: 'replace', n: 21 });
    expect(parseVoice('wrong, it was 3')).toEqual({ kind: 'replace', n: 3 });
  });
  it('neun is never mistaken for a "no"', () => expect(nums('neun')).toEqual([9]));
});

describe('alternatives', () => {
  it('picks the first understandable guess', () => {
    expect(parseAlternatives(['blub', 'siebzehn', 'sieben'])).toEqual({ command: { kind: 'numbers', numbers: [17] }, heard: 'siebzehn' });
  });
  it('falls back to the first guess', () => {
    expect(parseAlternatives(['blub', 'bla']).command.kind).toBe('unknown');
    expect(parseAlternatives([]).command.kind).toBe('unknown');
  });
});
