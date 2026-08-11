package com.kungfu.wordquest.user.controller;

import com.kungfu.wordquest.auth.dto.UserResponse;
import com.kungfu.wordquest.auth.mapper.UserResponseMapper;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.security.CustomUserDetails;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched successfully", UserResponseMapper.toResponse(user)));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<UserResponse>> resetProgression(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userService.resetProgression(userDetails.getId());
        return ResponseEntity.ok(
                ApiResponse.success("Progression reset successfully", UserResponseMapper.toResponse(user)));
    }
}
