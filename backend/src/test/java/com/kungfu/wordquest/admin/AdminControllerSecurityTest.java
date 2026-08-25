package com.kungfu.wordquest.admin;

import com.kungfu.wordquest.admin.controller.AdminController;
import com.kungfu.wordquest.admin.dto.AdminOverviewResponse;
import com.kungfu.wordquest.admin.service.AdminService;
import com.kungfu.wordquest.security.CustomUserDetailsService;
import com.kungfu.wordquest.security.JwtAuthenticationFilter;
import com.kungfu.wordquest.security.JwtTokenProvider;
import com.kungfu.wordquest.security.SecurityConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import({SecurityConfig.class, com.kungfu.wordquest.common.GlobalExceptionHandler.class})
class AdminControllerSecurityTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean
    AdminService adminService;
    @MockitoBean JwtTokenProvider jwtTokenProvider;
    @MockitoBean JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean CustomUserDetailsService customUserDetailsService;
    @MockitoBean PasswordEncoder passwordEncoder;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            ServletRequest req = invocation.getArgument(0);
            ServletResponse res = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "USER")
    void overview_forbiddenForUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void overview_okForAdmin() throws Exception {
        when(adminService.overview()).thenReturn(AdminOverviewResponse.builder()
                .userCount(3)
                .adminCount(1)
                .puzzleCount(4)
                .activePuzzleCount(4)
                .todayDailyDate("2026-08-11")
                .dictionaryAllowedCount(300)
                .dictionarySourceVersion("1.0.0")
                .build());

        mockMvc.perform(get("/api/v1/admin/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userCount").value(3));
    }

    @Test
    void overview_unauthorizedWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview"))
                .andExpect(status().isForbidden());
    }
}
