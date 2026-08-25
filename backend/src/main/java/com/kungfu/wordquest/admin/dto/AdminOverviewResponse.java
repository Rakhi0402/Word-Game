package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminOverviewResponse {
    long userCount;
    long adminCount;
    long puzzleCount;
    long activePuzzleCount;
    String todayDailyPuzzleId;
    String todayDailyDate;
    long dictionaryAllowedCount;
    String dictionarySourceVersion;
}
