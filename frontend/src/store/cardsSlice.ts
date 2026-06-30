import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RarityType } from '../types';

interface CardsState {
  unlockedCardIds: string[];
  equippedCardId: string;
  equippedCardExpiresAt: number | null; // Timestamp when current equipped card rewards expire
  rarityFilter: RarityType | 'all';
}

const initialState: CardsState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_cards');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return { 
    unlockedCardIds: ['po_common'], 
    equippedCardId: 'po_common', 
    equippedCardExpiresAt: Date.now() + (5 * 24 * 60 * 60 * 1000),
    rarityFilter: 'all' 
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
        // Set expiration to 5 days from now
        state.equippedCardExpiresAt = Date.now() + (5 * 24 * 60 * 60 * 1000);
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
      state.rarityFilter = 'all';
      persist(state);
    },
  },
});

export const { unlockCard, equipCard, setRarityFilter, resetCards } = cardsSlice.actions;
export default cardsSlice.reducer;
