package com.kungfu.wordquest.profile.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Aggregated Profile view for the authenticated user.
 * Built from User, UserStats, UserCard, Achievement / UserAchievement — not a separate table.
 */
@Getter
@Setter
@Builder
public class ProfileResponse {

    private UserSection user;
    private ProgressionSection progression;
    private StreakSection streak;
    private StatisticsSection statistics;
    private EquippedCardSection equippedCard;
    private List<AchievementSection> achievements;

    @Getter
    @Setter
    @Builder
    public static class UserSection {
        @JsonProperty("id")
        private UUID id;
        @JsonProperty("userName")
        private String userName;
        @JsonProperty("userEmail")
        private String userEmail;
    }

    @Getter
    @Setter
    @Builder
    public static class ProgressionSection {
        private int xp;
        private String belt;
        private String rank;
        private int level;
        private int dojoLevel;
        private int xpForCurrentBelt;
        private int xpForNextBelt;
        private int xpProgress;
        private int xpProgressPercentage;
        private int coins;
    }

    @Getter
    @Setter
    @Builder
    public static class StreakSection {
        /** User.currentStreak */
        private int current;
        /** User.dailyStreak */
        private int daily;
        private int shields;
        private int longest;
        private String lastCompletedDate;
        /**
         * Historical training-day list is not persisted yet.
         * Always empty until a history source exists — never fabricated from streak count.
         */
        @Builder.Default
        private List<String> recentTrainingDays = List.of();
    }

    @Getter
    @Setter
    @Builder
    public static class StatisticsSection {
        private int wordsFound;
        private int cardsCollected;
        private int achievementsEarned;
        private int highestScore;
        private int daysPlayed;
        private int puzzlesCompleted;
        private int pangramsFound;
        private int perfectPuzzles;
        private int hintsUsed;
        private int hintsBought;
    }

    @Getter
    @Setter
    @Builder
    public static class EquippedCardSection {
        private String id;
        private int chargesRemaining;
        private String status;
    }

    @Getter
    @Setter
    @Builder
    public static class AchievementSection {
        private String id;
        private String title;
        private String description;
        private int target;
        private int progress;
        private boolean unlocked;
        private LocalDateTime unlockedAt;
        private int rewardXp;
        private int rewardCoins;
        private String iconName;
    }
}
