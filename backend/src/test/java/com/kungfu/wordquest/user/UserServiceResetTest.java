package com.kungfu.wordquest.user;

import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import com.kungfu.wordquest.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceResetTest {

    @Mock UserRepository userRepository;
    @Mock CardRepository cardRepository;
    @Mock UserCardRepository userCardRepository;
    @Mock LeaderboardService leaderboardService;
    @InjectMocks UserService userService;

    @Test
    void resetProgression_deletesCardsBeforeReinsertingStarter() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .username("disciple")
                .email("disciple@example.com")
                .passwordHash("hash")
                .belt("Black")
                .xp(999)
                .coins(500)
                .stats(UserStats.builder().build())
                .build();
        Card starter = Card.builder().id("po_common").name("Po").stars(1).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cardRepository.findById("po_common")).thenReturn(Optional.of(starter));
        when(userCardRepository.saveAndFlush(any(UserCard.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User reset = userService.resetProgression(userId);

        assertEquals("White", reset.getBelt());
        assertEquals(0, reset.getXp());
        assertEquals("po_common", reset.getEquippedCardId());

        InOrder order = inOrder(userCardRepository);
        order.verify(userCardRepository).deleteAllByUserId(userId);
        order.verify(userCardRepository).saveAndFlush(any(UserCard.class));

        ArgumentCaptor<UserCard> cardCaptor = ArgumentCaptor.forClass(UserCard.class);
        verify(userCardRepository).saveAndFlush(cardCaptor.capture());
        assertEquals("po_common", cardCaptor.getValue().getCard().getId());
        assertEquals(1, cardCaptor.getValue().getCount());
        assertEquals("available", cardCaptor.getValue().getStatus());
        verify(leaderboardService).updateScore("disciple", 0);
    }
}
