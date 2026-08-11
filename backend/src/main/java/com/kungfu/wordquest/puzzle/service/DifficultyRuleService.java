package com.kungfu.wordquest.puzzle.service;

import com.kungfu.wordquest.puzzle.config.PuzzleConfig;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.stereotype.Service;

@Service
public class DifficultyRuleService {

    public PuzzleConfig getConfig(PuzzleDifficulty difficulty){
        return switch (difficulty){

            case EASY -> PuzzleConfig.EASY;

            case MEDIUM -> PuzzleConfig.MEDIUM;

            case HARD -> PuzzleConfig.HARD;

            case EXPERT -> PuzzleConfig.EXPERT;
        };
    }

}