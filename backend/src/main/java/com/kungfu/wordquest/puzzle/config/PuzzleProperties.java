package com.kungfu.wordquest.puzzle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "puzzles")
public class PuzzleProperties {

    /** Game calendar timezone for daily rollover / cache TTL. */
    private String gameTimezone = "Asia/Kolkata";

    private Dictionary dictionary = new Dictionary();
    private Weekly weekly = new Weekly();
    private Schedule schedule = new Schedule();
    private Generation generation = new Generation();

    @Getter
    @Setter
    public static class Dictionary {
        /**
         * Classpath or file path. Examples:
         * classpath:dictionaries/wordlist.txt
         * file:/var/wordquest/scowl.txt
         */
        private String path = "classpath:dictionaries/wordlist.txt";
    }

    @Getter
    @Setter
    public static class Weekly {
        private int easy = 14;
        private int medium = 14;
        private int hard = 7;
        private int expert = 7;
        private int maxAttemptsPerCandidate = 200;
        /** Legacy floor; prefer {@link Generation} mins. */
        private int minValidWords = 20;
    }

    /**
     * Publish gates for Spelling Bee–style answer lists (min length 4, dictionary-proven).
     */
    @Getter
    @Setter
    public static class Generation {
        private int easyMinWords = 20;
        private int mediumMinWords = 35;
        private int hardMinWords = 50;
        private int expertMinWords = 70;
        private int easyMinPangrams = 1;
        private int mediumMinPangrams = 1;
        private int hardMinPangrams = 1;
        private int expertMinPangrams = 2;
        /** Soft caps for random search (0 = no soft cap). */
        private int easySoftMaxWords = 45;
        private int mediumSoftMaxWords = 70;
        private int hardSoftMaxWords = 100;
        private int expertSoftMaxWords = 0;
        /** Minimum allowed dictionary size before generation is permitted. */
        private long minDictionaryWords = 1000;
    }

    @Getter
    @Setter
    public static class Schedule {
        /** Daily assignment cron (default 00:01 in game timezone). */
        private String dailyCron = "0 1 0 * * *";
        /** Weekly pool generation cron (default Sunday 03:00). */
        private String weeklyCron = "0 0 3 * * SUN";
    }
}
