package com.kungfu.wordquest.puzzle.config;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PuzzleConfig {

    EASY(
            10,
            50,
            25,
            3,
            2
    ),

    MEDIUM(
            15,
            100,
            50,
            2,
            3
    ),

    HARD(
            20,
            175,
            80,
            2,
            4
    ),

    EXPERT(
            25,
            300,
            150,
            1,
            5
    );

    private final int requiredWords;
    private final int xpReward;
    private final int coinReward;
    private final int hints;
    private final int minimumPangrams;
}