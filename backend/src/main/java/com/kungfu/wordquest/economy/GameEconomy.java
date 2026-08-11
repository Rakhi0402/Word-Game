package com.kungfu.wordquest.economy;

/**
 * Canonical game economy — keep aligned with frontend {@code rewards.ts}.
 */
public final class GameEconomy {

    private GameEconomy() {}

    public static final int STARTING_COINS = 50;
    public static final int MAX_CHOICE_PUZZLES_PER_DAY = 5;
    public static final int MAX_STREAK_SHIELDS = 5;
    public static final int FREE_DAILY_HINTS = 3;
    public static final int HINT_COST_COINS = 50;
    public static final int MAX_PAID_HINTS_PER_PUZZLE = 5;
    public static final int CHEST_DRAW_COST = 100;
    public static final int MIN_WORD_LENGTH = 4;

    /** Per-word drip during play (aligned with frontend WORD_DRIP). */
    public static final int DRIP_LEN4_XP = 3;
    public static final int DRIP_LEN4_COINS = 1;
    public static final int DRIP_LEN5TO6_XP = 5;
    public static final int DRIP_LEN5TO6_COINS = 2;
    public static final int DRIP_LEN7PLUS_XP = 8;
    public static final int DRIP_LEN7PLUS_COINS = 3;
    public static final int DRIP_PANGRAM_EXTRA_XP = 20;
    public static final int DRIP_PANGRAM_EXTRA_COINS = 8;

    public static final int PANGRAM_BONUS_XP = 50;
    public static final int PANGRAM_BONUS_COINS = 10;
    public static final int PERFECT_CLEAR_XP = 100;
    public static final int PERFECT_CLEAR_COINS = 40;
    public static final int DAY_STREAK_XP_PER = 15;
    public static final int DAY_STREAK_COINS_PER = 5;
    public static final int DAY_STREAK_BONUS_CAP = 14;
    public static final int HINT_XP_PENALTY_PERCENT = 20;

    public record DifficultyRewards(int targetWords, int baseXp, int baseCoins) {}

    public static DifficultyRewards difficulty(String name) {
        return switch (name == null ? "" : name) {
            case "Easy" -> new DifficultyRewards(10, 100, 30);
            case "Hard" -> new DifficultyRewards(20, 200, 80);
            case "Expert" -> new DifficultyRewards(25, 250, 100);
            default -> new DifficultyRewards(15, 150, 60); // Medium
        };
    }

    public record StarTier(int stars, double xpBonus, double coinBonus, double scoreBonus,
                           int freeHintExtra, int charges, int streakShieldsOnEquip) {}

    public static StarTier starTier(int stars) {
        return switch (stars) {
            case 2 -> new StarTier(2, 0.10, 0.05, 0.05, 0, 5, 2);
            case 3 -> new StarTier(3, 0.15, 0.10, 0.07, 0, 4, 2);
            case 4 -> new StarTier(4, 0.20, 0.15, 0.08, 1, 3, 2);
            case 5 -> new StarTier(5, 0.30, 0.20, 0.10, 3, 3, 3);
            default -> new StarTier(1, 0.10, 0.05, 0.05, 0, 5, 2);
        };
    }

    public record BeltLevel(String belt, int minXp, String title, int rankUpCoins, int dojoLevel) {}

    public static final BeltLevel[] BELTS = {
            new BeltLevel("White", 0, "Novice Disciple", 0, 1),
            new BeltLevel("Yellow", 500, "Temple Initiate", 80, 2),
            new BeltLevel("Orange", 1000, "Bamboo Striker", 120, 3),
            new BeltLevel("Green", 2500, "Jade Defender", 200, 4),
            new BeltLevel("Blue", 5000, "Flowing Crane", 300, 5),
            new BeltLevel("Brown", 7000, "Earth Tiger", 500, 6),
            new BeltLevel("Black", 10000, "Dragon Master", 700, 7),
    };
}
