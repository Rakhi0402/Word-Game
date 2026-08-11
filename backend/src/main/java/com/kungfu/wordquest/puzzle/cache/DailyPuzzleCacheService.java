package com.kungfu.wordquest.puzzle.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kungfu.wordquest.puzzle.dto.DailyPuzzleCacheDto;
import com.kungfu.wordquest.puzzle.time.GameClock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyPuzzleCacheService {

    private static final String KEY_PREFIX = "daily-puzzle:";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final GameClock gameClock;

    public Optional<DailyPuzzleCacheDto> get(LocalDate gameDate) {
        try {
            String json = redis.opsForValue().get(key(gameDate));
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(json, DailyPuzzleCacheDto.class));
        } catch (Exception e) {
            log.warn("Redis daily-puzzle get failed for {}: {}", gameDate, e.getMessage());
            return Optional.empty();
        }
    }

    public void put(LocalDate gameDate, DailyPuzzleCacheDto dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            long ttl = gameClock.secondsUntilNextGameDay();
            // If caching a future date, expire at that date's end-of-day instead.
            if (!gameDate.equals(gameClock.today())) {
                ttl = Math.max(ttl, Duration.between(
                        java.time.ZonedDateTime.now(gameClock.zone()),
                        gameDate.plusDays(1).atStartOfDay(gameClock.zone())
                ).getSeconds());
            }
            redis.opsForValue().set(key(gameDate), json, Duration.ofSeconds(Math.max(1L, ttl)));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize daily puzzle cache: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Redis daily-puzzle put failed for {}: {}", gameDate, e.getMessage());
        }
    }

    private static String key(LocalDate gameDate) {
        return KEY_PREFIX + gameDate;
    }
}
