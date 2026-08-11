package com.kungfu.wordquest.leaderboard;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.leaderboard.controller.LeaderboardController;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardEntryDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardMeDto;
import com.kungfu.wordquest.leaderboard.dto.LeaderboardPageResponse;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaderboardControllerTest {

    @Mock LeaderboardService leaderboardService;
    @InjectMocks LeaderboardController controller;

    @Test
    void getLeaderboard_passesAuthenticatedUserId() {
        UUID id = UUID.randomUUID();
        CustomUserDetails principal = new CustomUserDetails(User.builder()
                .id(id)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .build());

        LeaderboardPageResponse page = LeaderboardPageResponse.builder()
                .entries(List.of(LeaderboardEntryDto.builder()
                        .rank(1)
                        .userId(id)
                        .username("disciple")
                        .xp(100)
                        .belt("White")
                        .currentUser(true)
                        .build()))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .hasNext(false)
                .currentUser(LeaderboardMeDto.builder().rank(1).xp(100).username("disciple").build())
                .build();
        when(leaderboardService.getLeaderboard(0, 20, id)).thenReturn(page);

        ResponseEntity<ApiResponse<LeaderboardPageResponse>> response =
                controller.getLeaderboard(0, 20, null, principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getEntries().size());
        assertEquals(1, response.getBody().getData().getCurrentUser().getRank());
        verify(leaderboardService).getLeaderboard(0, 20, id);
    }

    @Test
    void getLeaderboard_legacyLimitMapsToSize() {
        when(leaderboardService.getLeaderboard(eq(0), eq(15), isNull()))
                .thenReturn(LeaderboardPageResponse.builder()
                        .entries(List.of())
                        .page(0)
                        .size(15)
                        .totalElements(0)
                        .totalPages(0)
                        .hasNext(false)
                        .build());

        controller.getLeaderboard(0, 20, 15, null);

        verify(leaderboardService).getLeaderboard(0, 15, null);
    }

    @Test
    void getMyStanding_usesPrincipalId() {
        UUID id = UUID.randomUUID();
        CustomUserDetails principal = new CustomUserDetails(User.builder()
                .id(id)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .build());
        when(leaderboardService.getMyRank(id)).thenReturn(
                LeaderboardMeDto.builder().rank(7).xp(400).username("disciple").belt("White").build());

        ResponseEntity<ApiResponse<LeaderboardMeDto>> response = controller.getMyStanding(principal);

        assertEquals(7, response.getBody().getData().getRank());
        verify(leaderboardService).getMyRank(id);
    }
}
