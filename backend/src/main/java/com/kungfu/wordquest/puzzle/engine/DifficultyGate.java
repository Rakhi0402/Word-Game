package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.puzzle.config.PuzzleProperties;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Shared publish rules for dictionary-backed and AI-assisted puzzle generation.
 * Player win targets stay in {@link com.kungfu.wordquest.puzzle.config.PuzzleConfig};
 * these floors ensure the answer list is large enough for a Spelling Bee–style game.
 */
@Component
@RequiredArgsConstructor
public class DifficultyGate {

    private final PuzzleProperties properties;

    public int minValidWords(PuzzleDifficulty d) {
        var g = properties.getGeneration();
        return switch (d) {
            case EASY -> g.getEasyMinWords();
            case MEDIUM -> g.getMediumMinWords();
            case HARD -> g.getHardMinWords();
            case EXPERT -> g.getExpertMinWords();
        };
    }

    public int minPangrams(PuzzleDifficulty d) {
        var g = properties.getGeneration();
        return switch (d) {
            case EASY -> g.getEasyMinPangrams();
            case MEDIUM -> g.getMediumMinPangrams();
            case HARD -> g.getHardMinPangrams();
            case EXPERT -> g.getExpertMinPangrams();
        };
    }

    /** Soft upper band for random search only (AI may exceed this). */
    public int softMaxValidWords(PuzzleDifficulty d) {
        var g = properties.getGeneration();
        return switch (d) {
            case EASY -> g.getEasySoftMaxWords();
            case MEDIUM -> g.getMediumSoftMaxWords();
            case HARD -> g.getHardSoftMaxWords();
            case EXPERT -> g.getExpertSoftMaxWords();
        };
    }

    public boolean passes(PuzzleDifficulty d, int wordCount, int pangramCount) {
        return wordCount >= minValidWords(d) && pangramCount >= minPangrams(d);
    }

    /**
     * Random generator prefers puzzles inside [min, softMax] so Easy stays approachable.
     * AI path uses {@link #passes} only (larger lists OK).
     */
    public boolean passesRandomBand(PuzzleDifficulty d, int wordCount, int pangramCount) {
        if (!passes(d, wordCount, pangramCount)) {
            return false;
        }
        int softMax = softMaxValidWords(d);
        return softMax <= 0 || wordCount <= softMax;
    }

    public String describe(PuzzleDifficulty d) {
        return d.name() + " requires ≥" + minValidWords(d) + " valid words (≥4 letters) and ≥"
                + minPangrams(d) + " pangram(s)";
    }
}
