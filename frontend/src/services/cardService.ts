import { delay } from './api';
import type { ApiResponse } from './api';
import type { CharacterCard } from '../types';
import { CHARACTER_CARDS } from '../constants';

export const cardService = {
  getCards: async (): Promise<ApiResponse<CharacterCard[]>> => {
    await delay(300);
    return { success: true, data: CHARACTER_CARDS };
  },

  drawRandomCard: async (
    ownedIds: string[]
  ): Promise<ApiResponse<{ card: CharacterCard; isDuplicate: boolean; refundAmount: number }>> => {
    await delay(800);
    const card = CHARACTER_CARDS[Math.floor(Math.random() * CHARACTER_CARDS.length)];
    const isDuplicate = ownedIds.includes(card.id);
    const refundMap: Record<string, number> = { common: 25, rare: 50, epic: 100, legendary: 250 };
    const refundAmount = isDuplicate ? (refundMap[card.rarity] ?? 25) : 0;
    return { success: true, data: { card, isDuplicate, refundAmount } };
  },
};
