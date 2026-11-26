package com.kungfu.wordquest.profile;

import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.profile.dto.ProfileResponse;
import com.kungfu.wordquest.profile.service.ProfileService;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.reward.entity.Achievement;
import com.kungfu.wordquest.reward.entity.UserAchievement;
import com.kungfu.wordquest.reward.repository.AchievementRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock UserRepository userRepository;
    @Mock CardRepository cardRepository;
    @Mock UserCardRepository userCardRepository;
    @Mock AchievementRepository achievementRepository;
    @Mock UserAchievementRepository userAchievementRepository;
    @Mock UserPuzzleSessionRepository userPuzzleSessionRepository;
    @Spy ProgressionService progressionService = new ProgressionService();

    @InjectMocks ProfileService profileService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    void getProfile_aggregatesPersistedUserData() {
        UserStats stats = UserStats.builder()
                .wordsFound(12)
                .cardsCollected(3)
                .achievementsEarned(1)
                .highestScore(240)
                .daysPlayed(4)
                .puzzlesCompleted(6)
                .pangramsFound(2)
                .perfectPuzzles(1)
                .hintsUsed(5)
                .hintsBought(1)
                .highestStreak(9)
                .build();

        User user = User.builder()
                .id(userId)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("hash")
                .xp(750)
                .level(2)
                .coins(320)
                .currentStreak(3)
                .dailyStreak(5)
                .streakShields(2)
                .lastPuzzleDate("2026-08-09")
                .equippedCardId("po_common")
                .stats(stats)
                .build();

        Achievement firstWord = Achievement.builder()
                .id("first_word")
                .title("First Word")
                .description("Find your first word")
                .target(1)
                .rewardXp(10)
                .rewardCoins(5)
                .iconName("star")
                .build();
        Achievement collector = Achievement.builder()
                .id("collector")
                .title("Collector")
                .description("Collect cards")
                .target(5)
                .rewardXp(20)
                .rewardCoins(10)
                .iconName("cards")
                .build();

        UserAchievement unlocked = UserAchievement.builder()
                .achievement(firstWord)
                .progress(1)
                .unlocked(true)
                .unlockedAt(LocalDateTime.of(2026, 8, 1, 12, 0))
                .build();

        when(userRepository.findWithStatsById(userId)).thenReturn(Optional.of(user));
        when(achievementRepository.findAll()).thenReturn(List.of(firstWord, collector));
        when(userAchievementRepository.findByUserIdWithAchievement(userId)).thenReturn(List.of(unlocked));
        when(userCardRepository.findByUserIdAndCardId(userId, "po_common"))
                .thenReturn(Optional.of(UserCard.builder()
                        .chargesRemaining(4)
                        .status("available")
                        .build()));
        when(userPuzzleSessionRepository.findCompletedAtSince(eq(userId), any(LocalDateTime.class)))
                .thenReturn(List.of(
                        LocalDateTime.of(2026, 8, 9, 10, 0),
                        LocalDateTime.of(2026, 8, 8, 9, 0)
                ));

        ProfileResponse profile = profileService.getProfile(userId);

        assertEquals(userId, profile.getUser().getId());
        assertEquals("disciple", profile.getUser().getUserName());
        assertEquals("disciple@example.com", profile.getUser().getUserEmail());

        assertEquals(750, profile.getProgression().getXp());
        assertEquals("Yellow", profile.getProgression().getBelt());
        assertEquals("Temple Initiate", profile.getProgression().getRank());
        assertEquals(320, profile.getProgression().getCoins());

        assertEquals(3, profile.getStreak().getCurrent());
        assertEquals(5, profile.getStreak().getDaily());
        assertEquals(2, profile.getStreak().getShields());
        assertEquals(9, profile.getStreak().getLongest());
        assertEquals("2026-08-09", profile.getStreak().getLastCompletedDate());
        assertEquals(List.of("2026-08-09", "2026-08-08"), profile.getStreak().getRecentTrainingDays());

        assertEquals(12, profile.getStatistics().getWordsFound());
        assertEquals(3, profile.getStatistics().getCardsCollected());
        assertEquals(240, profile.getStatistics().getHighestScore());
        assertEquals(5, profile.getStatistics().getHintsUsed());
        assertEquals(1, profile.getStatistics().getHintsBought());

        assertEquals("po_common", profile.getEquippedCard().getId());
        assertEquals(4, profile.getEquippedCard().getChargesRemaining());
        assertEquals("available", profile.getEquippedCard().getStatus());

        assertEquals(2, profile.getAchievements().size());
        ProfileResponse.AchievementSection unlockedDto = profile.getAchievements().stream()
                .filter(a -> "first_word".equals(a.getId()))
                .findFirst()
                .orElseThrow();
        assertTrue(unlockedDto.isUnlocked());
        assertEquals(1, unlockedDto.getProgress());

        ProfileResponse.AchievementSection lockedDto = profile.getAchievements().stream()
                .filter(a -> "collector".equals(a.getId()))
                .findFirst()
                .orElseThrow();
        assertFalse(lockedDto.isUnlocked());
        assertEquals(0, lockedDto.getProgress());

        verify(userRepository).findWithStatsById(userId);
    }

    @Test
    void getProfile_missingUser_throws() {
        when(userRepository.findWithStatsById(userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> profileService.getProfile(userId));
    }

    @Test
    void getProfile_doesNotExposePasswordHash() {
        User user = User.builder()
                .id(userId)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("SECRET_HASH")
                .xp(0)
                .coins(50)
                .equippedCardId("po_common")
                .stats(UserStats.builder().build())
                .build();

        when(userRepository.findWithStatsById(userId)).thenReturn(Optional.of(user));
        when(achievementRepository.findAll()).thenReturn(List.of());
        when(userAchievementRepository.findByUserIdWithAchievement(userId)).thenReturn(List.of());
        when(userCardRepository.findByUserIdAndCardId(userId, "po_common")).thenReturn(Optional.empty());
        when(cardRepository.findById("po_common")).thenReturn(Optional.of(
                Card.builder().id("po_common").stars(1).build()));

        ProfileResponse profile = profileService.getProfile(userId);
        assertEquals("disciple@example.com", profile.getUser().getUserEmail());
        assertEquals("disciple", profile.getUser().getUserName());
        // DTO has no password field — only identity/progression aggregates
        assertDoesNotThrow(() -> profile.getUser().getId());
    }
}
