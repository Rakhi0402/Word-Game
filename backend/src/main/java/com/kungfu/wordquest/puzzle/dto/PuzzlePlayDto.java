package com.kungfu.wordquest.puzzle.dto;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Safe puzzle payload for clients — never includes validWords / answer keys.
 */
@Value
@Builder
public class PuzzlePlayDto {
    UUID id;
    PuzzleDifficulty difficulty;
    List<String> letters;
    String centerLetter;
    int minimumWordLength;
    int targetWordCount;
    /** Number of pangrams in the puzzle (count only — not the words). */
    int pangramCount;
    int xpReward;
    int coinReward;
    LocalDate scheduledDate;
    Boolean daily;
}
