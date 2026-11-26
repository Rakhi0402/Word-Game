package com.kungfu.wordquest.dashboard.service;

import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.dashboard.dto.DashboardResponse;
import com.kungfu.wordquest.dashboard.dto.DashboardResponse.*;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import com.kungfu.wordquest.puzzle.repository.DailyPuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.puzzle.time.GameClock;
import com.kungfu.wordquest.reward.repository.UserAchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final UserCardRepository userCardRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final PuzzleRepository puzzleRepository;
    private final UserPuzzleSessionRepository userPuzzleSessionRepository;
    private final ProgressionService progressionService;
    private final GameClock gameClock;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findWithStatsById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        UserStats stats = user.getStats() != null ? user.getStats() : UserStats.builder().build();
        ProgressionService.TrainingProgress training = progressionService.resolve(user.getXp());

        int unlockedAchievements = (int) userAchievementRepository.findByUserId(userId).stream()
                .filter(ua -> ua.isUnlocked())
                .count();

        return DashboardResponse.builder()
                .profile(ProfileSection.builder()
                        .userId(user.getId())
                        .userName(user.getUsername())
                        .userEmail(user.getEmail())
                        .build())
                .training(TrainingSection.builder()
                        .belt(training.belt())
                        .rank(training.rank())
                        .dojoLevel(training.dojoLevel())
                        .xp(training.xp())
                        .xpForCurrentBelt(training.xpForCurrentBelt())
                        .xpForNextBelt(training.xpForNextBelt())
                        .xpProgress(training.xpProgress())
                        .xpProgressPercentage(training.xpProgressPercentage())
                        .xpNeeded(training.isMaxBelt() ? training.xp() : training.xpForNextBelt())
                        .build())
                .wallet(WalletSection.builder()
                        .coins(user.getCoins())
                        .freeChestTokens(user.getFreeChestTokens())
                        .build())
                .streak(StreakSection.builder()
                        .current(user.getDailyStreak())
                        .longest(Math.max(stats.getHighestStreak(), user.getDailyStreak()))
                        .streakShields(user.getStreakShields())
                        .lastCompletedDate(user.getLastPuzzleDate())
                        .build())
                .activeCard(buildActiveCard(user))
                .dailyQuest(buildDailyQuest(user))
                .statistics(StatisticsSection.builder()
                        .wordsFound(stats.getWordsFound())
                        .cardsCollected(stats.getCardsCollected())
                        .achievementsEarned(Math.max(stats.getAchievementsEarned(), unlockedAchievements))
                        .highestScore(stats.getHighestScore())
                        .daysPlayed(stats.getDaysPlayed())
                        .puzzlesCompleted(stats.getPuzzlesCompleted())
                        .pangramsFound(stats.getPangramsFound())
                        .perfectPuzzles(stats.getPerfectPuzzles())
                        .hintsUsed(stats.getHintsUsed())
                        .hintsBought(stats.getHintsBought())
                        .build())
                .achievementsUnlocked(unlockedAchievements)
                .build();
    }

    private ActiveCardSection buildActiveCard(User user) {
        String equippedId = user.getEquippedCardId();
        if (equippedId == null || equippedId.isBlank()) {
            return null;
        }

        Optional<Card> cardOpt = cardRepository.findById(equippedId);
        if (cardOpt.isEmpty()) {
            return ActiveCardSection.builder().cardId(equippedId).build();
        }
        Card card = cardOpt.get();
        Optional<UserCard> ownership = userCardRepository.findByUserIdAndCardId(user.getId(), equippedId);

        int charges = ownership.map(UserCard::getChargesRemaining)
                .orElseGet(() -> GameEconomy.starTier(card.getStars()).charges());
        String status = ownership.map(UserCard::getStatus).orElse("available");

        return ActiveCardSection.builder()
                .cardId(card.getId())
                .name(card.getName())
                .rarity(card.getRarity())
                .stars(card.getStars())
                .bonuses(card.getBonuses() != null ? card.getBonuses() : List.of())
                .chargesRemaining(charges)
                .status(status)
                .image(card.getImage())
                .build();
    }

    private DailyQuestSection buildDailyQuest(User user) {
        LocalDate today = gameClock.today();
        // Read-only: never call assign/generate here — that marks the TX rollback-only on failure.
        Optional<Puzzle> daily = dailyPuzzleRepository.findByScheduledDateWithPuzzle(today)
                .map(com.kungfu.wordquest.puzzle.entity.DailyPuzzle::getPuzzle)
                .or(() -> puzzleRepository.findByPuzzleDate(today));

        if (daily.isEmpty()) {
            int remaining = remainingChoice(user, today.toString());
            return DailyQuestSection.builder()
                    .available(false)
                    .completed(false)
                    .choicePuzzlesRemaining(remaining)
                    .build();
        }

        Puzzle puzzle = daily.get();
        boolean completed = userPuzzleSessionRepository
                .findByUserIdAndPuzzleId(user.getId(), puzzle.getId())
                .map(UserPuzzleSession::isCompleted)
                .orElse(false);

        return DailyQuestSection.builder()
                .available(!completed)
                .puzzleId(puzzle.getId() != null ? puzzle.getId().toString() : null)
                .difficulty(formatDifficulty(puzzle.getDifficulty()))
                .completed(completed)
                .choicePuzzlesRemaining(remainingChoice(user, today.toString()))
                .build();
    }

    private int remainingChoice(User user, String todayKey) {
        int done = todayKey.equals(user.getChoicePuzzlesDate())
                ? user.getChoicePuzzlesCompletedToday()
                : 0;
        return Math.max(0, GameEconomy.MAX_CHOICE_PUZZLES_PER_DAY - done);
    }

    private static String formatDifficulty(com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty d) {
        if (d == null) return null;
        String n = d.name().toLowerCase();
        return Character.toUpperCase(n.charAt(0)) + n.substring(1);
    }
}
