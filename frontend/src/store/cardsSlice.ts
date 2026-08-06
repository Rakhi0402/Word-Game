import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { CHARACTER_CARDS } from '../constants';
import {
  FREE_DAILY_HINTS,
  getStarTier,
} from '../constants/rewards';
import type { CardStatus, RarityType } from '../types';

export interface CardInventoryEntry {
  chargesRemaining: number;
  status: CardStatus;
}

interface CardsState {
  unlockedCardIds: string[];
  /** Inventory metadata per owned card */
  inventory: Record<string, CardInventoryEntry>;
  equippedCardId: string | null;
  equippedCardExpiresAt: number | null;
  availableHints: number;
  usedHints: number;
  paidHintsUsedThisPuzzle: number;
  rarityFilter: RarityType | 'all';
  hintsDayKey: string | null;
}

export const getHintCapacity = (cardId: string | null, permanentExtra = false, bonusNextDay = 0): number => {
  let bonus = permanentExtra ? 1 : 0;
  bonus += bonusNextDay;
  if (cardId) {
    const card = CHARACTER_CARDS.find((item) => item.id === cardId);
    if (card) {
      const tier = getStarTier(card.stars);
      bonus += tier.freeHintExtra;
    }
  }
  return FREE_DAILY_HINTS + bonus;
};

export const getCharacterMultiplier = (cardId: string | null): number => {
  if (!cardId) return 0;
  const card = CHARACTER_CARDS.find((item) => item.id === cardId);
  if (!card) return 0;
  return getStarTier(card.stars).xpBonus;
};

export const getScoreBonus = (cardId: string | null): number => {
  if (!cardId) return 0;
  const card = CHARACTER_CARDS.find((c) => c.id === cardId);
  if (!card) return 0;
  return getStarTier(card.stars).scoreBonus;
};

export const getCoinBonus = (cardId: string | null): number => {
  if (!cardId) return 0;
  const card = CHARACTER_CARDS.find((c) => c.id === cardId);
  if (!card) return 0;
  return getStarTier(card.stars).coinBonus;
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fullChargesFor = (cardId: string): number => {
  const card = CHARACTER_CARDS.find((c) => c.id === cardId);
  return getStarTier(card?.stars ?? 1).charges;
};

const defaultInventory = (): Record<string, CardInventoryEntry> => ({
  po_common: { chargesRemaining: fullChargesFor('po_common'), status: 'available' },
});

const initialState: CardsState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_cards');
    if (saved) {
      const parsed = JSON.parse(saved);
      const unlocked: string[] = parsed.unlockedCardIds || ['po_common'];
      const inventory: Record<string, CardInventoryEntry> = parsed.inventory || {};
      unlocked.forEach((id) => {
        if (!inventory[id]) {
          inventory[id] = { chargesRemaining: fullChargesFor(id), status: 'available' };
        }
      });
      const equipped = parsed.equippedCardId;
      const validEquip =
        equipped && inventory[equipped]?.status === 'available' ? equipped : unlocked[0] || null;
      return {
        unlockedCardIds: unlocked,
        inventory,
        equippedCardId: validEquip,
        equippedCardExpiresAt: parsed.equippedCardExpiresAt || null,
        availableHints: parsed.availableHints ?? getHintCapacity(validEquip),
        usedHints: parsed.usedHints || 0,
        paidHintsUsedThisPuzzle: parsed.paidHintsUsedThisPuzzle || 0,
        rarityFilter: parsed.rarityFilter || 'all',
        hintsDayKey: parsed.hintsDayKey || null,
      };
    }
  } catch (error) {
    void error;
  }
  return {
    unlockedCardIds: ['po_common'],
    inventory: defaultInventory(),
    equippedCardId: 'po_common',
    equippedCardExpiresAt: null,
    availableHints: getHintCapacity('po_common'),
    usedHints: 0,
    paidHintsUsedThisPuzzle: 0,
    rarityFilter: 'all' as const,
    hintsDayKey: todayKey(),
  };
})();

