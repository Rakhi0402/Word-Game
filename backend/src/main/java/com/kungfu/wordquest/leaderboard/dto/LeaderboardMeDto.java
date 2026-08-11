package com.kungfu.wordquest.leaderboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class LeaderboardMeDto {
    private int rank;
    private int xp;
    private String username;
    private String belt;
    @JsonProperty("userId")
    private UUID userId;
}
