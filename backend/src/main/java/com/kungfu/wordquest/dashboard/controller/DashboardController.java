package com.kungfu.wordquest.dashboard.controller;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.dashboard.dto.DashboardResponse;
import com.kungfu.wordquest.dashboard.service.DashboardService;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DashboardResponse dashboard = dashboardService.getDashboard(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard loaded", dashboard));
    }
}
