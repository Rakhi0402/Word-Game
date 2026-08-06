import { delay } from './api';
import type { ApiResponse } from './api';
import type { CharacterCard } from '../types';
import { CHARACTER_CARDS } from '../constants';
import {
  CHEST_STAR_WEIGHTS,
  DUPLICATE_REFUND_BY_STARS,
} from '../constants/rewards';

const pickStarByWeight = (): number => {
  const total = CHEST_STAR_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const row of CHEST_STAR_WEIGHTS) {
    roll -= row.weight;
    if (roll <= 0) return row.stars;
  }
  return 1;
};

export const cardService = {
  getCards: async (): Promise<ApiResponse<CharacterCard[]>> => {
    await delay(200);
    return { success: true, data: CHARACTER_CARDS };
  },

  drawRandomCard: async (
    ownedIds: string[],
    exhaustedIds: string[]
  ): Promise<
    ApiResponse<{
      card: CharacterCard;
      isDuplicate: boolean;
      isExhaustedRestore: boolean;
      refundAmount: number;
    }>
  > => {
    await delay(600);
    const stars = pickStarByWeight();
    const pool = CHARACTER_CARDS.filter((c) => c.stars === stars);
    const card = pool[Math.floor(Math.random() * pool.length)] || CHARACTER_CARDS[0];

    const isExhaustedRestore = exhaustedIds.includes(card.id);
    const alreadyAvailable = ownedIds.includes(card.id) && !isExhaustedRestore;
    const isDuplicate = alreadyAvailable;

    const refundAmount = isDuplicate ? (DUPLICATE_REFUND_BY_STARS[card.stars] ?? 20) : 0;

    return {
      success: true,
      data: {
        card,
        isDuplicate,
        isExhaustedRestore,
        refundAmount,
      },
    };
  },
};
