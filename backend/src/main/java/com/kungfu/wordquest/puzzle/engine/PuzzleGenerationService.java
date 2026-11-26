package com.kungfu.wordquest.puzzle.engine;

import com.kungfu.wordquest.common.exception.ValidationException;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Generates immutable candidate puzzles from the local PostgreSQL dictionary.
 * Persists {@code PuzzleWord} snapshots — gameplay never re-queries the live lexicon.
 * LLM (Groq) may propose letter sets; this service always expands + gates via the dictionary.
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
    private final DifficultyGate difficultyGate;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public int generateWeeklyPool(String batchId) {
        requireDictionaryReady();
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
        requireDictionaryReady();
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
            Puzzle saved = puzzleRepository.saveAndFlush(candidate);
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
        if (!isDictionaryReady()) {
            log.warn("Word dictionary is empty — puzzle generation skipped until import finishes");
            return null;
        }
        char center = randomLetter();
        List<Character> pool = buildPool(center);
        return materializeFromLetters(pool, center, targetDifficulty, batchId, true).orElse(null);
    }

    /**
     * Expand a letter hive against the open-source dictionary and apply difficulty gates.
     *
     * @param randomBand when true, also apply soft max (random search); AI uses false.
     */
    public Optional<Puzzle> materializeFromLetters(
            List<Character> letters,
            char centerLetter,
            PuzzleDifficulty targetDifficulty,
            String batchId,
            boolean randomBand) {
        List<Character> pool = normalizePool(letters, centerLetter);
        if (pool.size() != 7) {
            return Optional.empty();
        }
        char center = Character.toUpperCase(centerLetter);

        int minLen = GameEconomy.MIN_WORD_LENGTH;
        List<String> validNormalized = dictionaryService.findWordsForLetters(pool, center, minLen);
        int minRequired = Math.max(
                properties.getWeekly().getMinValidWords(),
                difficultyGate.minValidWords(targetDifficulty));
        if (validNormalized.size() < minRequired) {
            return Optional.empty();
        }

        List<String> validDisplay = validNormalized.stream()
                .map(wordNormalizer::toDisplay)
                .sorted()
                .collect(Collectors.toList());

        List<String> pangrams = validDisplay.stream()
                .filter(w -> puzzleValidator.isPangram(w, pool))
                .collect(Collectors.toList());

        boolean ok = randomBand
                ? difficultyGate.passesRandomBand(targetDifficulty, validDisplay.size(), pangrams.size())
                : difficultyGate.passes(targetDifficulty, validDisplay.size(), pangrams.size());
        if (!ok) {
            return Optional.empty();
        }

        List<String> letterStrs = pool.stream().map(String::valueOf).collect(Collectors.toList());
        String fingerprint = fingerprint(letterStrs, String.valueOf(center), targetDifficulty);
        var rewards = rewardsFor(targetDifficulty);
        int target = rewards.targetWords();

        return Optional.of(Puzzle.builder()
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
                .build());
    }

    /** Persist candidate if fingerprint is new; returns empty if duplicate. */
    @Transactional
    public Optional<Puzzle> saveNewCandidate(Puzzle candidate) {
        if (candidate == null || candidate.getFingerprint() == null) {
            return Optional.empty();
        }
        if (puzzleRepository.existsByFingerprint(candidate.getFingerprint())) {
            return Optional.empty();
        }
        // saveAndFlush: JDBC batching otherwise inserts puzzle_words before puzzles (FK 23503)
        Puzzle saved = puzzleRepository.saveAndFlush(candidate);
        snapshotService.replaceSnapshot(saved, saved.getValidWords(), saved.getPangrams());
        return Optional.of(saved);
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

    public boolean isDictionaryReady() {
        return dictionaryService.allowedCount() >= properties.getGeneration().getMinDictionaryWords();
    }

    /**
     * Strict check for admin/API: dictionary must meet configured minimum for quality lists.
     */
    public void requireDictionaryReady() {
        long count = dictionaryService.allowedCount();
        long min = properties.getGeneration().getMinDictionaryWords();
        if (count == 0) {
            throw new ValidationException(
                    "Word dictionary is empty. Import an English open-source lexicon "
                            + "(Admin → Dictionary → Import) before generating puzzles.");
        }
        if (count < min) {
            throw new ValidationException(
                    "Word dictionary has only " + count + " words; need at least " + min
                            + " for quality puzzle generation. Wait for import or import SCOWL/ESDB.");
        }
    }

    private List<Character> normalizePool(List<Character> letters, char centerLetter) {
        LinkedHashSet<Character> set = new LinkedHashSet<>();
        char center = Character.toUpperCase(centerLetter);
        set.add(center);
        if (letters != null) {
            for (Character c : letters) {
                if (c == null) {
                    continue;
                }
                char u = Character.toUpperCase(c);
                if (u >= 'A' && u <= 'Z') {
                    set.add(u);
                }
            }
        }
        return new ArrayList<>(set);
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
