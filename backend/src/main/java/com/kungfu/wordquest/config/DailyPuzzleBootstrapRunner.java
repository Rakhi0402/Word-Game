package com.kungfu.wordquest.config;

import com.kungfu.wordquest.puzzle.scheduler.PuzzleSchedulerJobs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures today's daily puzzle exists after sample puzzle seeding (Order 20)
 * and before the slow dictionary import, so Home / Quest work immediately.
 */
@Component
@Order(30)
@RequiredArgsConstructor
@Slf4j
public class DailyPuzzleBootstrapRunner implements ApplicationRunner {

    private final PuzzleSchedulerJobs puzzleSchedulerJobs;

    @Override
    public void run(ApplicationArguments args) {
        try {
            puzzleSchedulerJobs.ensureTodayAssigned();
            log.info("Today's daily puzzle is assigned.");
        } catch (Exception ex) {
            log.warn("Could not assign today's daily puzzle on startup: {}", ex.getMessage());
        }
    }
}
