package com.kungfu.wordquest.puzzle.engine;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class HintGenerator {

    public String generateHintForWord(String word, List<Character> letters, boolean isPangram) {
        if (word == null || word.isEmpty()) {
            return "No hint available";
        }

        String uppercaseWord = word.trim().toUpperCase();
        char firstChar = uppercaseWord.charAt(0);
        int length = uppercaseWord.length();

        if (isPangram) {
            return String.format("A pangram starting with '%c' (%d letters) that uses every letter on the wheel!", firstChar, length);
        }

        // Standard dynamic hints based on length
        if (length <= 4) {
            return String.format("A short 4-letter word starting with '%c'", firstChar);
        } else if (length == 5) {
            return String.format("A 5-letter word starting with '%c'", firstChar);
        } else {
            return String.format("A %d-letter word starting with '%c' and ending in '%c'", length, firstChar, uppercaseWord.charAt(length - 1));
        }
    }
}
