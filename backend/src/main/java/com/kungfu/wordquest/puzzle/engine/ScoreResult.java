package com.kungfu.wordquest.puzzle.engine;

import lombok.Builder;

@Builder
public record ScoreResult(
        int baseScore,

        int streakBonus,

        int pangramBonus,

        int cardBonus,

        int finalScore
) {

}
