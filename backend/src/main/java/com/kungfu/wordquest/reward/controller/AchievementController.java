package com.kungfu.wordquest.reward.controller;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.reward.entity.UserAchievement;
import com.kungfu.wordquest.reward.service.AchievementService;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserAchievement>>> getAchievements(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<UserAchievement> achievements = achievementService.getUserAchievements(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Achievements fetched", achievements));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<List<UserAchievement>>> evaluate(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<UserAchievement> results = achievementService.evaluateAndUnlock(userDetails.getId());
            return ResponseEntity.ok(ApiResponse.success("Achievements evaluated", results));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
