package com.kungfu.wordquest.leaderboard.service;

import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardEntryDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardMeDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardPageResponse;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * All-time XP leaderboard.
 * <p>
 * PostgreSQL {@code users.xp} is the authoritative ranking metric.
 * Redis ZSET is an optional write-through cache for secondary consumers;
 * reads always come from PostgreSQL so rankings stay consistent after
 * achievements, resets, and Redis outages.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private final UserRepository userRepository;
    private final ProgressionService progressionService;
    private final StringRedisTemplate redisTemplate;

    @Value("${leaderboard.redis.key:leaderboard:global}")
    private String leaderboardKey;

    /** Write-through cache of total XP (does not affect authoritative reads). */
    public void updateScore(String username, int xp) {
        try {
            redisTemplate.opsForZSet().add(leaderboardKey, username, xp);
        } catch (Exception ex) {
            log.warn("Unable to update Redis leaderboard cache for '{}'.", username, ex);
        }
    }

    public void removePlayer(String username) {
        try {
            redisTemplate.opsForZSet().remove(leaderboardKey, username);
        } catch (Exception ex) {
            log.warn("Unable to remove '{}' from Redis leaderboard cache.", username, ex);
        }
    }

    @Transactional(readOnly = true)
    public LeaderboardPageResponse getLeaderboard(int page, int size, UUID currentUserId) {
        int safePage = Math.max(DEFAULT_PAGE, page);
        int safeSize = Math.min(MAX_SIZE, Math.max(1, size));

        PageRequest pageable = PageRequest.of(safePage, safeSize);
        Page<User> result = userRepository.findLeaderboardPage(pageable);

        List<LeaderboardEntryDto> entries = new ArrayList<>(result.getNumberOfElements());
        int rankBase = safePage * safeSize;
        int i = 0;
        for (User user : result.getContent()) {
            int rank = rankBase + (++i);
            entries.add(toEntry(user, rank, currentUserId));
        }

        LeaderboardMeDto me = null;
        if (currentUserId != null) {
            me = getMyRank(currentUserId);
        }

        return LeaderboardPageResponse.builder()
                .entries(entries)
                .page(safePage)
                .size(safeSize)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .currentUser(me)
                .build();
    }

    @Transactional(readOnly = true)
    public LeaderboardMeDto getMyRank(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isEnabled()) {
            return null;
        }
        long above = userRepository.countRankedAbove(user.getXp(), user.getId());
        int rank = (int) above + 1;
        return LeaderboardMeDto.builder()
                .rank(rank)
                .xp(user.getXp())
                .username(user.getUsername())
                .belt(progressionService.beltForXp(user.getXp()))
                .userId(user.getId())
                .build();
    }

    /** @deprecated Prefer {@link #getLeaderboard(int, int, UUID)}; kept for internal callers. */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getTopPlayers(int limit) {
        return getLeaderboard(0, limit, null).getEntries();
    }

    /** @deprecated Prefer {@link #getMyRank(UUID)}. */
    @Transactional(readOnly = true)
    public Integer getPlayerRank(String username) {
        return userRepository.findByUsername(username)
                .filter(User::isEnabled)
                .map(u -> (int) userRepository.countRankedAbove(u.getXp(), u.getId()) + 1)
                .orElse(null);
    }

    private LeaderboardEntryDto toEntry(User user, int rank, UUID currentUserId) {
        return LeaderboardEntryDto.builder()
                .rank(rank)
                .userId(user.getId())
                .username(user.getUsername())
                .xp(user.getXp())
                .belt(progressionService.beltForXp(user.getXp()))
                .currentUser(currentUserId != null && currentUserId.equals(user.getId()))
                .build();
    }
}
