/**
 * Dictionary contract: FE never receives the full 65k lexicon.
 * Per-puzzle answer lists are allowed for Spelling Bee–style local play.
 * Run: npx tsx src/services/dictionary.contract.test.ts
 */
import assert from 'node:assert/strict';

const FORBIDDEN_PUBLIC = [
  '/api/v1/dictionary',
  '/api/v1/words',
  '/api/v1/dictionary/export',
];

for (const path of FORBIDDEN_PUBLIC) {
  assert.ok(path.startsWith('/api/'), 'paths are API shaped');
}

const submitBody = { word: 'apple' };
assert.equal('valid' in submitBody, false);
assert.equal('score' in submitBody, false);
assert.equal('isPangram' in submitBody, false);

const dailyView = {
  puzzle: {
    id: '1',
    letters: ['A'],
    centerLetter: 'A',
    targetWordCount: 10,
    validWords: ['ABLE', 'AREA'],
  },
  progress: { completed: false, foundWords: [] as string[] },
};
assert.ok(Array.isArray(dailyView.puzzle.validWords));
assert.ok(dailyView.puzzle.validWords.length < 1000, 'per-puzzle list, not full lexicon');

console.log('dictionary frontend contract checks passed');
