package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class AdminUserSummary {
    UUID id;
    String username;
    String email;
    String role;
    String belt;
    int xp;
    int coins;
    boolean enabled;
    boolean locked;
    LocalDateTime createdAt;
    LocalDateTime lastLogin;
}
