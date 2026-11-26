package com.kungfu.wordquest.puzzle.cache;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kungfu.wordquest.puzzle.dto.PuzzlePlayDto;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Caches a small pool of playable puzzles per difficulty for fast client warm-up.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PuzzlePoolCacheService {

    private static final String KEY_PREFIX = "puzzle-pool:";
    private static final Duration TTL = Duration.ofHours(6);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public Optional<List<PuzzlePlayDto>> get(PuzzleDifficulty difficulty) {
        try {
            String json = redis.opsForValue().get(key(difficulty));
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            List<PuzzlePlayDto> list = objectMapper.readValue(json, new TypeReference<>() {});
            return Optional.ofNullable(list);
        } catch (Exception e) {
            log.warn("Redis puzzle-pool get failed for {}: {}", difficulty, e.getMessage());
            return Optional.empty();
        }
    }

    public void put(PuzzleDifficulty difficulty, List<PuzzlePlayDto> puzzles) {
        if (puzzles == null || puzzles.isEmpty()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(puzzles);
            redis.opsForValue().set(key(difficulty), json, TTL);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize puzzle pool: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Redis puzzle-pool put failed for {}: {}", difficulty, e.getMessage());
        }
    }

    public void evict(PuzzleDifficulty difficulty) {
        try {
            redis.delete(key(difficulty));
        } catch (Exception e) {
            log.warn("Redis puzzle-pool evict failed for {}: {}", difficulty, e.getMessage());
        }
    }

    public List<PuzzlePlayDto> getOrEmpty(PuzzleDifficulty difficulty) {
        return get(difficulty).orElse(Collections.emptyList());
    }

    private static String key(PuzzleDifficulty difficulty) {
        return KEY_PREFIX + difficulty.name();
    }
}
