package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class AdminPuzzleDetail {
    UUID id;
    String difficulty;
    List<String> letters;
    String centerLetter;
    int minimumWordLength;
    int targetWordCount;
    int pangramCount;
    int xpReward;
    int coinReward;
    boolean active;
    LocalDate puzzleDate;
    String fingerprint;
    String generationBatchId;
    String dictionarySourceVersion;
    List<String> validWords;
    List<String> pangrams;
    LocalDateTime createdAt;
}
