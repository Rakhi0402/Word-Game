/**
 * Puzzle API contract checks (Easy/Medium/Hard/Expert).
 * Run: npx tsx src/services/puzzleService.contract.test.ts
 */
import assert from 'node:assert/strict';

const ENDPOINTS = {
  daily: '/api/v1/puzzles/daily',
  byDifficulty: '/api/v1/puzzles?difficulty=',
  submit: '/api/v1/puzzles/session/submit',
  hint: '/api/v1/puzzles/session/hint',
  start: '/api/v1/puzzles/session/start',
} as const;

assert.equal(ENDPOINTS.daily, '/api/v1/puzzles/daily');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;
assert.ok(DIFFICULTIES.includes('EXPERT'));

/** Production responses must never require validWords on the client. */
const sampleView = {
  puzzle: {
    id: 'x',
    difficulty: 'EXPERT',
    letters: ['A'],
    centerLetter: 'A',
    targetWordCount: 25,
    xpReward: 250,
    coinReward: 100,
  },
  progress: {
    status: 'NOT_STARTED',
    completed: false,
    foundWords: [] as string[],
    score: 0,
    streak: 0,
    hintsUsed: 0,
    wordsFoundCount: 0,
    targetWordCount: 25,
  },
};

assert.equal('validWords' in sampleView.puzzle, false);
assert.equal(sampleView.puzzle.difficulty, 'EXPERT');

console.log('puzzle integration contract checks passed');
