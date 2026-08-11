package com.kungfu.wordquest.puzzle.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

/** Cached immutable daily puzzle definition (no user state). */
@Value
@Builder
public class DailyPuzzleCacheDto {
    UUID puzzleId;
    String difficulty;
    List<String> letters;
    String centerLetter;
    int minimumWordLength;
    int targetWordCount;
    String scheduledDate;
    int xpReward;
    int coinReward;
}
