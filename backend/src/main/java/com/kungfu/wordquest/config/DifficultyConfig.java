package com.kungfu.wordquest.config;

public record DifficultyConfig(

        int xpReward,

        int coinReward,

        int targetWords,

        int pangramBonus,

        int wordMultiplier,

        double streakMultiplier,

        int hints,

        double scoreMultiplier

) {
}