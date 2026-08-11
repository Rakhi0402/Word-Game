package com.kungfu.wordquest.auth.mapper;

import com.kungfu.wordquest.auth.dto.UserResponse;
import com.kungfu.wordquest.user.entity.User;

public final class UserResponseMapper {

    private UserResponseMapper() {}

    public static UserResponse toResponse(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .userName(user.getUsername())
                .userEmail(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
                .belt(user.getBelt())
                .xp(user.getXp())
                .coins(user.getCoins())
                .build();
    }
}
