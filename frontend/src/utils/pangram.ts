/** Spelling-Bee style pangram: word uses every letter on the wheel at least once. */
export function isPangramFromLetters(word: string, letters: string[]): boolean {
  if (!word || !letters?.length) return false;
  const upper = word.toUpperCase();
  const required = new Set(letters.map((l) => l.toUpperCase()).filter(Boolean));
  if (required.size === 0) return false;
  for (const c of required) {
    if (!upper.includes(c)) return false;
  }
  return true;
}
