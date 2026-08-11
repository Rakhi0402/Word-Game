package com.kungfu.wordquest.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class LeaderboardEntryDto {
    private int rank;
    @JsonProperty("userId")
    private UUID userId;
    private String username;
    /** Total XP — ranking metric ("Chi Score" in the UI). */
    private int xp;
    private String belt;
    private boolean currentUser;
}
