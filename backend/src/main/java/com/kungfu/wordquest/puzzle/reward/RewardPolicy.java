package com.kungfu.wordquest.puzzle.reward;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RewardPolicy {
    private final int baseXp;
    private final int baseCoins;
    private final int completionBonusXp;
    private final int completionBonusCoins;


}
