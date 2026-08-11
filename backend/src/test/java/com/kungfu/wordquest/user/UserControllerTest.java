package com.kungfu.wordquest.user;

import com.kungfu.wordquest.auth.dto.UserResponse;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.security.CustomUserDetails;
import com.kungfu.wordquest.user.controller.UserController;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock UserService userService;
    @InjectMocks UserController userController;

    @Test
    void getMe_returnsProfileForAuthenticatedUser() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("encoded")
                .build();
        when(userService.getUserProfile(id)).thenReturn(user);

        CustomUserDetails principal = new CustomUserDetails(user);
        ResponseEntity<ApiResponse<UserResponse>> response = userController.getCurrentUser(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(Boolean.TRUE.equals(response.getBody().isSuccess()));
        assertEquals("disciple", response.getBody().getData().getUserName());
        assertEquals("disciple@example.com", response.getBody().getData().getUserEmail());
        verify(userService).getUserProfile(id);
    }

    @Test
    void reset_usesAuthenticatedUserId() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("encoded")
                .belt("White")
                .xp(0)
                .coins(100)
                .build();
        when(userService.resetProgression(id)).thenReturn(user);

        CustomUserDetails principal = new CustomUserDetails(user);
        ResponseEntity<ApiResponse<UserResponse>> response = userController.resetProgression(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(Boolean.TRUE.equals(response.getBody().isSuccess()));
        assertEquals("Progression reset successfully", response.getBody().getMessage());
        assertEquals("disciple", response.getBody().getData().getUserName());
        verify(userService).resetProgression(id);
    }
}
