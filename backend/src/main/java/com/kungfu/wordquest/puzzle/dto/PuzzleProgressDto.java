package com.kungfu.wordquest.puzzle.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class PuzzleProgressDto {
    String status; // NOT_STARTED | IN_PROGRESS | COMPLETED
    boolean completed;
    List<String> foundWords;
    int score;
    int streak;
    int hintsUsed;
    int wordsFoundCount;
    int targetWordCount;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
}
