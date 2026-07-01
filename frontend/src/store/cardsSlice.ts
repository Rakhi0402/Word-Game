import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { CHARACTER_CARDS } from '../constants';
import type { RarityType } from '../types';

interface CardsState {
  unlockedCardIds: string[];
  equippedCardId: string;
  equippedCardExpiresAt: number | null; // Timestamp when current equipped card rewards expire
  availableHints: number;
  usedHints: number;
  rarityFilter: RarityType | 'all';
}

const getHintCapacity = (cardId: string): number => {
  const card = CHARACTER_CARDS.find((item) => item.id === cardId);
  if (!card) return 0;

  const summary = `${card.name} ${card.bonuses.join(' ')}`.toLowerCase();
  if (summary.includes('free word suggestions') || summary.includes('auto-reveal') || summary.includes('suggestion')) {
    return 1;
  }

  return 0;
};

const initialState: CardsState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_cards');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        unlockedCardIds: parsed.unlockedCardIds || ['po_common'],
        equippedCardId: parsed.equippedCardId || 'po_common',
        equippedCardExpiresAt: parsed.equippedCardExpiresAt || null,
        availableHints: parsed.availableHints ?? getHintCapacity(parsed.equippedCardId || 'po_common'),
        usedHints: parsed.usedHints || 0,
        rarityFilter: parsed.rarityFilter || 'all',
      };
    }
  } catch (_) {}
  return {
    unlockedCardIds: ['po_common'],
    equippedCardId: 'po_common',
    equippedCardExpiresAt: Date.now() + (5 * 24 * 60 * 60 * 1000),
    availableHints: getHintCapacity('po_common'),
    usedHints: 0,
    rarityFilter: 'all',
  };
})();

const persist = (state: CardsState) => localStorage.setItem('kungfu_cards', JSON.stringify(state));

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    unlockCard(state, action: PayloadAction<string>) {
      if (!state.unlockedCardIds.includes(action.payload)) {
        state.unlockedCardIds.push(action.payload);
        persist(state);
      }
    },
    equipCard(state, action: PayloadAction<string>) {
      if (state.unlockedCardIds.includes(action.payload)) {
        state.equippedCardId = action.payload;
        state.availableHints = getHintCapacity(action.payload);
        state.usedHints = 0;
        // Set expiration to 5 days from now
        state.equippedCardExpiresAt = Date.now() + (5 * 24 * 60 * 60 * 1000);
        persist(state);
      }
    },
    consumeHint(state) {
      if (state.availableHints - state.usedHints > 0) {
        state.usedHints += 1;
        persist(state);
      }
    },
    setRarityFilter(state, action: PayloadAction<RarityType | 'all'>) {
      state.rarityFilter = action.payload;
    },
    resetCards(state) {
      state.unlockedCardIds = ['po_common'];
      state.equippedCardId = 'po_common';
      state.equippedCardExpiresAt = null;
      state.availableHints = getHintCapacity('po_common');
      state.usedHints = 0;
      state.rarityFilter = 'all';
      persist(state);
    },
  },
});

export const { unlockCard, equipCard, consumeHint, setRarityFilter, resetCards } = cardsSlice.actions;
export default cardsSlice.reducer;
