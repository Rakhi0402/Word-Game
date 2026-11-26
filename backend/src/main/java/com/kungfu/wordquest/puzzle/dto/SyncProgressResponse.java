package com.kungfu.wordquest.puzzle.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class SyncProgressResponse {
    boolean completed;
    int score;
    int streak;
    List<String> foundWords;
    int wordsFoundCount;
    int targetWordCount;
    int xpAwarded;
    int coinsAwarded;
    int totalXp;
    int totalCoins;
    String belt;
}
