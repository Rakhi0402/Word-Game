package com.kungfu.wordquest.puzzle.engine;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScoreCalculator {

    private final CardBonusEvaluator cardBonusEvaluator;

    public int calculateWordPoints(String word, boolean isPangram, int currentStreak, String equippedCardId, char centerLetter) {
        if (word == null || word.length() < 4) {
            return 0;
        }

        // Base points: length * 10
        int basePoints = word.length() * 10;

        // Apply streak multiplier: +10% per streak point
        double streakModifier = 0.10;
        if ("shifu_epic".equals(equippedCardId)) {
            streakModifier = 0.20; // Double streak multiplier
        }
        double streakMultiplier = 1.0 + (currentStreak * streakModifier);
        int pointsWithStreak = (int) Math.round(basePoints * streakMultiplier);

        // Apply card modifiers (Po, Mantis, Tigress, Dragon Warrior Po, etc.)
        return cardBonusEvaluator.applyScoreModifier(word, pointsWithStreak, equippedCardId, isPangram, centerLetter);
    }
}
