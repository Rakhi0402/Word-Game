package com.kungfu.wordquest.puzzle.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SyncProgressRequest {
    private Long puzzleId;
    /** Words the client has accepted locally (order preserved). */
    private List<String> foundWords = new ArrayList<>();
    private Integer score;
    private Integer streak;
}
