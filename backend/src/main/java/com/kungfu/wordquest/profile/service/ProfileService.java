package com.kungfu.wordquest.profile.service;

import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.profile.dto.ProfileResponse;
import com.kungfu.wordquest.profile.dto.ProfileResponse.*;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.reward.entity.Achievement;
import com.kungfu.wordquest.reward.entity.UserAchievement;
import com.kungfu.wordquest.reward.repository.AchievementRepository;
import com.kungfu.wordquest.reward.repository.UserAchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final UserCardRepository userCardRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserPuzzleSessionRepository userPuzzleSessionRepository;
    private final ProgressionService progressionService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findWithStatsById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        UserStats stats = user.getStats() != null ? user.getStats() : UserStats.builder().build();
        ProgressionService.TrainingProgress training = progressionService.resolve(user.getXp());
        List<AchievementSection> achievements = buildAchievements(userId);
        int unlockedCount = (int) achievements.stream().filter(AchievementSection::isUnlocked).count();

        return ProfileResponse.builder()
                .user(UserSection.builder()
                        .id(user.getId())
                        .userName(user.getUsername())
                        .userEmail(user.getEmail())
                        .build())
                .progression(ProgressionSection.builder()
                        .xp(training.xp())
                        .belt(training.belt())
                        .rank(training.rank())
                        .level(user.getLevel())
                        .dojoLevel(training.dojoLevel())
                        .xpForCurrentBelt(training.xpForCurrentBelt())
                        .xpForNextBelt(training.xpForNextBelt())
                        .xpProgress(training.xpProgress())
                        .xpProgressPercentage(training.xpProgressPercentage())
                        .coins(user.getCoins())
                        .build())
                .streak(StreakSection.builder()
                        .current(user.getCurrentStreak())
                        .daily(user.getDailyStreak())
                        .shields(user.getStreakShields())
                        .longest(Math.max(stats.getHighestStreak(), Math.max(user.getCurrentStreak(), user.getDailyStreak())))
                        .lastCompletedDate(user.getLastPuzzleDate())
                        .recentTrainingDays(recentTrainingDays(userId))
                        .build())
                .statistics(StatisticsSection.builder()
                        .wordsFound(stats.getWordsFound())
                        .cardsCollected(stats.getCardsCollected())
                        .achievementsEarned(Math.max(stats.getAchievementsEarned(), unlockedCount))
                        .highestScore(stats.getHighestScore())
                        .daysPlayed(stats.getDaysPlayed())
                        .puzzlesCompleted(stats.getPuzzlesCompleted())
                        .pangramsFound(stats.getPangramsFound())
                        .perfectPuzzles(stats.getPerfectPuzzles())
                        .hintsUsed(stats.getHintsUsed())
                        .hintsBought(stats.getHintsBought())
                        .build())
                .equippedCard(buildEquippedCard(user))
                .achievements(achievements)
                .build();
    }

    private List<String> recentTrainingDays(UUID userId) {
        LocalDateTime since = LocalDate.now().minusDays(60).atStartOfDay();
        Set<String> days = new LinkedHashSet<>();
        for (LocalDateTime completedAt : userPuzzleSessionRepository.findCompletedAtSince(userId, since)) {
            days.add(completedAt.toLocalDate().toString());
            if (days.size() >= 60) {
                break;
            }
        }
        return days.stream().sorted(Comparator.reverseOrder()).collect(Collectors.toList());
    }

    private EquippedCardSection buildEquippedCard(User user) {
        String equippedId = user.getEquippedCardId();
        if (equippedId == null || equippedId.isBlank()) {
            return null;
        }

        var ownership = userCardRepository.findByUserIdAndCardId(user.getId(), equippedId);
        int charges = ownership.map(UserCard::getChargesRemaining)
                .orElseGet(() -> cardRepository.findById(equippedId)
                        .map(card -> GameEconomy.starTier(card.getStars()).charges())
                        .orElse(0));
        String status = ownership.map(UserCard::getStatus).orElse("available");

        return EquippedCardSection.builder()
                .id(equippedId)
                .chargesRemaining(charges)
                .status(status)
                .build();
    }

    /**
     * Merges static achievement definitions with per-user progress.
     * Definitions without a UserAchievement row appear as locked / progress 0.
     */
    private List<AchievementSection> buildAchievements(UUID userId) {
        List<Achievement> definitions = achievementRepository.findAll();
        Map<String, UserAchievement> byId = new HashMap<>();
        for (UserAchievement ua : userAchievementRepository.findByUserIdWithAchievement(userId)) {
            if (ua.getAchievement() != null) {
                byId.put(ua.getAchievement().getId(), ua);
            }
        }

        List<AchievementSection> result = new ArrayList<>(definitions.size());
        for (Achievement def : definitions) {
            UserAchievement ua = byId.get(def.getId());
            result.add(AchievementSection.builder()
                    .id(def.getId())
                    .title(def.getTitle())
                    .description(def.getDescription())
                    .target(def.getTarget())
                    .progress(ua != null ? ua.getProgress() : 0)
                    .unlocked(ua != null && ua.isUnlocked())
                    .unlockedAt(ua != null ? ua.getUnlockedAt() : null)
                    .rewardXp(def.getRewardXp())
                    .rewardCoins(def.getRewardCoins())
                    .iconName(def.getIconName())
                    .build());
        }

        result.sort(Comparator
                .comparing(AchievementSection::isUnlocked).reversed()
                .thenComparing(AchievementSection::getId, Comparator.nullsLast(String::compareTo)));
        return result;
    }
}
