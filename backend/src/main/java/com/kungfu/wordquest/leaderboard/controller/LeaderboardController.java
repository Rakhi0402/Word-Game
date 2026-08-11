package com.kungfu.wordquest.leaderboard.controller;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardMeDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardPageResponse;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.security.CustomUserDetails;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
@Validated
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    /**
     * All-time XP leaderboard (paginated).
     * Legacy {@code limit} maps to {@code page=0&size=limit} when {@code page} is omitted.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<LeaderboardPageResponse>> getLeaderboard(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Min(1) @Max(100) Integer limit,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        int effectivePage = page;
        int effectiveSize = size;
        if (limit != null && page == 0 && size == LeaderboardService.DEFAULT_SIZE) {
            // Backward-compatible: ?limit=20 → first page of that size
            effectiveSize = limit;
        }

        var currentId = userDetails != null ? userDetails.getId() : null;
        LeaderboardPageResponse data =
                leaderboardService.getLeaderboard(effectivePage, effectiveSize, currentId);
        return ResponseEntity.ok(ApiResponse.success("Leaderboard retrieved successfully", data));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LeaderboardMeDto>> getMyStanding(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LeaderboardMeDto me = leaderboardService.getMyRank(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Player rank fetched successfully", me));
    }

    /** Legacy alias for {@link #getMyStanding}. */
    @GetMapping("/rank")
    public ResponseEntity<ApiResponse<Integer>> getPlayerRank(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LeaderboardMeDto me = leaderboardService.getMyRank(userDetails.getId());
        Integer rank = me != null ? me.getRank() : null;
        return ResponseEntity.ok(ApiResponse.success("Player rank fetched successfully", rank));
    }
}
