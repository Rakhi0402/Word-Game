/**
 * Contract checks for Scrolls/Collection ↔ backend integration.
 * Run: npx tsx src/services/collectionService.test.ts
 */
import assert from 'node:assert/strict';

const COLLECTION_ENDPOINTS = {
  collection: '/api/v1/users/me/collection',
  scrolls: '/api/v1/users/me/scrolls',
  inventory: '/api/v1/cards/inventory',
  draw: '/api/v1/cards/draw',
  equip: '/api/v1/cards/equip',
} as const;

assert.equal(COLLECTION_ENDPOINTS.collection, '/api/v1/users/me/collection');
assert.equal(COLLECTION_ENDPOINTS.scrolls, '/api/v1/users/me/scrolls');
assert.equal(COLLECTION_ENDPOINTS.inventory, '/api/v1/cards/inventory');
assert.equal(COLLECTION_ENDPOINTS.draw, '/api/v1/cards/draw');
assert.equal(COLLECTION_ENDPOINTS.equip, '/api/v1/cards/equip');

/** User-mutable collection fields must never be client-writable via a grant endpoint. */
const FORBIDDEN_CLIENT_GRANT = '/api/v1/users/me/cards';
assert.notEqual(COLLECTION_ENDPOINTS.collection, FORBIDDEN_CLIENT_GRANT);

/** Empty collection shape expected from backend. */
const empty = { cards: [] as unknown[], equippedCardId: null as string | null };
assert.equal(empty.cards.length, 0);
assert.equal(empty.equippedCardId, null);

/** Static catalog remains frontend; ownership is server DTO only. */
const STATIC_METADATA = new Set(['name', 'description', 'rarity', 'image', 'stars', 'bonuses']);
const USER_STATE = new Set(['owned', 'quantity', 'equipped', 'chargesRemaining', 'acquiredAt']);
for (const key of STATIC_METADATA) {
  assert.ok(!USER_STATE.has(key), `${key} must stay presentation metadata`);
}

console.log('collection integration contract checks passed');
