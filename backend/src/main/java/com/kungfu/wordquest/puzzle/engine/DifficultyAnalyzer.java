package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DifficultyAnalyzer {

    public PuzzleDifficulty analyzeDifficulty(List<String> validWords, List<String> pangrams) {
        if (validWords == null || validWords.isEmpty()) {
            return PuzzleDifficulty.EASY;
        }

        int wordCount = validWords.size();
        int pangramCount = pangrams != null ? pangrams.size() : 0;

        // Calculate average word length
        double averageLength = validWords.stream()
                .mapToInt(String::length)
                .average()
                .orElse(4.0);

        if (wordCount > 35 || averageLength > 6.5) {
            return PuzzleDifficulty.EXPERT;
        } else if (wordCount > 25 || averageLength > 5.5 || pangramCount > 1) {
            return PuzzleDifficulty.HARD;
        } else if (wordCount > 15 || averageLength > 4.8) {
            return PuzzleDifficulty.MEDIUM;
        } else {
            return PuzzleDifficulty.EASY;
        }
    }
}
