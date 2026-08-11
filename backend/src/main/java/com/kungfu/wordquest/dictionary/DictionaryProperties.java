package com.kungfu.wordquest.dictionary;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "wordquest.dictionary")
public class DictionaryProperties {

    private boolean enabled = true;

    /** Logical source label, e.g. ESDB / SCOWL / SEED. */
    private String source = "ESDB";

    private String sourceVersion = "1.0.0";

    /**
     * Lexicon file (ESDB/SCOWL word-per-line, or project seed list).
     * classpath:dictionaries/wordlist.txt | file:/var/wordquest/scowl.txt
     */
    private String path = "classpath:dictionaries/wordlist.txt";

    /**
     * Optional frequency TSV: normalized_word&lt;tab&gt;score (higher = more common).
     * When absent, a length-based fallback score is used — words are NOT rejected.
     */
    private String frequencyPath = "";

    private String frequencySource = "wordfreq";

    private boolean frequencyEnabled = true;

    private int minWordLength = 4;

    private int maxWordLength = 32;

    /** If true and DB empty, import {@link #path} once at startup (dev convenience). */
    private boolean seedIfEmpty = true;

    /** Explicit CLI: --import-dictionary */
    private boolean importOnCommand = true;

    private Filter filter = new Filter();
    private DifficultyThresholds difficulty = new DifficultyThresholds();

    @Getter
    @Setter
    public static class Filter {
        private boolean rejectHyphenated = true;
        private boolean rejectApostrophe = true;
        private boolean rejectProperNouns = true;
        private boolean rejectNumeric = true;
        private boolean rejectNonAsciiLetters = true;
    }

    /**
     * Frequency score thresholds (higher score = more common).
     * Fallback scores for length L: roughly max(0, 1.0 - (L-4)*0.08).
     */
    @Getter
    @Setter
    public static class DifficultyThresholds {
        private double easyFrequencyThreshold = 0.55;
        private double mediumFrequencyThreshold = 0.30;
    }
}
