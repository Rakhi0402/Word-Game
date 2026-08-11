package com.kungfu.wordquest.puzzle.scheduler;

import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
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
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PuzzleSchedulerJobs {

    private final PuzzleGenerationService generationService;
    private final PuzzleRepository puzzleRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final PuzzleWordSnapshotService puzzleWordSnapshotService;
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
            DailyPuzzle mapped = dailyPuzzleRepository.save(DailyPuzzle.builder()
                    .puzzle(legacy.get())
                    .scheduledDate(date)
                    .build());
            log.info("Mapped legacy puzzle {} to daily {}", legacy.get().getId(), date);
            return mapped;
        }

        Puzzle pick = pickFromPool();
        if (pick == null) {
            // Last resort: generate one medium candidate and persist
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
            } else {
                pick = puzzleRepository.save(pick);
                puzzleWordSnapshotService.replaceSnapshot(pick, pick.getValidWords(), pick.getPangrams());
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

    private Puzzle pickFromPool() {
        for (PuzzleDifficulty d : List.of(
                PuzzleDifficulty.MEDIUM, PuzzleDifficulty.EASY, PuzzleDifficulty.HARD, PuzzleDifficulty.EXPERT)) {
            List<Puzzle> pool = puzzleRepository.findUnscheduledPoolByDifficulty(d);
            if (!pool.isEmpty()) {
                return pool.get(0);
            }
        }
        // Any active puzzle not yet scheduled
        return puzzleRepository.findRecentlyGeneratedPuzzles().stream()
                .filter(p -> dailyPuzzleRepository.findAll().stream()
                        .noneMatch(d -> d.getPuzzle().getId().equals(p.getId())))
                .findFirst()
                .orElse(null);
    }
}
