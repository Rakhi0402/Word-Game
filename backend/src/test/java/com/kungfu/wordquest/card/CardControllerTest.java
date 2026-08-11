package com.kungfu.wordquest.card;

import com.kungfu.wordquest.card.controller.CardController;
import com.kungfu.wordquest.card.dto.CollectionCardDto;
import com.kungfu.wordquest.card.dto.CollectionResponse;
import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.common.api.ApiResponse;
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
class CardControllerTest {

    @Mock CardService cardService;
    @InjectMocks CardController controller;

    @Test
    void inventory_usesAuthenticatedUserId() {
        UUID id = UUID.randomUUID();
        CustomUserDetails principal = new CustomUserDetails(User.builder()
                .id(id)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .build());
        when(cardService.getCollection(id)).thenReturn(CollectionResponse.builder()
                .cards(List.of(CollectionCardDto.builder()
                        .id("po_common")
                        .owned(true)
                        .quantity(1)
                        .equipped(true)
                        .chargesRemaining(5)
                        .status("available")
                        .build()))
                .equippedCardId("po_common")
                .build());

        ResponseEntity<ApiResponse<CollectionResponse>> response = controller.getUserInventory(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getData().getCards().size());
        verify(cardService).getCollection(id);
    }

    @Test
    void equip_returnsUpdatedCollection() {
        UUID id = UUID.randomUUID();
        CustomUserDetails principal = new CustomUserDetails(User.builder()
                .id(id)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .build());
        when(cardService.equipCard(id, "po_common")).thenReturn(CollectionResponse.builder()
                .cards(List.of())
                .equippedCardId("po_common")
                .build());

        var response = controller.equipCard(principal, "po_common");

        assertEquals("po_common", response.getBody().getData().getEquippedCardId());
        verify(cardService).equipCard(id, "po_common");
    }
}
