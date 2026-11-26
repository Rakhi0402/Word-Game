package com.kungfu.wordquest.puzzle.dto;

import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.util.List;

/**
 * Playable puzzle payload for Spelling Bee–style local validation.
 * Includes the answer list so the client can validate instantly; server sync remains authoritative for XP/coins.
 */
@Value
@Builder
public class PuzzlePlayDto {
    Long id;
    PuzzleDifficulty difficulty;
    List<String> letters;
    String centerLetter;
    int minimumWordLength;
    int targetWordCount;
    /** Number of pangrams in the puzzle. */
    int pangramCount;
    /** Full playable word list for this puzzle (local validation). */
    List<String> validWords;
    /** Pangram words for this puzzle. */
    List<String> pangrams;
    int xpReward;
    int coinReward;
    LocalDate scheduledDate;
    Boolean daily;
}
