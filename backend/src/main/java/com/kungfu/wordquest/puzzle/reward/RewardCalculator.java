package com.kungfu.wordquest.puzzle.reward;

import com.kungfu.wordquest.puzzle.engine.CardBonusEvaluator;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RewardCalculator {
    private final CardBonusEvaluator cardBonusEvaluator;

    public RewardResult calculate(

            User user,

            Puzzle puzzle,

            int score

    ){
        int xp = puzzle.getXpReward();

        int coins = puzzle.getCoinReward();

        xp = cardBonusEvaluator.applyXpModifier(

                xp,

                user.getEquippedCardId(),

                puzzle.getDifficulty()

        );

        coins = cardBonusEvaluator.applyCoinModifier(

                coins,

                user.getEquippedCardId(),

                0

        );

        return RewardResult.builder()

                .xpEarned(xp)

                .coinsEarned(coins)

                .totalScore(score)

                .build();

    }
}
