package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.stereotype.Service;

@Service
public class ScoreRuleService {

    public ScoreConfig getRule(PuzzleDifficulty difficulty){

        return switch (difficulty){

            case EASY ->
                    new ScoreConfig(
                            10,
                            50,
                            0.05
                    );

            case MEDIUM ->
                    new ScoreConfig(
                            12,
                            75,
                            0.07
                    );

            case HARD ->
                    new ScoreConfig(
                            15,
                            100,
                            0.10
                    );

            case EXPERT ->
                    new ScoreConfig(
                            20,
                            150,
                            0.15
                    );
        };

    }

}