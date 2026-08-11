package com.kungfu.wordquest.reward.service;

import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.reward.entity.Achievement;
import com.kungfu.wordquest.reward.entity.UserAchievement;
import com.kungfu.wordquest.reward.repository.AchievementRepository;
import com.kungfu.wordquest.reward.repository.UserAchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;

    @Transactional(readOnly = true)
    public List<UserAchievement> getUserAchievements(UUID userId) {
        return userAchievementRepository.findByUserId(userId);
    }

    /**
     * Evaluates all known achievements against current player stats and
     * unlocks any that have been newly completed. Called after every
     * significant game event (word submission, puzzle completion, card draw).
     */
    @Transactional
    public List<UserAchievement> evaluateAndUnlock(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Achievement> allAchievements = achievementRepository.findAll();

        for (Achievement achievement : allAchievements) {
            UserAchievement ua = userAchievementRepository
                    .findByUserIdAndAchievementId(userId, achievement.getId())
                    .orElseGet(() -> UserAchievement.builder()
                            .user(user)
                            .achievement(achievement)
                            .progress(0)
                            .unlocked(false)
                            .build());

            if (ua.isUnlocked()) continue;

            int currentProgress = resolveProgress(achievement.getId(), user);
            ua.setProgress(currentProgress);

            if (currentProgress >= achievement.getTarget()) {
                ua.setUnlocked(true);
                ua.setUnlockedAt(LocalDateTime.now());

                // Grant rewards
                user.setXp(user.getXp() + achievement.getRewardXp());
                user.setCoins(user.getCoins() + achievement.getRewardCoins());
                user.getStats().setAchievementsEarned(user.getStats().getAchievementsEarned() + 1);

                log.info("Achievement '{}' unlocked for user '{}'", achievement.getId(), user.getUsername());
            }

            userAchievementRepository.save(ua);
        }

        userRepository.save(user);
        leaderboardService.updateScore(user.getUsername(), user.getXp());
        return userAchievementRepository.findByUserId(userId);
    }

    /**
     * Maps an achievement ID to the relevant stat field on the User entity.
     * Keeps achievement logic decoupled from entities.
     */
    private int resolveProgress(String achievementId, User user) {
        if (user.getStats() == null) return 0;
        return switch (achievementId) {
            case "first_word"         -> user.getStats().getWordsFound() >= 1 ? 1 : 0;
            case "word_master_10"     -> user.getStats().getWordsFound();
            case "word_master_50"     -> user.getStats().getWordsFound();
            case "word_master_100"    -> user.getStats().getWordsFound();
            case "puzzle_complete_1"  -> user.getStats().getPuzzlesCompleted();
            case "puzzle_complete_10" -> user.getStats().getPuzzlesCompleted();
            case "puzzle_complete_30" -> user.getStats().getPuzzlesCompleted();
            case "streak_3"           -> user.getDailyStreak();
            case "streak_7"           -> user.getDailyStreak();
            case "streak_30"          -> user.getDailyStreak();
            case "collector_3"        -> user.getStats().getCardsCollected();
            case "collector_all"      -> user.getStats().getCardsCollected();
            case "belt_yellow"        -> beltToLevel(user.getBelt()) >= 1 ? 1 : 0;
            case "belt_black"         -> beltToLevel(user.getBelt()) >= 6 ? 1 : 0;
            default                   -> 0;
        };
    }

    private int beltToLevel(String belt) {
        return switch (belt) {
            case "Yellow" -> 1;
            case "Orange" -> 2;
            case "Green"  -> 3;
            case "Blue"   -> 4;
            case "Brown"  -> 5;
            case "Black"  -> 6;
            default       -> 0;
        };
    }
}
