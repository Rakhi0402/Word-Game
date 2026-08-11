package com.kungfu.wordquest.dashboard;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.dashboard.controller.DashboardController;
import com.kungfu.wordquest.dashboard.dto.DashboardResponse;
import com.kungfu.wordquest.dashboard.service.DashboardService;
import com.kungfu.wordquest.security.CustomUserDetails;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock DashboardService dashboardService;
    @InjectMocks DashboardController dashboardController;

    @Test
    void getDashboard_returnsCurrentUserData() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .username("Rakhi")
                .email("rakhi@example.com")
                .passwordHash("hash")
                .legacyPassword("hash")
                .role(UserRole.ROLE_USER)
                .build();
        CustomUserDetails principal = new CustomUserDetails(user);

        DashboardResponse response = DashboardResponse.builder()
                .profile(DashboardResponse.ProfileSection.builder()
                        .userId(userId)
                        .userName("Rakhi")
                        .userEmail("rakhi@example.com")
                        .build())
                .training(DashboardResponse.TrainingSection.builder()
                        .belt("White")
                        .rank("Novice Disciple")
                        .dojoLevel(1)
                        .xp(0)
                        .build())
                .build();

        when(dashboardService.getDashboard(eq(userId))).thenReturn(response);

        ResponseEntity<ApiResponse<DashboardResponse>> entity =
                dashboardController.getDashboard(principal);

        assertEquals(200, entity.getStatusCode().value());
        assertNotNull(entity.getBody());
        assertTrue(entity.getBody().isSuccess());
        assertEquals("Rakhi", entity.getBody().getData().getProfile().getUserName());
        assertEquals("White", entity.getBody().getData().getTraining().getBelt());
    }
}
