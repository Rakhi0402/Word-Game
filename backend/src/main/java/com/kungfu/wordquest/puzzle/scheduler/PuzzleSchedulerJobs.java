package com.kungfu.wordquest.puzzle.scheduler;

import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
import com.kungfu.wordquest.puzzle.engine.DifficultyGate;
import com.kungfu.wordquest.puzzle.engine.PuzzleGenerationService;
import com.kungfu.wordquest.puzzle.entity.DailyPuzzle;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.repository.DailyPuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import com.kungfu.wordquest.puzzle.time.GameClock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
@Slf4j
public class PuzzleSchedulerJobs {

    private final PuzzleGenerationService generationService;
    private final PuzzleRepository puzzleRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final PuzzleWordSnapshotService puzzleWordSnapshotService;
    private final DifficultyGate difficultyGate;
    private final GameClock gameClock;

    /** Weekly candidate pool refill — counts from configuration. */
    @Scheduled(cron = "${puzzles.schedule.weekly-cron:0 0 3 * * SUN}", zone = "${puzzles.game-timezone:Asia/Kolkata}")
    @Transactional
    public void weeklyGenerateCandidates() {
        String batchId = "weekly-" + gameClock.today() + "-" + UUID.randomUUID().toString().substring(0, 8);
        generationService.generateWeeklyPool(batchId);
    }

    /** Assign tomorrow's daily puzzle from the pool (idempotent). */
    @Scheduled(cron = "${puzzles.schedule.daily-cron:0 1 0 * * *}", zone = "${puzzles.game-timezone:Asia/Kolkata}")
    @Transactional
    public void assignTomorrowsDaily() {
        assignDaily(gameClock.tomorrow());
    }

    /** Ensure today's daily exists (startup / recovery helper). */
    @Transactional
    public DailyPuzzle ensureTodayAssigned() {
        return assignDaily(gameClock.today());
    }

    @Transactional
    public DailyPuzzle assignDaily(LocalDate date) {
        var existing = dailyPuzzleRepository.findByScheduledDateWithPuzzle(date);
        if (existing.isPresent()) {
            log.info("Daily puzzle for {} already assigned — skipping.", date);
            return existing.get();
        }

        // Legacy fallback: puzzle still keyed by puzzleDate
        var legacy = puzzleRepository.findByPuzzleDate(date);
        if (legacy.isPresent()) {
            Puzzle legacyPuzzle = legacy.get();
            if (dailyPuzzleRepository.existsByPuzzle_Id(legacyPuzzle.getId())) {
                log.warn("Legacy puzzle {} already used as daily — generating a fresh pick for {}",
                        legacyPuzzle.getId(), date);
            } else if (isValidForDifficulty(legacyPuzzle)) {
                DailyPuzzle mapped = dailyPuzzleRepository.save(DailyPuzzle.builder()
                        .puzzle(legacyPuzzle)
                        .scheduledDate(date)
                        .build());
                log.info("Mapped legacy puzzle {} to daily {}", legacyPuzzle.getId(), date);
                return mapped;
            }
        }

        Puzzle pick = pickFromPool();
        if (pick == null) {
            // Last resort: generate one candidate (needs dictionary). Soft-fail if not ready.
            if (!generationService.isDictionaryReady()) {
                throw new IllegalStateException(
                        "No seeded puzzles and dictionary not ready yet for " + date);
            }
            String batch = "daily-fallback-" + date;
            pick = generationService.tryGenerate(PuzzleDifficulty.MEDIUM, batch);
            if (pick == null) {
                pick = generationService.tryGenerate(PuzzleDifficulty.EASY, batch);
            }
            if (pick == null) {
                throw new IllegalStateException("No puzzle candidates available for " + date);
            }
            if (puzzleRepository.existsByFingerprint(pick.getFingerprint())) {
                pick = puzzleRepository.findByFingerprint(pick.getFingerprint()).orElse(pick);
                if (dailyPuzzleRepository.existsByPuzzle_Id(pick.getId())) {
                    throw new IllegalStateException(
                            "Only duplicate fingerprints available; generate more unused puzzles for " + date);
                }
            } else {
                pick = puzzleRepository.saveAndFlush(pick);
                puzzleWordSnapshotService.replaceSnapshot(pick, pick.getValidWords(), pick.getPangrams());
            }
            if (!isValidForDifficulty(pick)) {
                throw new IllegalStateException(
                        "Fallback puzzle failed difficulty gate for " + date + ": "
                                + difficultyGate.describe(pick.getDifficulty()));
            }
        }

        pick.setPuzzleDate(date);
        puzzleRepository.save(pick);

        DailyPuzzle daily = dailyPuzzleRepository.save(DailyPuzzle.builder()
                .puzzle(pick)
                .scheduledDate(date)
                .build());
        log.info("Assigned puzzle {} as daily for {}", pick.getId(), date);
        return daily;
    }

    /**
     * Pick any active puzzle that has never been used as a daily and that passes its difficulty gate.
     * Word lists may overlap across puzzles; reuse of a past daily is never allowed.
     */
    private Puzzle pickFromPool() {
        List<Puzzle> unused = puzzleRepository.findActiveNeverUsedAsDaily();
        List<Puzzle> valid = new ArrayList<>();
        for (Puzzle p : unused) {
            if (isValidForDifficulty(p)) {
                valid.add(p);
            } else {
                log.debug("Skipping puzzle {} — {}", p.getId(), difficultyGate.describe(p.getDifficulty()));
            }
        }
        if (valid.isEmpty()) {
            return null;
        }
        return valid.get(ThreadLocalRandom.current().nextInt(valid.size()));
    }

    private boolean isValidForDifficulty(Puzzle p) {
        if (p == null || !p.isActive()) {
            return false;
        }
        int words = p.getValidWords() != null ? p.getValidWords().size() : 0;
        int pangrams = p.getPangrams() != null ? p.getPangrams().size() : 0;
        return difficultyGate.passes(p.getDifficulty(), words, pangrams);
    }
}
