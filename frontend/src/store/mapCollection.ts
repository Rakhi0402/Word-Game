import type { BackendUserCard, CollectionResponse } from '../types/dashboard';
import { getHintCapacity, type CardsState } from './cardsSlice';

/** Map authoritative collection DTO → Redux cards cache (no invented ownership). */
export const mapCollectionToCards = (collection: CollectionResponse): CardsState => {
  const inventory: CardsState['inventory'] = {};
  const unlockedCardIds: string[] = [];
  for (const c of collection.cards || []) {
    if (!c.owned) continue;
    unlockedCardIds.push(c.id);
    inventory[c.id] = {
      chargesRemaining: c.chargesRemaining ?? 0,
      status: (c.status === 'exhausted' || c.chargesRemaining <= 0
        ? 'exhausted'
        : 'available') as 'available' | 'exhausted',
    };
  }
  const equippedCandidate = collection.equippedCardId;
  const equipped =
    equippedCandidate && inventory[equippedCandidate]?.status === 'available'
      ? equippedCandidate
      : null;
  return {
    unlockedCardIds,
    inventory,
    equippedCardId: equipped,
    equippedCardExpiresAt: null,
    availableHints: getHintCapacity(equipped),
    usedHints: 0,
    paidHintsUsedThisPuzzle: 0,
    rarityFilter: 'all',
    hintsDayKey: null,
  };
};

export const mapInventoryToCards = (
  inventory: BackendUserCard[] | CollectionResponse,
  equippedCardId?: string | null
): CardsState => {
  if (inventory && !Array.isArray(inventory) && 'cards' in inventory) {
    return mapCollectionToCards(inventory);
  }
  const list = (inventory as BackendUserCard[]) || [];
  const asCollection: CollectionResponse = {
    equippedCardId: equippedCardId ?? null,
    cards: list.map((uc) => ({
      id: uc.card?.id || uc.id,
      owned: true,
      quantity: uc.count,
      equipped: (uc.card?.id || uc.id) === equippedCardId,
      chargesRemaining: uc.chargesRemaining,
      status: uc.status,
      definition: uc.card,
    })),
  };
  return mapCollectionToCards(asCollection);
};
