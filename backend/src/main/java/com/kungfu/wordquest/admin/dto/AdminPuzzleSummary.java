package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class AdminPuzzleSummary {
    Long id;
    String difficulty;
    List<String> letters;
    String centerLetter;
    int targetWordCount;
    int pangramCount;
    int validWordCount;
    boolean active;
    LocalDate puzzleDate;
    String fingerprint;
    LocalDateTime createdAt;
}
