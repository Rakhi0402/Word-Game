package com.kungfu.wordquest.puzzle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitWordResponse {
    private boolean valid;
    private boolean duplicate;
    private int points;
    private boolean isPangram;
    private boolean completed;

    /** XP awarded this submission when the puzzle just completed (0 otherwise). */
    private int xpAwarded;
    /** Coins awarded this submission when the puzzle just completed (0 otherwise). */
    private int coinsAwarded;
    private int totalXp;
    private int totalCoins;
    private String belt;
}
