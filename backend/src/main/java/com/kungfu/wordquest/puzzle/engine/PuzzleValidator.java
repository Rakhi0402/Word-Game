package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.dictionary.WordNormalizer;
import com.kungfu.wordquest.economy.GameEconomy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Puzzle-specific letter/center/length rules — NOT global dictionary membership.
 * Dictionary membership is checked via DictionaryService (generation) or PuzzleWord (gameplay).
 */
@Component
@RequiredArgsConstructor
public class PuzzleValidator {

    private final WordNormalizer wordNormalizer;

    /** Letter-pool rules only (no live dictionary lookup). */
    public boolean matchesLetterRules(String word, List<Character> letters, char centerLetter) {
        var normalized = wordNormalizer.normalizePlayable(word, GameEconomy.MIN_WORD_LENGTH);
        if (normalized.isEmpty()) {
            return false;
        }
        String n = normalized.get();
        char center = Character.toLowerCase(centerLetter);
        if (n.indexOf(center) < 0) {
            return false;
        }
        Set<Character> allowed = letters.stream()
                .map(Character::toLowerCase)
                .collect(Collectors.toCollection(HashSet::new));
        for (int i = 0; i < n.length(); i++) {
            if (!allowed.contains(n.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    /**
     * @deprecated Prefer {@link #matchesLetterRules} + PuzzleWord/DictionaryService.
     * Kept for tests that still call validateWord; no longer hits a live dictionary.
     */
    @Deprecated
    public boolean validateWord(String word, List<Character> letters, char centerLetter) {
        return matchesLetterRules(word, letters, centerLetter);
    }

    public boolean isPangram(String word, List<Character> letters) {
        var normalized = wordNormalizer.normalize(word);
        if (normalized.isEmpty()) {
            return false;
        }
        String n = normalized.get();
        Set<Character> required = letters.stream()
                .map(Character::toLowerCase)
                .collect(Collectors.toCollection(HashSet::new));
        for (char c : required) {
            if (n.indexOf(c) < 0) {
                return false;
            }
        }
        return true;
    }
}
