package com.kungfu.wordquest.dashboard;

import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.dashboard.dto.DashboardResponse;
import com.kungfu.wordquest.dashboard.service.DashboardService;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.puzzle.repository.DailyPuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.puzzle.time.GameClock;
import com.kungfu.wordquest.reward.repository.UserAchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock UserRepository userRepository;
    @Mock CardRepository cardRepository;
    @Mock UserCardRepository userCardRepository;
    @Mock UserAchievementRepository userAchievementRepository;
    @Mock DailyPuzzleRepository dailyPuzzleRepository;
    @Mock PuzzleRepository puzzleRepository;
    @Mock UserPuzzleSessionRepository userPuzzleSessionRepository;
    @Mock GameClock gameClock;
    @Spy ProgressionService progressionService = new ProgressionService();

    @InjectMocks DashboardService dashboardService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        when(gameClock.today()).thenReturn(LocalDate.of(2026, 8, 10));
        when(dailyPuzzleRepository.findByScheduledDateWithPuzzle(org.mockito.ArgumentMatchers.any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void newUserGetsDefaultDashboard() {
        UserStats stats = UserStats.builder()
                .wordsFound(0)
                .cardsCollected(1)
                .achievementsEarned(0)
                .highestScore(0)
                .build();
        User user = User.builder()
                .id(userId)
                .username("Rakhi")
                .email("rakhi@example.com")
                .xp(0)
                .coins(50)
                .dailyStreak(0)
                .streakShields(0)
                .freeChestTokens(0)
                .equippedCardId("po_common")
                .stats(stats)
                .build();

        when(userRepository.findWithStatsById(userId)).thenReturn(Optional.of(user));
        when(userAchievementRepository.findByUserId(userId)).thenReturn(List.of());
        when(cardRepository.findById("po_common")).thenReturn(Optional.empty());
        when(puzzleRepository.findByPuzzleDate(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        DashboardResponse dash = dashboardService.getDashboard(userId);

        assertEquals("Rakhi", dash.getProfile().getUserName());
        assertEquals("White", dash.getTraining().getBelt());
        assertEquals("Novice Disciple", dash.getTraining().getRank());
        assertEquals(0, dash.getTraining().getXp());
        assertEquals(50, dash.getWallet().getCoins());
        assertEquals(0, dash.getStatistics().getWordsFound());
        assertEquals(1, dash.getStatistics().getCardsCollected());
        assertFalse(dash.getDailyQuest().isAvailable());
        assertEquals(5, dash.getDailyQuest().getChoicePuzzlesRemaining());
    }

    @Test
    void xpProgressionIsCorrectOnDashboard() {
        UserStats stats = UserStats.builder().build();
        User user = User.builder()
                .id(userId)
                .username("Rakhi")
                .email("rakhi@example.com")
                .xp(750)
                .coins(320)
                .dailyStreak(5)
                .streakShields(2)
                .stats(stats)
                .equippedCardId(null)
                .build();

        when(userRepository.findWithStatsById(userId)).thenReturn(Optional.of(user));
        when(userAchievementRepository.findByUserId(userId)).thenReturn(List.of());
        when(puzzleRepository.findByPuzzleDate(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());

        DashboardResponse dash = dashboardService.getDashboard(userId);

        assertEquals("Yellow", dash.getTraining().getBelt());
        assertEquals("Temple Initiate", dash.getTraining().getRank());
        assertEquals(2, dash.getTraining().getDojoLevel());
        assertEquals(250, dash.getTraining().getXpProgress());
        assertEquals(50, dash.getTraining().getXpProgressPercentage());
        assertEquals(5, dash.getStreak().getCurrent());
        assertEquals(2, dash.getStreak().getStreakShields());
    }
}
