package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.stereotype.Component;

@Component
public class CardBonusEvaluator {

    public int applyScoreModifier(
            String word,
            int basePoints,
            String equippedCardId,
            boolean isPangram,
            char centerLetter) {

        if (equippedCardId == null) {
            return basePoints;
        }

        double multiplier = 1.0;

        switch (equippedCardId) {

            case "po_common":
                // +10% score for non-pangram words
                if (!isPangram) {
                    multiplier += 0.10;
                }
                break;

            case "mantis_rare":
                // Double score for 5-letter words
                if (word.length() == 5) {
                    multiplier += 1.0;
                }
                break;

            case "tigress_rare":
                // Double score if word starts with center letter
                if (!word.isEmpty()
                        && Character.toUpperCase(word.charAt(0))
                        == Character.toUpperCase(centerLetter)) {
                    multiplier += 1.0;
                }

                // +15% overall
                multiplier += 0.15;
                break;

            case "dragon_warrior_po":
                multiplier += 0.20;
                break;

            default:
                break;
        }

        return (int) Math.round(basePoints * multiplier);
    }

    public int applyXpModifier(
            int baseXp,
            String equippedCardId,
            PuzzleDifficulty difficulty) {

        if (equippedCardId == null) {
            return baseXp;
        }

        double multiplier = 1.0;
        int flatBonus = 0;

        switch (equippedCardId) {

            case "po_common":
                flatBonus += 10;
                break;

            case "crane_common":
                if (difficulty == PuzzleDifficulty.EASY) {
                    flatBonus += 10;
                }
                break;

            case "mantis_rare":
                flatBonus += 20;
                break;

            case "dragon_warrior_po":
                multiplier += 0.35;
                break;

            case "oogway_legendary":
                multiplier += 1.0;
                break;

            default:
                break;
        }

        return (int) Math.round(baseXp * multiplier) + flatBonus;
    }

    public int applyCoinModifier(
            int baseCoins,
            String equippedCardId,
            int wordLength) {

        if (equippedCardId == null) {
            return baseCoins;
        }

        double multiplier = 1.0;
        int flatBonus = 0;

        switch (equippedCardId) {

            case "monkey_common":
                if (wordLength == 4) {
                    flatBonus += 5;
                }
                break;

            case "viper_rare":
                flatBonus += 10;
                break;

            case "shifu_epic":
                multiplier += 0.25;
                break;

            case "oogway_legendary":
                multiplier += 1.0;
                break;

            default:
                break;
        }

        return (int) Math.round(baseCoins * multiplier) + flatBonus;
    }

    public boolean shouldRetainStreakOnFailure(
            String equippedCardId,
            int failureCountInSession) {

        return "viper_rare".equals(equippedCardId)
                && failureCountInSession <= 1;
    }
}