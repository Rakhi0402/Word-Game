package com.kungfu.wordquest.puzzle.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PuzzleViewResponse {
    PuzzlePlayDto puzzle;
    PuzzleProgressDto progress;
}
