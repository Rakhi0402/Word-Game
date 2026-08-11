package com.kungfu.wordquest.dictionary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Offline ESDB/SCOWL (word-per-line) importer. Idempotent upsert on normalized_word.
 * Does not run on every application start unless seed-if-empty / CLI flag.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DictionaryImportService {

    private final WordDictionaryRepository repository;
    private final WordNormalizer normalizer;
    private final DictionaryService dictionaryService;
    private final DictionaryProperties properties;

    @Transactional
    public DictionaryImportResult importFromConfiguredSource() {
        return importFromPath(properties.getPath(), properties.getSource(), properties.getSourceVersion());
    }

    @Transactional
    public DictionaryImportResult importFromPath(String path, String source, String sourceVersion) {
        Map<String, Double> frequencies = loadFrequencies();
        long processed = 0;
        long accepted = 0;
        long rejected = 0;
        long duplicates = 0;
        long updated = 0;
        Set<String> seenInFile = new HashSet<>();

        Resource resource = new DefaultResourceLoader().getResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("Dictionary resource not found: " + path);
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                processed++;
                var normalizedOpt = normalizer.normalize(line);
                if (normalizedOpt.isEmpty()) {
                    rejected++;
                    continue;
                }
                String normalized = normalizedOpt.get();
                if (normalized.length() < properties.getMinWordLength()
                        || normalized.length() > properties.getMaxWordLength()) {
                    rejected++;
                    continue;
                }
                if (properties.getFilter().isRejectProperNouns() && looksLikeProperNoun(line)) {
                    rejected++;
                    continue;
                }
                if (!seenInFile.add(normalized)) {
                    duplicates++;
                    continue;
                }

                Double freq = frequencies.get(normalized);
                boolean freqFromFile = freq != null;
                if (freq == null) {
                    freq = fallbackFrequency(normalized.length());
                }
                VocabularyDifficulty difficulty = dictionaryService.classifyDifficulty(freq, normalized.length());

                var existing = repository.findByNormalizedWord(normalized);
                if (existing.isPresent()) {
                    WordDictionaryEntry e = existing.get();
                    e.setWord(normalized);
                    e.setWordLength(normalized.length());
                    e.setFrequencyScore(freq);
                    e.setDifficulty(difficulty);
                    e.setSource(source);
                    e.setSourceVersion(sourceVersion);
                    e.setAllowed(true);
                    if (freqFromFile) {
                        e.setFrequencyRank(null);
                    }
                    repository.save(e);
                    updated++;
                    accepted++;
                } else {
                    repository.save(WordDictionaryEntry.builder()
                            .word(normalized)
                            .normalizedWord(normalized)
                            .wordLength(normalized.length())
                            .frequencyScore(freq)
                            .frequencyRank(null)
                            .difficulty(difficulty)
                            .source(source)
                            .sourceVersion(sourceVersion)
                            .allowed(true)
                            .build());
                    accepted++;
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Dictionary import failed from " + path + ": " + e.getMessage(), e);
        }

        // Assign dense ranks by descending frequency among accepted allowed words (best-effort).
        assignFrequencyRanks();

        DictionaryImportResult result = DictionaryImportResult.builder()
                .source(source)
                .sourceVersion(sourceVersion)
                .processed(processed)
                .accepted(accepted)
                .rejected(rejected)
                .duplicates(duplicates)
                .updated(updated)
                .build();

        log.info(
                "Dictionary import completed source={} version={} processed={} accepted={} rejected={} duplicates={} updated={}",
                result.getSource(),
                result.getSourceVersion(),
                result.getProcessed(),
                result.getAccepted(),
                result.getRejected(),
                result.getDuplicates(),
                result.getUpdated());
        return result;
    }

    private void assignFrequencyRanks() {
        var all = repository.findAll().stream()
                .filter(WordDictionaryEntry::isAllowed)
                .sorted((a, b) -> {
                    double fa = a.getFrequencyScore() != null ? a.getFrequencyScore() : 0;
                    double fb = b.getFrequencyScore() != null ? b.getFrequencyScore() : 0;
                    int cmp = Double.compare(fb, fa);
                    if (cmp != 0) return cmp;
                    return a.getNormalizedWord().compareTo(b.getNormalizedWord());
                })
                .toList();
        int rank = 1;
        for (WordDictionaryEntry e : all) {
            e.setFrequencyRank(rank++);
            repository.save(e);
        }
    }

    private Map<String, Double> loadFrequencies() {
        Map<String, Double> map = new HashMap<>();
        if (!properties.isFrequencyEnabled()) {
            return map;
        }
        String freqPath = properties.getFrequencyPath();
        if (freqPath == null || freqPath.isBlank()) {
            return map;
        }
        Resource resource = new DefaultResourceLoader().getResource(freqPath);
        if (!resource.exists()) {
            log.warn("Frequency file not found at {} — using fallback scores", freqPath);
            return map;
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                String[] parts = trimmed.split("[\\t, ]+");
                if (parts.length < 2) {
                    continue;
                }
                normalizer.normalize(parts[0]).ifPresent(w -> {
                    try {
                        map.put(w, Double.parseDouble(parts[1]));
                    } catch (NumberFormatException ignored) {
                        // skip bad rows
                    }
                });
            }
            log.info("Loaded {} frequency rows from {}", map.size(), freqPath);
        } catch (Exception e) {
            log.warn("Failed reading frequency file {}: {}", freqPath, e.getMessage());
        }
        return map;
    }

    /** Length-based fallback — never rejects a valid lexicon word. */
    static double fallbackFrequency(int length) {
        return Math.max(0.05, 1.0 - Math.max(0, length - 4) * 0.08);
    }

    /**
     * Heuristic: source line starts with uppercase Latin letter and is not all-caps acronym of length&lt;=3.
     * SCOWL 60+ often already lowercases; seed lists are lowercase.
     */
    private boolean looksLikeProperNoun(String rawLine) {
        String t = rawLine.trim();
        if (t.isEmpty()) {
            return false;
        }
        char c = t.charAt(0);
        if (c >= 'A' && c <= 'Z') {
            String upper = t.toUpperCase(Locale.ROOT);
            if (t.equals(upper) && t.length() <= 3) {
                return true; // abbreviation
            }
            // Title Case proper noun in some word lists
            if (!t.equals(t.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }
}
