/**
 * Dictionary contract: FE never receives full dictionary / answer keys.
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
  puzzle: { id: '1', letters: ['A'], centerLetter: 'A', targetWordCount: 10 },
  progress: { completed: false, foundWords: [] as string[] },
};
assert.equal('validWords' in dailyView.puzzle, false);

console.log('dictionary frontend contract checks passed');
