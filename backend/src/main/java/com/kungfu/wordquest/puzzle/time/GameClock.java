package com.kungfu.wordquest.puzzle.time;

import com.kungfu.wordquest.puzzle.config.PuzzleProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Component
@RequiredArgsConstructor
public class GameClock {

    private final PuzzleProperties properties;

    public ZoneId zone() {
        return ZoneId.of(properties.getGameTimezone());
    }

    public LocalDate today() {
        return LocalDate.now(zone());
    }

    public LocalDate tomorrow() {
        return today().plusDays(1);
    }

    /** Seconds until next game-day boundary (never zero — min 1s). */
    public long secondsUntilNextGameDay() {
        ZonedDateTime now = ZonedDateTime.now(zone());
        ZonedDateTime nextMidnight = now.toLocalDate().plusDays(1).atStartOfDay(zone());
        long seconds = Duration.between(now, nextMidnight).getSeconds();
        return Math.max(1L, seconds);
    }

    public Instant nowInstant() {
        return Instant.now(Clock.system(zone()));
    }
}
