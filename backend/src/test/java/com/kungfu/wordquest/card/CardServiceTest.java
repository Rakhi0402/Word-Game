package com.kungfu.wordquest.card;

import com.kungfu.wordquest.card.dto.CollectionResponse;
import com.kungfu.wordquest.card.dto.DrawResultDto;
import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock CardRepository cardRepository;
    @Mock UserCardRepository userCardRepository;
    @Mock UserRepository userRepository;
    @InjectMocks CardService cardService;

    private UUID userId;
    private User user;
    private Card po;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .coins(200)
                .freeChestTokens(0)
                .equippedCardId("po_common")
                .stats(UserStats.builder().cardsCollected(1).build())
                .build();
        po = Card.builder()
                .id("po_common")
                .name("Po")
                .rarity("common")
                .image("po.png")
                .stars(1)
                .build();
    }

    @Test
    void getCollection_returnsOwnedCardsOnly() {
        UserCard owned = UserCard.builder()
                .user(user)
                .card(po)
                .count(1)
                .chargesRemaining(4)
                .status("available")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userCardRepository.findByUserIdWithCard(userId)).thenReturn(List.of(owned));

        CollectionResponse collection = cardService.getCollection(userId);

        assertEquals(1, collection.getCards().size());
        assertEquals("po_common", collection.getCards().get(0).getId());
        assertTrue(collection.getCards().get(0).isEquipped());
        assertEquals(4, collection.getCards().get(0).getChargesRemaining());
        assertEquals("po_common", collection.getEquippedCardId());
    }

    @Test
    void getCollection_emptyWhenNoOwnedCards() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userCardRepository.findByUserIdWithCard(userId)).thenReturn(List.of());
        user.setEquippedCardId(null);

        CollectionResponse collection = cardService.getCollection(userId);

        assertTrue(collection.getCards().isEmpty());
        assertNull(collection.getEquippedCardId());
    }

    @Test
    void equip_ownedAvailableCard_setsEquippedId() {
        UserCard owned = UserCard.builder()
                .user(user)
                .card(po)
                .count(1)
                .chargesRemaining(3)
                .status("available")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.existsById("po_common")).thenReturn(true);
        when(userCardRepository.findByUserIdAndCardId(userId, "po_common")).thenReturn(Optional.of(owned));
        when(userCardRepository.findByUserIdWithCard(userId)).thenReturn(List.of(owned));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        CollectionResponse result = cardService.equipCard(userId, "po_common");

        assertEquals("po_common", user.getEquippedCardId());
        assertEquals("po_common", result.getEquippedCardId());
        verify(userRepository).save(user);
    }

    @Test
    void equip_unownedCard_rejected() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.existsById("tigress")).thenReturn(true);
        when(userCardRepository.findByUserIdAndCardId(userId, "tigress")).thenReturn(Optional.empty());

        assertThrows(ValidationException.class, () -> cardService.equipCard(userId, "tigress"));
    }

    @Test
    void equip_exhaustedCard_rejected() {
        UserCard exhausted = UserCard.builder()
                .user(user)
                .card(po)
                .count(1)
                .chargesRemaining(0)
                .status("exhausted")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.existsById("po_common")).thenReturn(true);
        when(userCardRepository.findByUserIdAndCardId(userId, "po_common")).thenReturn(Optional.of(exhausted));

        assertThrows(ValidationException.class, () -> cardService.equipCard(userId, "po_common"));
    }

    @Test
    void consumeEquippedCharge_decrementsAndExhausts() {
        UserCard uc = UserCard.builder()
                .user(user)
                .card(po)
                .count(1)
                .chargesRemaining(1)
                .status("available")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userCardRepository.findByUserIdAndCardId(userId, "po_common")).thenReturn(Optional.of(uc));

        cardService.consumeEquippedCharge(userId);

        assertEquals(0, uc.getChargesRemaining());
        assertEquals("exhausted", uc.getStatus());
        assertNull(user.getEquippedCardId());
        verify(userCardRepository).save(uc);
        verify(userRepository).save(user);
    }

    @Test
    void draw_requiresCoinsOrToken() {
        user.setCoins(0);
        user.setFreeChestTokens(0);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(ValidationException.class, () -> cardService.drawCardChest(userId));
    }

    @Test
    void draw_usesFreeTokenWhenAvailable() {
        user.setCoins(0);
        user.setFreeChestTokens(1);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.findAll()).thenReturn(List.of(po));
        when(userCardRepository.findByUserIdAndCardId(eq(userId), any())).thenReturn(Optional.empty());
        when(userCardRepository.save(any(UserCard.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        DrawResultDto result = cardService.drawCardChest(userId);

        assertTrue(result.isUsedFreeToken());
        assertEquals(0, result.getFreeChestTokensRemaining());
        assertEquals(0, user.getCoins());
        verify(userCardRepository).save(any(UserCard.class));
    }

    @Test
    void draw_newCardSetsStarTierCharges() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.findAll()).thenReturn(List.of(po));
        when(userCardRepository.findByUserIdAndCardId(eq(userId), any())).thenReturn(Optional.empty());
        when(userCardRepository.save(any(UserCard.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        cardService.drawCardChest(userId);

        var captor = org.mockito.ArgumentCaptor.forClass(UserCard.class);
        verify(userCardRepository).save(captor.capture());
        assertEquals(GameEconomy.starTier(1).charges(), captor.getValue().getChargesRemaining());
        assertEquals("available", captor.getValue().getStatus());
        assertEquals(user.getCoins(), 200 - GameEconomy.CHEST_DRAW_COST);
    }
}
