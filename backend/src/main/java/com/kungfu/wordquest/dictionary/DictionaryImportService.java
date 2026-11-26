package com.kungfu.wordquest.dictionary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * Offline ESDB/SCOWL importer using chunked JDBC upserts (not one giant JPA transaction).
 * Admin UI starts this asynchronously and polls {@link #getProgress()}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DictionaryImportService {

    private static final int CHUNK_SIZE = 1_000;

    private final WordNormalizer normalizer;
    private final DictionaryService dictionaryService;
    private final DictionaryProperties properties;
    private final JdbcTemplate jdbcTemplate;
    private final PlatformTransactionManager transactionManager;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicReference<String> status = new AtomicReference<>("IDLE");
    private final AtomicReference<String> message = new AtomicReference<>("");
    private final AtomicLong processed = new AtomicLong();
    private final AtomicLong accepted = new AtomicLong();
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong duplicates = new AtomicLong();
    private final AtomicLong updated = new AtomicLong();
    private final AtomicReference<String> lastSource = new AtomicReference<>("");
    private final AtomicReference<String> lastVersion = new AtomicReference<>("");

    public DictionaryImportProgress getProgress() {
        return DictionaryImportProgress.builder()
                .status(status.get())
                .message(message.get())
                .processed(processed.get())
                .accepted(accepted.get())
                .rejected(rejected.get())
                .duplicates(duplicates.get())
                .updated(updated.get())
                .allowedCount(dictionaryService.allowedCount())
                .source(lastSource.get())
                .sourceVersion(lastVersion.get())
                .build();
    }

    public boolean isRunning() {
        return running.get();
    }

    /** Synchronous import (startup / CLI). Chunked — does not hang one HTTP request. */
    public DictionaryImportResult importFromConfiguredSource() {
        return importFromPath(properties.getPath(), properties.getSource(), properties.getSourceVersion());
    }

    public DictionaryImportResult importFromPath(String path, String source, String sourceVersion) {
        resetCounters(source, sourceVersion);
        status.set("RUNNING");
        message.set("Importing dictionary…");
        running.set(true);
        try {
            DictionaryImportResult result = doImport(path, source, sourceVersion, null);
            status.set("COMPLETED");
            message.set("Import finished");
            return result;
        } catch (Exception e) {
            status.set("FAILED");
            message.set(e.getMessage() != null ? e.getMessage() : "Import failed");
            throw e instanceof RuntimeException re ? re : new IllegalStateException(e);
        } finally {
            running.set(false);
        }
    }

    /**
     * Background import used by admin. Safe to call repeatedly — second call is rejected while running.
     */
    public boolean startAsyncImport() {
        if (!running.compareAndSet(false, true)) {
            return false;
        }
        resetCounters(properties.getSource(), properties.getSourceVersion());
        status.set("RUNNING");
        message.set("Import started");
        Thread t = new Thread(() -> {
            try {
                doImport(properties.getPath(), properties.getSource(), properties.getSourceVersion(),
                        p -> { /* counters already updated */ });
                status.set("COMPLETED");
                message.set("Import finished");
            } catch (Exception e) {
                log.error("Async dictionary import failed: {}", e.getMessage(), e);
                status.set("FAILED");
                message.set(e.getMessage() != null ? e.getMessage() : "Import failed");
            } finally {
                running.set(false);
            }
        }, "dictionary-import");
        t.setDaemon(true);
        t.start();
        return true;
    }

    private void resetCounters(String source, String version) {
        processed.set(0);
        accepted.set(0);
        rejected.set(0);
        duplicates.set(0);
        updated.set(0);
        lastSource.set(source != null ? source : "");
        lastVersion.set(version != null ? version : "");
    }

    private DictionaryImportResult doImport(
            String path,
            String source,
            String sourceVersion,
            Consumer<DictionaryImportProgress> onChunk) {
        Map<String, Double> frequencies = loadFrequencies();
        Set<String> seenInFile = new HashSet<>();

        Resource resource = new DefaultResourceLoader().getResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("Dictionary resource not found: " + path);
        }

        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        List<Object[]> batch = new ArrayList<>(CHUNK_SIZE);
        Timestamp now = Timestamp.from(Instant.now());

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8), 64 * 1024)) {
            String line;
            while ((line = reader.readLine()) != null) {
                processed.incrementAndGet();
                var normalizedOpt = normalizer.normalize(line);
                if (normalizedOpt.isEmpty()) {
                    rejected.incrementAndGet();
                    continue;
                }
                String normalized = normalizedOpt.get();
                if (normalized.length() < properties.getMinWordLength()
                        || normalized.length() > properties.getMaxWordLength()) {
                    rejected.incrementAndGet();
                    continue;
                }
                if (properties.getFilter().isRejectProperNouns() && looksLikeProperNoun(line)) {
                    rejected.incrementAndGet();
                    continue;
                }
                if (!seenInFile.add(normalized)) {
                    duplicates.incrementAndGet();
                    continue;
                }

                Double freq = frequencies.get(normalized);
                if (freq == null) {
                    freq = fallbackFrequency(normalized.length());
                }
                VocabularyDifficulty difficulty = dictionaryService.classifyDifficulty(freq, normalized.length());

                batch.add(new Object[]{
                        UUID.randomUUID(),
                        normalized,
                        normalized,
                        normalized.length(),
                        freq,
                        difficulty.name(),
                        source,
                        sourceVersion,
                        true,
                        now,
                        now
                });

                if (batch.size() >= CHUNK_SIZE) {
                    flushChunk(tx, batch);
                    batch.clear();
                    message.set("Imported " + accepted.get() + " words…");
                    if (onChunk != null) {
                        onChunk.accept(getProgress());
                    }
                    if (processed.get() % 10_000 == 0) {
                        log.info("Dictionary import progress: processed={} accepted={}",
                                processed.get(), accepted.get());
                    }
                }
            }
            if (!batch.isEmpty()) {
                flushChunk(tx, batch);
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Dictionary import failed from " + path + ": " + e.getMessage(), e);
        }

        DictionaryImportResult result = DictionaryImportResult.builder()
                .source(source)
                .sourceVersion(sourceVersion)
                .processed(processed.get())
                .accepted(accepted.get())
                .rejected(rejected.get())
                .duplicates(duplicates.get())
                .updated(updated.get())
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

    private void flushChunk(TransactionTemplate tx, List<Object[]> batch) {
        List<Object[]> copy = new ArrayList<>(batch);
        tx.executeWithoutResult(status -> {
            int[] counts = jdbcTemplate.batchUpdate("""
                    INSERT INTO word_dictionary (
                        id, word, normalized_word, word_length, frequency_score, frequency_rank,
                        difficulty, source, source_version, allowed, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (normalized_word) DO UPDATE SET
                        word = EXCLUDED.word,
                        word_length = EXCLUDED.word_length,
                        frequency_score = EXCLUDED.frequency_score,
                        difficulty = EXCLUDED.difficulty,
                        source = EXCLUDED.source,
                        source_version = EXCLUDED.source_version,
                        allowed = TRUE,
                        updated_at = EXCLUDED.updated_at
                    """,
                    copy);
            // batchUpdate returns 1 for insert, 1 or 2 for update depending on driver — count as accepted
            for (int c : counts) {
                if (c > 0) {
                    accepted.incrementAndGet();
                    if (c > 1) {
                        updated.incrementAndGet();
                    }
                }
            }
        });
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

    static double fallbackFrequency(int length) {
        return Math.max(0.05, 1.0 - Math.max(0, length - 4) * 0.08);
    }

    private boolean looksLikeProperNoun(String rawLine) {
        String t = rawLine.trim();
        if (t.isEmpty()) {
            return false;
        }
        char c = t.charAt(0);
        if (c >= 'A' && c <= 'Z') {
            String upper = t.toUpperCase(Locale.ROOT);
            if (t.equals(upper) && t.length() <= 3) {
                return true;
            }
            if (!t.equals(t.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }
}
