package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.dictionary.DictionaryService;
import com.kungfu.wordquest.dictionary.WordNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.stream.Stream;

/**
 * Legacy facade — generation and membership now use {@link DictionaryService} (PostgreSQL).
 * Kept so older tests/callers compile; does not load SCOWL into memory at startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DictionaryEngine {

    private final DictionaryService dictionaryService;
    private final WordNormalizer wordNormalizer;

    public boolean isValidWord(String word) {
        return dictionaryService.containsWord(word);
    }

    public int getDictionarySize() {
        return (int) Math.min(Integer.MAX_VALUE, dictionaryService.allowedCount());
    }

    public void addWord(String word) {
        log.debug("addWord ignored on DictionaryEngine facade — use DictionaryImportService: {}", word);
    }

    public Stream<String> streamWords() {
        // Generation should call DictionaryService.findWordsForLetters; empty stream if misused.
        log.warn("DictionaryEngine.streamWords() is deprecated; use DictionaryService");
        return Stream.empty();
    }

    /** @deprecated use {@link WordNormalizer} */
    @Deprecated
    public static java.util.Optional<String> normalize(String raw) {
        return new WordNormalizer().normalize(raw);
    }
}
