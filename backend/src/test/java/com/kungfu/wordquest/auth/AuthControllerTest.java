package com.kungfu.wordquest.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kungfu.wordquest.auth.dto.AuthResponse;
import com.kungfu.wordquest.auth.dto.RegisterResponse;
import com.kungfu.wordquest.auth.dto.UserResponse;
import com.kungfu.wordquest.auth.service.AuthService;
import com.kungfu.wordquest.common.exception.ConflictException;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.security.JwtAuthenticationFilter;
import com.kungfu.wordquest.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = com.kungfu.wordquest.auth.controller.AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(com.kungfu.wordquest.common.GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean
    AuthService authService;
    @MockitoBean JwtTokenProvider jwtTokenProvider;
    @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void register_validationError_blankUsername() throws Exception {
        String body = """
                {"userName":"","userEmail":"a@b.com","password":"StrongPass1"}
                """;
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void register_duplicateEmail_conflict() throws Exception {
        when(authService.register(any())).thenThrow(
                new ConflictException(ErrorCode.DUPLICATE_RESOURCE, "Email already registered."));

        String body = """
                {"userName":"Rakhi","userEmail":"rakhi@example.com","password":"StrongPass1"}
                """;
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.message").value("Email already registered."));
    }

    @Test
    void register_success() throws Exception {
        UserResponse user = UserResponse.builder()
                .userId(UUID.randomUUID())
                .userName("Rakhi")
                .userEmail("rakhi@example.com")
                .role("ROLE_USER")
                .build();
        when(authService.register(any())).thenReturn(
                RegisterResponse.builder().message("Registration successful").user(user).build());

        String body = """
                {"userName":"Rakhi","userEmail":"rakhi@example.com","password":"StrongPass1"}
                """;
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.userName").value("Rakhi"));
    }

    @Test
    void login_invalidCredentials() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid email or password"));

        String body = """
                {"userEmail":"rakhi@example.com","password":"WrongPass1"}
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.message").value("Invalid email or password"));
    }

    @Test
    void login_success() throws Exception {
        UserResponse user = UserResponse.builder()
                .userId(UUID.randomUUID())
                .userName("Rakhi")
                .userEmail("rakhi@example.com")
                .build();
        when(authService.login(any())).thenReturn(
                AuthResponse.builder()
                        .accessToken("access")
                        .refreshToken("refresh")
                        .user(user)
                        .build());

        String body = """
                {"userEmail":"rakhi@example.com","password":"StrongPass1"}
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access"))
                .andExpect(jsonPath("$.data.user.userEmail").value("rakhi@example.com"));
    }
}
