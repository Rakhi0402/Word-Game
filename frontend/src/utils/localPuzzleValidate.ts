import { isPangramFromLetters } from './pangram';

export type LocalRejectReason =
  | 'too_short'
  | 'missing_center'
  | 'bad_letters'
  | 'not_in_dict'
  | 'duplicate';

export interface LocalValidateOk {
  ok: true;
  word: string;
  isPangram: boolean;
  points: number;
}

export interface LocalValidateFail {
  ok: false;
  reason: LocalRejectReason;
}

/**
 * Spelling Bee–style client validation against the puzzle's answer list.
 */
export function validateWordLocally(opts: {
  raw: string;
  letters: string[];
  centerLetter: string;
  validWords: string[];
  pangrams?: string[];
  alreadyFound: string[];
  streak: number;
  minLength?: number;
}): LocalValidateOk | LocalValidateFail {
  const minLen = opts.minLength ?? 4;
  const word = opts.raw.toUpperCase().trim();
  const center = (opts.centerLetter || '').toUpperCase();
  const allowed = new Set((opts.letters || []).map((l) => l.toUpperCase()));

  if (word.length < minLen) {
    return { ok: false, reason: 'too_short' };
  }
  if (!center || !word.includes(center)) {
    return { ok: false, reason: 'missing_center' };
  }
  for (const ch of word) {
    if (!allowed.has(ch)) {
      return { ok: false, reason: 'bad_letters' };
    }
  }
  if (opts.alreadyFound.some((w) => w.toUpperCase() === word)) {
    return { ok: false, reason: 'duplicate' };
  }

  const answers = new Set((opts.validWords || []).map((w) => w.toUpperCase()));
  if (answers.size > 0 && !answers.has(word)) {
    return { ok: false, reason: 'not_in_dict' };
  }
  // If no answer list loaded yet, reject — fall back path should use server submit.
  if (answers.size === 0) {
    return { ok: false, reason: 'not_in_dict' };
  }

  const pangramSet = new Set((opts.pangrams || []).map((w) => w.toUpperCase()));
  const isPangram =
    pangramSet.has(word) || isPangramFromLetters(word, opts.letters || []);

  const base = word.length * 10;
  const streakMultiplier = 1 + opts.streak * 0.1;
  let points = Math.round(base * streakMultiplier);
  if (isPangram) {
    points += 75;
  }

  return { ok: true, word, isPangram, points };
}
