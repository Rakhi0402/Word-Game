package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.common.constants.RewardConstants;
import com.kungfu.wordquest.dictionary.DictionaryProperties;
import com.kungfu.wordquest.dictionary.DictionaryService;
import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
import com.kungfu.wordquest.dictionary.WordNormalizer;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.puzzle.config.PuzzleProperties;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Generates immutable candidate puzzles from the local PostgreSQL dictionary.
 * Persists {@code PuzzleWord} snapshots — gameplay never re-queries the live lexicon.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PuzzleGenerationService {

    private final PuzzleRepository puzzleRepository;
    private final DictionaryService dictionaryService;
    private final PuzzleWordSnapshotService snapshotService;
    private final WordNormalizer wordNormalizer;
    private final PuzzleProperties properties;
    private final DictionaryProperties dictionaryProperties;
    private final PuzzleValidator puzzleValidator;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public int generateWeeklyPool(String batchId) {
        ensureDictionaryReady();
        int created = 0;
        created += generateForDifficulty(PuzzleDifficulty.EASY, properties.getWeekly().getEasy(), batchId);
        created += generateForDifficulty(PuzzleDifficulty.MEDIUM, properties.getWeekly().getMedium(), batchId);
        created += generateForDifficulty(PuzzleDifficulty.HARD, properties.getWeekly().getHard(), batchId);
        created += generateForDifficulty(PuzzleDifficulty.EXPERT, properties.getWeekly().getExpert(), batchId);
        log.info("Weekly puzzle generation batch {} created {} candidates", batchId, created);
        return created;
    }

    @Transactional
    public int generateForDifficulty(PuzzleDifficulty difficulty, int count, String batchId) {
        ensureDictionaryReady();
        int created = 0;
        int attempts = 0;
        int maxAttempts = Math.max(count * properties.getWeekly().getMaxAttemptsPerCandidate(), count);
        while (created < count && attempts < maxAttempts) {
            attempts++;
            Puzzle candidate = tryGenerate(difficulty, batchId);
            if (candidate == null) {
                continue;
            }
            if (puzzleRepository.existsByFingerprint(candidate.getFingerprint())) {
                continue;
            }
            Puzzle saved = puzzleRepository.save(candidate);
            snapshotService.replaceSnapshot(saved, saved.getValidWords(), saved.getPangrams());
            created++;
        }
        if (created < count) {
            log.warn("Only generated {}/{} {} puzzles for batch {}", created, count, difficulty, batchId);
        }
        return created;
    }

    /** Generate one candidate without persisting (caller must save + snapshot). */
    public Puzzle tryGenerate(PuzzleDifficulty targetDifficulty, String batchId) {
        ensureDictionaryReady();
        int minWords = Math.max(properties.getWeekly().getMinValidWords(), targetWords(targetDifficulty));
        char center = randomLetter();
        List<Character> pool = buildPool(center);
        List<String> validNormalized = dictionaryService.findWordsForLetters(
                pool, center, GameEconomy.MIN_WORD_LENGTH);
        if (validNormalized.size() < minWords) {
            return null;
        }

        List<String> validDisplay = validNormalized.stream()
                .map(wordNormalizer::toDisplay)
                .sorted()
                .collect(Collectors.toList());

        List<String> pangrams = validDisplay.stream()
                .filter(w -> puzzleValidator.isPangram(w, pool))
                .collect(Collectors.toList());
        if (pangrams.isEmpty()) {
            return null;
        }

        if (!matchesDifficultyBand(validDisplay.size(), pangrams.size(), targetDifficulty)) {
            return null;
        }

        List<String> letterStrs = pool.stream().map(String::valueOf).collect(Collectors.toList());
        String fingerprint = fingerprint(letterStrs, String.valueOf(center), targetDifficulty);
        var rewards = rewardsFor(targetDifficulty);
        int target = rewards.targetWords();

        return Puzzle.builder()
                .puzzleDate(null)
                .letters(letterStrs)
                .centerLetter(String.valueOf(center))
                .validWords(validDisplay)
                .pangrams(pangrams)
                .difficulty(targetDifficulty)
                .minimumWordLength(GameEconomy.MIN_WORD_LENGTH)
                .targetWordCount(target)
                .pangramCount(pangrams.size())
                .xpReward(rewards.baseXp())
                .coinReward(rewards.baseCoins())
                .maxScore(estimateMaxScore(validDisplay))
                .fingerprint(fingerprint)
                .generationBatchId(batchId)
                .dictionarySourceVersion(dictionaryProperties.getSourceVersion())
                .active(true)
                .build();
    }

    public static String fingerprint(List<String> letters, String center, PuzzleDifficulty difficulty) {
        List<String> sorted = letters.stream()
                .map(s -> s.toUpperCase(Locale.ROOT))
                .sorted()
                .collect(Collectors.toList());
        String raw = String.join("", sorted) + "|" + center.toUpperCase(Locale.ROOT) + "|" + difficulty.name();
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig).substring(0, 32);
        } catch (Exception e) {
            return raw;
        }
    }

    private void ensureDictionaryReady() {
        if (dictionaryService.allowedCount() == 0) {
            throw new IllegalStateException(
                    "Local word dictionary is empty. Run with --import-dictionary after configuring wordquest.dictionary.path");
        }
    }

    private boolean matchesDifficultyBand(int wordCount, int pangramCount, PuzzleDifficulty d) {
        return switch (d) {
            case EASY -> wordCount >= 10 && wordCount <= 18;
            case MEDIUM -> wordCount >= 15 && wordCount <= 28;
            case HARD -> wordCount >= 22 && wordCount <= 40;
            case EXPERT -> wordCount >= 25 || pangramCount >= 2;
        };
    }

    private int targetWords(PuzzleDifficulty d) {
        return switch (d) {
            case EASY -> RewardConstants.EASY_TARGET_WORDS;
            case MEDIUM -> RewardConstants.MEDIUM_TARGET_WORDS;
            case HARD -> RewardConstants.HARD_TARGET_WORDS;
            case EXPERT -> RewardConstants.EXPERT_TARGET_WORDS;
        };
    }

    private GameEconomy.DifficultyRewards rewardsFor(PuzzleDifficulty d) {
        return switch (d) {
            case EASY -> GameEconomy.difficulty("Easy");
            case MEDIUM -> GameEconomy.difficulty("Medium");
            case HARD -> GameEconomy.difficulty("Hard");
            case EXPERT -> GameEconomy.difficulty("Expert");
        };
    }

    private char randomLetter() {
        return (char) ('A' + random.nextInt(26));
    }

    private List<Character> buildPool(char center) {
        List<Character> pool = new ArrayList<>();
        pool.add(center);
        while (pool.size() < 7) {
            char c = randomLetter();
            if (!pool.contains(c)) {
                pool.add(c);
            }
        }
        Collections.shuffle(pool, random);
        return pool;
    }

    private int estimateMaxScore(List<String> words) {
        return words.stream().mapToInt(w -> w.length() * 10).sum();
    }
}
