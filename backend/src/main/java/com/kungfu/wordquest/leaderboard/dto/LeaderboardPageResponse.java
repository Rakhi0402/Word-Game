package com.kungfu.wordquest.leaderboard.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class LeaderboardPageResponse {
    private List<LeaderboardEntryDto> entries;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
    /** Present when the request is authenticated. */
    private LeaderboardMeDto currentUser;
}
