package com.kungfu.wordquest.puzzle.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/** Cached immutable daily puzzle definition (no user state). */
@Value
@Builder
public class DailyPuzzleCacheDto {
    Long puzzleId;
    String difficulty;
    List<String> letters;
    String centerLetter;
    int minimumWordLength;
    int targetWordCount;
    String scheduledDate;
    int xpReward;
    int coinReward;
    List<String> validWords;
    List<String> pangrams;
    int pangramCount;
}
