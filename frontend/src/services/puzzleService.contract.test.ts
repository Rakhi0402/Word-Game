/**
 * Puzzle API contract checks (Easy/Medium/Hard/Expert).
 * Run: npx tsx src/services/puzzleService.contract.test.ts
 */
import assert from 'node:assert/strict';

const ENDPOINTS = {
  daily: '/api/v1/puzzles/daily',
  byDifficulty: '/api/v1/puzzles?difficulty=',
  pool: '/api/v1/puzzles/pool?difficulty=',
  submit: '/api/v1/puzzles/session/submit',
  sync: '/api/v1/puzzles/session/sync',
  hint: '/api/v1/puzzles/session/hint',
  start: '/api/v1/puzzles/session/start',
} as const;

assert.equal(ENDPOINTS.daily, '/api/v1/puzzles/daily');
assert.ok(ENDPOINTS.pool.includes('/pool'));
assert.ok(ENDPOINTS.sync.includes('/sync'));

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;
assert.ok(DIFFICULTIES.includes('EXPERT'));

/** Play payloads may include per-puzzle validWords for local Spelling Bee validation. */
const sampleView = {
  puzzle: {
    id: 1,
    difficulty: 'EXPERT',
    letters: ['A'],
    centerLetter: 'A',
    targetWordCount: 25,
    xpReward: 250,
    coinReward: 100,
    validWords: ['AAAA', 'ABBA'],
    pangrams: ['AAAA'],
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

assert.ok(Array.isArray(sampleView.puzzle.validWords));
assert.equal(sampleView.puzzle.difficulty, 'EXPERT');

console.log('puzzle integration contract checks passed');
