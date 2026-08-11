package com.kungfu.wordquest.user.controller;

import com.kungfu.wordquest.card.dto.CollectionResponse;
import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Alias collection endpoint under /users/me for authenticated Scrolls page clients.
 */
@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserCollectionController {

    private final CardService cardService;

    @GetMapping({"/collection", "/scrolls"})
    public ResponseEntity<ApiResponse<CollectionResponse>> getCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Collection retrieved successfully",
                cardService.getCollection(userDetails.getId())));
    }
}
