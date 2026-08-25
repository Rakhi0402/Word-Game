package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class AdminDailyResponse {
    LocalDate scheduledDate;
    UUID puzzleId;
    String difficulty;
    List<String> letters;
    String centerLetter;
    boolean active;
}
