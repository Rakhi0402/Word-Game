package com.kungfu.wordquest.profile;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.profile.controller.ProfileController;
import com.kungfu.wordquest.profile.dto.ProfileResponse;
import com.kungfu.wordquest.profile.service.ProfileService;
import com.kungfu.wordquest.security.CustomUserDetails;
import com.kungfu.wordquest.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock ProfileService profileService;
    @InjectMocks ProfileController profileController;

    @Test
    void getProfile_usesAuthenticatedPrincipalId() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("hash")
                .build();
        CustomUserDetails principal = new CustomUserDetails(user);

        ProfileResponse expected = ProfileResponse.builder()
                .user(ProfileResponse.UserSection.builder()
                        .id(userId)
                        .userName("disciple")
                        .userEmail("disciple@example.com")
                        .build())
                .achievements(List.of())
                .build();
        when(profileService.getProfile(userId)).thenReturn(expected);

        ResponseEntity<ApiResponse<ProfileResponse>> response = profileController.getProfile(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(Boolean.TRUE.equals(response.getBody().isSuccess()));
        assertEquals("Profile retrieved successfully", response.getBody().getMessage());
        assertEquals(userId, response.getBody().getData().getUser().getId());
        assertEquals("disciple", response.getBody().getData().getUser().getUserName());
        verify(profileService).getProfile(userId);
    }

    @Test
    void getProfile_neverPassesClientUserId() {
        UUID authenticatedId = UUID.randomUUID();
        User user = User.builder()
                .id(authenticatedId)
                .username("alice")
                .email("alice@example.com")
                .passwordHash("hash")
                .build();
        CustomUserDetails principal = new CustomUserDetails(user);

        when(profileService.getProfile(authenticatedId)).thenReturn(
                ProfileResponse.builder()
                        .user(ProfileResponse.UserSection.builder().id(authenticatedId).userName("alice").build())
                        .achievements(List.of())
                        .build());

        profileController.getProfile(principal);

        verify(profileService).getProfile(authenticatedId);
    }
}
