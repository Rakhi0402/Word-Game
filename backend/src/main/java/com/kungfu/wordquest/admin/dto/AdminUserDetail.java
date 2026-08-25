package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminUserDetail {
    UUID id;
    String username;
    String email;
    String role;
    String belt;
    int xp;
    int coins;
    boolean enabled;
    boolean locked;
    int tokenVersion;
    LocalDateTime createdAt;
    LocalDateTime lastLogin;
    LocalDateTime lastPlayed;
    Integer wordsFound;
    Integer puzzlesCompleted;
    Integer cardsCollected;
    Integer achievementsEarned;
}
