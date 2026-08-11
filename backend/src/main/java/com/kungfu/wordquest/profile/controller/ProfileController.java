package com.kungfu.wordquest.profile.controller;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.profile.dto.ProfileResponse;
import com.kungfu.wordquest.profile.service.ProfileService;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated Profile aggregate — {@code /me} semantics only.
 * Current user is resolved exclusively from the JWT principal.
 */
@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ProfileResponse profile = profileService.getProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }
}
