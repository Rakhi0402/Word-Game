package com.kungfu.wordquest.dictionary;

import com.kungfu.wordquest.economy.GameEconomy;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;

/**
 * Single canonical normalizer for dictionary import, generation, and gameplay.
 * Output is lowercase a–z only (deterministic).
 */
@Component
public class WordNormalizer {

    /**
     * @return normalized word, or empty if the input cannot form a playable token
     *         (still may fail length / dictionary rules elsewhere).
     */
    public Optional<String> normalize(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return Optional.empty();
        }
        int hash = trimmed.indexOf('#');
        if (hash >= 0) {
            trimmed = trimmed.substring(0, hash).trim();
            if (trimmed.isEmpty()) {
                return Optional.empty();
            }
        }
        // Reject spaces / hyphens / punctuation before stripping so they are not silently dropped
        if (trimmed.indexOf(' ') >= 0 || trimmed.indexOf('-') >= 0 || trimmed.indexOf('\'') >= 0) {
            return Optional.empty();
        }
        String decomposed = Normalizer.normalize(trimmed, Normalizer.Form.NFKD);
        StringBuilder sb = new StringBuilder(decomposed.length());
        for (int i = 0; i < decomposed.length(); i++) {
            char c = decomposed.charAt(i);
            if (Character.getType(c) == Character.NON_SPACING_MARK) {
                continue;
            }
            if (c >= 'A' && c <= 'Z') {
                sb.append((char) (c + 32));
            } else if (c >= 'a' && c <= 'z') {
                sb.append(c);
            } else if (Character.isLetter(c)) {
                // Non Latin letters — reject for English Word Quest lexicon
                return Optional.empty();
            } else if (Character.isDigit(c) || !Character.isWhitespace(c)) {
                return Optional.empty();
            } else {
                return Optional.empty();
            }
        }
        String word = sb.toString().toLowerCase(Locale.ROOT);
        if (word.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(word);
    }

    /** Normalize and require minimum gameplay length. */
    public Optional<String> normalizePlayable(String raw, int minLength) {
        return normalize(raw).filter(w -> w.length() >= minLength);
    }

    public Optional<String> normalizePlayable(String raw) {
        return normalizePlayable(raw, GameEconomy.MIN_WORD_LENGTH);
    }

    /** Display form used in sessions / UI (uppercase). */
    public String toDisplay(String normalized) {
        if (normalized == null) {
            return "";
        }
        return normalized.toUpperCase(Locale.ROOT);
    }
}
