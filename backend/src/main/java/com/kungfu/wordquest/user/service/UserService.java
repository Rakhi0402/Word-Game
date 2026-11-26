package com.kungfu.wordquest.user.service;

import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.constants.CardIds;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.reward.repository.UserAchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final UserCardRepository userCardRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserPuzzleSessionRepository userPuzzleSessionRepository;
    private final LeaderboardService leaderboardService;

    @Transactional(readOnly = true)
    public User getUserProfile(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User resetProgression(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBelt("White");
        user.setLevel(1);
        user.setXp(0);
        user.setCoins(GameEconomy.STARTING_COINS);
        user.setCurrentStreak(0);
        user.setDailyStreak(0);
        user.setStreakShields(0);
        user.setFreeChestTokens(0);
        user.setPermanentExtraDailyHint(false);
        user.setBonusFreeHintsNextDay(0);
        user.setLastPuzzleDate(null);
        user.setChoicePuzzlesDate(null);
        user.setChoicePuzzlesCompletedToday(0);
        user.setLastPlayed(LocalDateTime.now());
        user.setEquippedCardId(CardIds.PO_COMMON);

        UserStats stats = user.getStats();
        if (stats != null) {
            stats.setWordsFound(0);
            stats.setCardsCollected(1);
            stats.setAchievementsEarned(0);
            stats.setHighestScore(0);
            stats.setDaysPlayed(0);
            stats.setPuzzlesCompleted(0);
            stats.setPangramsFound(0);
            stats.setPerfectPuzzles(0);
            stats.setHintsUsed(0);
            stats.setHintsBought(0);
            stats.setHighestStreak(0);
            stats.setGamesPlayed(0);
        }

        userAchievementRepository.deleteAllByUserId(userId);
        userPuzzleSessionRepository.deleteAllByUserId(userId);
        // Flush delete so re-inserting po_common does not hit unique (user_id, card_id).
        userCardRepository.deleteAllByUserId(userId);

        cardRepository.findById(CardIds.PO_COMMON).ifPresent(card -> {
            int charges = GameEconomy.starTier(card.getStars()).charges();
            UserCard userCard = UserCard.builder()
                    .user(user)
                    .card(card)
                    .count(1)
                    .chargesRemaining(charges)
                    .status("available")
                    .build();
            userCardRepository.saveAndFlush(userCard);
        });

        User saved = userRepository.save(user);
        leaderboardService.updateScore(saved.getUsername(), saved.getXp());
        return saved;
    }
}
