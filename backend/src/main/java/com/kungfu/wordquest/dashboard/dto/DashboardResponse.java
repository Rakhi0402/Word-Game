package com.kungfu.wordquest.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class DashboardResponse {

    private ProfileSection profile;
    private TrainingSection training;
    private WalletSection wallet;
    private StreakSection streak;
    private ActiveCardSection activeCard;
    private DailyQuestSection dailyQuest;
    private StatisticsSection statistics;
    private int achievementsUnlocked;

    @Getter
    @Setter
    @Builder
    public static class ProfileSection {
        @JsonProperty("userId")
        private UUID userId;
        @JsonProperty("userName")
        private String userName;
        @JsonProperty("userEmail")
        private String userEmail;
    }

    @Getter
    @Setter
    @Builder
    public static class TrainingSection {
        private String belt;
        private String rank;
        private int dojoLevel;
        private int xp;
        private int xpForCurrentBelt;
        private int xpForNextBelt;
        private int xpProgress;
        private int xpProgressPercentage;
        private int xpNeeded;
    }

    @Getter
    @Setter
    @Builder
    public static class WalletSection {
        private int coins;
        private int freeChestTokens;
    }

    @Getter
    @Setter
    @Builder
    public static class StreakSection {
        private int current;
        private int longest;
        private int streakShields;
        private String lastCompletedDate;
    }

    @Getter
    @Setter
    @Builder
    public static class ActiveCardSection {
        private String cardId;
        private String name;
        private String rarity;
        private int stars;
        private List<String> bonuses;
        private int chargesRemaining;
        private String status;
        private String image;
    }

    @Getter
    @Setter
    @Builder
    public static class DailyQuestSection {
        private boolean available;
        private String puzzleId;
        private String difficulty;
        private boolean completed;
        private int choicePuzzlesRemaining;
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
}
