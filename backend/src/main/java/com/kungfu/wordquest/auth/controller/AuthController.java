package com.kungfu.wordquest.auth.controller;

import com.kungfu.wordquest.auth.dto.AuthResponse;
import com.kungfu.wordquest.auth.dto.LoginRequest;
import com.kungfu.wordquest.auth.dto.RefreshTokenRequest;
import com.kungfu.wordquest.auth.dto.RegisterRequest;
import com.kungfu.wordquest.auth.dto.RegisterResponse;
import com.kungfu.wordquest.auth.service.AuthService;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        RegisterResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Access token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails != null) {
            authService.logout(userDetails.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
