package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class AdminPuzzleSummary {
    UUID id;
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
