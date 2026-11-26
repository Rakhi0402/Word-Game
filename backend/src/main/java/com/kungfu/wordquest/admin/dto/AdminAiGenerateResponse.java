package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class AdminAiGenerateResponse {
    String batchId;
    String difficulty;
    int requested;
    int created;
    boolean groqUsed;
    List<AdminPuzzleDetail> puzzles;
    List<String> rejected;
}
