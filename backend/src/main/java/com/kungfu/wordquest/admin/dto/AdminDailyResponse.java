package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.util.List;

@Value
@Builder
public class AdminDailyResponse {
    LocalDate scheduledDate;
    Long puzzleId;
    String difficulty;
    List<String> letters;
    String centerLetter;
    boolean active;
}
