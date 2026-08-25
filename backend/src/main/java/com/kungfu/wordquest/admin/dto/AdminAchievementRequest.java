package com.kungfu.wordquest.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminAchievementRequest {
    @NotBlank
    private String id;
    @NotBlank
    private String title;
    private String description;
    private int target;
    private int rewardXp;
    private int rewardCoins;
    private String iconName;
}