const persist = (state: CardsState) => localStorage.setItem('kungfu_cards', JSON.stringify(state));

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    replaceCards(_state, action: PayloadAction<CardsState>) {
      const next = { ...action.payload };
      persist(next);
      return next;
    },
    refreshDailyHints(
      state,
      action: PayloadAction<{ permanentExtra?: boolean; bonusNextDay?: number } | undefined>
    ) {
      const key = todayKey();
      if (state.hintsDayKey === key) return;
      state.hintsDayKey = key;
      state.usedHints = 0;
      state.paidHintsUsedThisPuzzle = 0;
      state.availableHints = getHintCapacity(
        state.equippedCardId,
        action.payload?.permanentExtra,
        action.payload?.bonusNextDay
      );
      persist(state);
    },
    unlockCard(
      state,
      action: PayloadAction<{ cardId: string; restoreCharges?: boolean }>
    ) {
      const { cardId, restoreCharges } = action.payload;
      const charges = fullChargesFor(cardId);
      if (!state.unlockedCardIds.includes(cardId)) {
        state.unlockedCardIds.push(cardId);
        state.inventory[cardId] = { chargesRemaining: charges, status: 'available' };
      } else if (restoreCharges || state.inventory[cardId]?.status === 'exhausted') {
        state.inventory[cardId] = { chargesRemaining: charges, status: 'available' };
      }
      persist(state);
    },
    refillCardCharges(state, action: PayloadAction<{ cardId: string; amount?: number }>) {
      const entry = state.inventory[action.payload.cardId];
      if (!entry) return;
      const max = fullChargesFor(action.payload.cardId);
      const add = action.payload.amount ?? max;
      entry.chargesRemaining = Math.min(max, entry.chargesRemaining + add);
      if (entry.chargesRemaining > 0) entry.status = 'available';
      persist(state);
    },
    refillExhaustedByStars(state, action: PayloadAction<number>) {
      const stars = action.payload;
      const exhausted = state.unlockedCardIds.filter((id) => {
        const card = CHARACTER_CARDS.find((c) => c.id === id);
        return card?.stars === stars && state.inventory[id]?.status === 'exhausted';
      });
      if (exhausted.length === 0) return;
      const id = exhausted[0];
      state.inventory[id] = { chargesRemaining: fullChargesFor(id), status: 'available' };
      persist(state);
    },
    refillHighestExhausted(state) {
      const exhausted = state.unlockedCardIds
        .map((id) => ({ id, card: CHARACTER_CARDS.find((c) => c.id === id), entry: state.inventory[id] }))
        .filter((x) => x.entry?.status === 'exhausted' && x.card)
        .sort((a, b) => (b.card!.stars - a.card!.stars));
      if (exhausted.length === 0) return;
      const id = exhausted[0].id;
      state.inventory[id] = { chargesRemaining: fullChargesFor(id), status: 'available' };
      persist(state);
    },
    equipCard(state, action: PayloadAction<string>) {
      const id = action.payload;
      const entry = state.inventory[id];
      if (!state.unlockedCardIds.includes(id) || !entry || entry.status !== 'available') return;
      state.equippedCardId = id;
      state.availableHints = getHintCapacity(id);
      // Don't reset usedHints mid-day unless refreshing
      persist(state);
    },
    unequipCard(state) {
      state.equippedCardId = null;
      persist(state);
    },
    consumeCardChargeOnComplete(state) {
      const id = state.equippedCardId;
      if (!id) return;
      const entry = state.inventory[id];
      if (!entry || entry.status !== 'available') return;
      entry.chargesRemaining = Math.max(0, entry.chargesRemaining - 1);
      if (entry.chargesRemaining <= 0) {
        entry.status = 'exhausted';
        entry.chargesRemaining = 0;
        state.equippedCardId = null;
      }
      persist(state);
    },
    consumeFreeHint(state) {
      if (state.availableHints - state.usedHints > 0) {
        state.usedHints += 1;
        persist(state);
      }
    },
    /** @deprecated use consumeFreeHint */
    consumeHint(state) {
      if (state.availableHints - state.usedHints > 0) {
        state.usedHints += 1;
        persist(state);
      }
    },
    recordPaidHint(state) {
      state.paidHintsUsedThisPuzzle += 1;
      persist(state);
    },
    resetPuzzleHintCounters(state) {
      state.paidHintsUsedThisPuzzle = 0;
      persist(state);
    },
    setRarityFilter(state, action: PayloadAction<RarityType | 'all'>) {
      state.rarityFilter = action.payload;
      persist(state);
    },
    resetDailyHints(state) {
      state.availableHints = getHintCapacity(state.equippedCardId);
      state.usedHints = 0;
      state.paidHintsUsedThisPuzzle = 0;
      state.hintsDayKey = todayKey();
      persist(state);
    },
    resetCards() {
      const next: CardsState = {
        unlockedCardIds: ['po_common'],
        inventory: defaultInventory(),
        equippedCardId: 'po_common',
        equippedCardExpiresAt: null,
        availableHints: getHintCapacity('po_common'),
        usedHints: 0,
        paidHintsUsedThisPuzzle: 0,
        rarityFilter: 'all',
        hintsDayKey: todayKey(),
      };
      persist(next);
      return next;
    },
  },
});

export const {
  replaceCards,
  refreshDailyHints,
  unlockCard,
  refillCardCharges,
  refillExhaustedByStars,
  refillHighestExhausted,
  equipCard,
  unequipCard,
  consumeCardChargeOnComplete,
  consumeFreeHint,
  consumeHint,
  recordPaidHint,
  resetPuzzleHintCounters,
  setRarityFilter,
  resetDailyHints,
  resetCards,
} = cardsSlice.actions;

export default cardsSlice.reducer;
export type { CardsState };
