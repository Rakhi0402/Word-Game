package com.kungfu.wordquest.config;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DifficultyRegistry {

    private final Map<PuzzleDifficulty, DifficultyConfig> configs = Map.of(

            PuzzleDifficulty.EASY,

            new DifficultyConfig(
                    50,
                    25,
                    10,
                    75,
                    10,
                    0.10,
                    3,
                    1.0
            ),

            PuzzleDifficulty.MEDIUM,

            new DifficultyConfig(
                    100,
                    50,
                    15,
                    100,
                    12,
                    0.12,
                    3,
                    1.20
            ),

            PuzzleDifficulty.HARD,

            new DifficultyConfig(
                    180,
                    75,
                    20,
                    125,
                    14,
                    0.15,
                    2,
                    1.40
            ),

            PuzzleDifficulty.EXPERT,

            new DifficultyConfig(
                    300,
                    120,
                    25,
                    150,
                    16,
                    0.20,
                    2,
                    1.60
            )
    );

    public DifficultyConfig get(PuzzleDifficulty difficulty) {
        return configs.get(difficulty);
    }
}