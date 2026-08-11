package com.kungfu.wordquest.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    @JsonProperty("userId")
    private UUID userId;

    @JsonProperty("userName")
    private String userName;

    @JsonProperty("userEmail")
    private String userEmail;

    private String role;
    private String belt;
    private int xp;
    private int coins;
}
