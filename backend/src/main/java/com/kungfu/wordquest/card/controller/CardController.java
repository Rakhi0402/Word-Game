package com.kungfu.wordquest.card.controller;

import com.kungfu.wordquest.card.dto.CardDefinitionDto;
import com.kungfu.wordquest.card.dto.CollectionResponse;
import com.kungfu.wordquest.card.dto.DrawResultDto;
import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CardDefinitionDto>>> getAllCards() {
        return ResponseEntity.ok(ApiResponse.success("All scrolls fetched successfully", cardService.getAllCards()));
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<CollectionResponse>> getUserInventory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                "Collection retrieved successfully",
                cardService.getCollection(userDetails.getId())));
    }

    @PostMapping("/draw")
    public ResponseEntity<ApiResponse<DrawResultDto>> drawChest(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        DrawResultDto result = cardService.drawCardChest(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Scroll summoned successfully", result));
    }

    @PostMapping("/equip")
    public ResponseEntity<ApiResponse<CollectionResponse>> equipCard(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String cardId) {
        CollectionResponse collection = cardService.equipCard(userDetails.getId(), cardId);
        return ResponseEntity.ok(ApiResponse.success("Scroll equipped successfully", collection));
    }
}
