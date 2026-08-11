package com.kungfu.wordquest.dictionary;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Read API over the local PostgreSQL Word Quest dictionary.
 * Not used for gameplay word accept/reject (that is {@link PuzzleWord}).
 */
@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final WordDictionaryRepository repository;
    private final WordNormalizer normalizer;
    private final DictionaryProperties properties;

    @Transactional(readOnly = true)
    public boolean containsWord(String raw) {
        return normalizer.normalizePlayable(raw, properties.getMinWordLength())
                .map(repository::existsByNormalizedWord)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Optional<DictionaryWordView> findWord(String raw) {
        return normalizer.normalize(raw)
                .flatMap(repository::findByNormalizedWord)
                .filter(WordDictionaryEntry::isAllowed)
                .map(this::toView);
    }

    @Transactional(readOnly = true)
    public Optional<FrequencyData> getFrequency(String raw) {
        return findWord(raw).map(v -> FrequencyData.builder()
                .score(v.getFrequencyScore() != null ? v.getFrequencyScore() : 0.0)
                .rank(v.getFrequencyRank())
                .source(properties.getFrequencySource())
                .build());
    }

    /**
     * Words playable for a Spelling-Bee-style letter pool (generation only).
     */
    @Transactional(readOnly = true)
    public List<String> findWordsForLetters(List<Character> letters, char centerLetter, int minLength) {
        Set<Character> pool = letters.stream()
                .map(c -> Character.toLowerCase(c))
                .collect(Collectors.toCollection(HashSet::new));
        char center = Character.toLowerCase(centerLetter);
        int maxLen = properties.getMaxWordLength();

        List<String> candidates = repository.findAllowedNormalizedWords(minLength);
        List<String> out = new ArrayList<>();
        for (String word : candidates) {
            if (word.length() > maxLen) {
                continue;
            }
            if (word.indexOf(center) < 0) {
                continue;
            }
            boolean ok = true;
            for (int i = 0; i < word.length(); i++) {
                if (!pool.contains(word.charAt(i))) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                out.add(word);
            }
        }
        out.sort(String::compareTo);
        return out;
    }

    @Transactional(readOnly = true)
    public long allowedCount() {
        return repository.countByAllowedTrue();
    }

    @Transactional(readOnly = true)
    public boolean hasActiveVersion(String sourceVersion) {
        return repository.countByAllowedTrueAndSourceVersion(sourceVersion) > 0;
    }

    public VocabularyDifficulty classifyDifficulty(double frequencyScore, int wordLength) {
        var th = properties.getDifficulty();
        if (frequencyScore >= th.getEasyFrequencyThreshold() && wordLength <= 6) {
            return VocabularyDifficulty.EASY;
        }
        if (frequencyScore >= th.getMediumFrequencyThreshold()) {
            return VocabularyDifficulty.MEDIUM;
        }
        return VocabularyDifficulty.HARD;
    }

    private DictionaryWordView toView(WordDictionaryEntry e) {
        return DictionaryWordView.builder()
                .normalizedWord(e.getNormalizedWord())
                .wordLength(e.getWordLength())
                .frequencyScore(e.getFrequencyScore())
                .frequencyRank(e.getFrequencyRank())
                .difficulty(e.getDifficulty())
                .source(e.getSource())
                .sourceVersion(e.getSourceVersion())
                .allowed(e.isAllowed())
                .build();
    }
}
