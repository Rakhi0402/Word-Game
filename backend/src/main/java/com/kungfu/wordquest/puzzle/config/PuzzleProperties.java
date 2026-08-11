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
        private int minValidWords = 15;
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
