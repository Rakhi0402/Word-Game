package com.kungfu.wordquest.leaderboard;

import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardMeDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardPageResponse;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock UserRepository userRepository;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ZSetOperations<String, String> zSetOperations;
    @Spy ProgressionService progressionService = new ProgressionService();

    @InjectMocks LeaderboardService leaderboardService;

    private UUID idA;
    private UUID idB;
    private UUID idC;

    @BeforeEach
    void setUp() {
        idA = UUID.fromString("00000000-0000-0000-0000-000000000001");
        idB = UUID.fromString("00000000-0000-0000-0000-000000000002");
        idC = UUID.fromString("00000000-0000-0000-0000-000000000003");
        lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOperations);
        // @Value is not injected under pure Mockito — set redis key manually
        org.springframework.test.util.ReflectionTestUtils.setField(
                leaderboardService, "leaderboardKey", "leaderboard:global");
    }

    @Test
    void getLeaderboard_returnsPagedEntriesWithBeltAndRanks() {
        User a = user(idA, "Alpha", 1000);
        User b = user(idB, "Beta", 500);
        when(userRepository.findLeaderboardPage(PageRequest.of(0, 20)))
                .thenReturn(new PageImpl<>(List.of(a, b), PageRequest.of(0, 20), 2));
        when(userRepository.findById(idA)).thenReturn(Optional.of(a));
        when(userRepository.countRankedAbove(1000, idA)).thenReturn(0L);

        LeaderboardPageResponse page = leaderboardService.getLeaderboard(0, 20, idA);

        assertEquals(2, page.getEntries().size());
        assertEquals(1, page.getEntries().get(0).getRank());
        assertEquals("Alpha", page.getEntries().get(0).getUsername());
        assertEquals(1000, page.getEntries().get(0).getXp());
        assertEquals("Orange", page.getEntries().get(0).getBelt());
        assertTrue(page.getEntries().get(0).isCurrentUser());
        assertFalse(page.getEntries().get(1).isCurrentUser());
        assertEquals(2, page.getTotalElements());
        assertNotNull(page.getCurrentUser());
        assertEquals(1, page.getCurrentUser().getRank());
    }

    @Test
    void getLeaderboard_clampsSizeAndEmptyPage() {
        when(userRepository.findLeaderboardPage(PageRequest.of(0, 100)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        LeaderboardPageResponse page = leaderboardService.getLeaderboard(-1, 500, null);

        assertEquals(0, page.getPage());
        assertEquals(100, page.getSize());
        assertTrue(page.getEntries().isEmpty());
        assertEquals(0, page.getTotalElements());
        assertNull(page.getCurrentUser());
    }

    @Test
    void getMyRank_usesCountAbovePlusOne() {
        User me = user(idC, "Chi", 750);
        when(userRepository.findById(idC)).thenReturn(Optional.of(me));
        when(userRepository.countRankedAbove(750, idC)).thenReturn(4L);

        LeaderboardMeDto meDto = leaderboardService.getMyRank(idC);

        assertEquals(5, meDto.getRank());
        assertEquals(750, meDto.getXp());
        assertEquals("Chi", meDto.getUsername());
        assertEquals("Yellow", meDto.getBelt());
    }

    @Test
    void updateScore_writesThroughToRedis() {
        leaderboardService.updateScore("Alpha", 42);
        verify(zSetOperations).add(anyString(), eq("Alpha"), eq(42.0));
    }

    private static User user(UUID id, String name, int xp) {
        return User.builder()
                .id(id)
                .username(name)
                .email(name.toLowerCase() + "@example.com")
                .passwordHash("hash")
                .xp(xp)
                .enabled(true)
                .build();
    }
}
