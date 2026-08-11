package com.kungfu.wordquest.puzzle.reward;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RewardResult {
    private final int xpEarned;
    private final int coinsEarned;
    private final int totalScore;

}
