package com.kungfu.wordquest.puzzle.service;

import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
import com.kungfu.wordquest.dictionary.WordNormalizer;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.puzzle.cache.DailyPuzzleCacheService;
import com.kungfu.wordquest.puzzle.dto.DailyPuzzleCacheDto;
import com.kungfu.wordquest.puzzle.dto.PuzzlePlayDto;
import com.kungfu.wordquest.puzzle.dto.PuzzleProgressDto;
import com.kungfu.wordquest.puzzle.dto.PuzzleViewResponse;
import com.kungfu.wordquest.puzzle.dto.SubmitWordResponse;
import com.kungfu.wordquest.puzzle.entity.DailyPuzzle;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import com.kungfu.wordquest.puzzle.engine.CardBonusEvaluator;
import com.kungfu.wordquest.puzzle.engine.PuzzleValidator;
import com.kungfu.wordquest.puzzle.engine.ScoreCalculator;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.repository.DailyPuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.puzzle.scheduler.PuzzleSchedulerJobs;
import com.kungfu.wordquest.puzzle.time.GameClock;
import com.kungfu.wordquest.reward.service.AchievementService;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PuzzleService {

    private final PuzzleRepository puzzleRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final UserPuzzleSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final PuzzleValidator puzzleValidator;
    private final ScoreCalculator scoreCalculator;
    private final CardBonusEvaluator cardBonusEvaluator;
    private final LeaderboardService leaderboardService;
    private final AchievementService achievementService;
    private final CardService cardService;
    private final ProgressionService progressionService;
    private final DailyPuzzleCacheService dailyPuzzleCache;
    private final GameClock gameClock;
    private final PuzzleSchedulerJobs puzzleSchedulerJobs;
    private final PuzzleWordSnapshotService puzzleWordSnapshotService;
    private final WordNormalizer wordNormalizer;

    @Transactional
    public PuzzleViewResponse getDailyPuzzle(UUID userId) {
        LocalDate today = gameClock.today();
        Puzzle puzzle = resolveDailyPuzzle(today);
        UserPuzzleSession session = sessionRepository.findByUserIdAndPuzzleId(userId, puzzle.getId()).orElse(null);
        return PuzzleViewResponse.builder()
                .puzzle(toPlayDto(puzzle, today, true))
                .progress(toProgressDto(session, puzzle))
                .build();
    }

    /** Legacy entity accessor used by tests/dashboard fallbacks. */
    @Transactional
    public Puzzle getDailyPuzzleEntity() {
        return resolveDailyPuzzle(gameClock.today());
    }

    @Transactional
    public PuzzleViewResponse getByDifficulty(UUID userId, PuzzleDifficulty difficulty) {
        User user = requireUser(userId);
        ensureChoiceQuota(user);

        List<Puzzle> candidates = puzzleRepository.findPlayableByDifficultyForUser(difficulty, userId);
        if (candidates.isEmpty()) {
            throw new ResourceNotFoundException(
                    ErrorCode.PUZZLE_NOT_FOUND,
                    "No " + difficulty.name() + " puzzles available in the pool.");
        }
        // Prefer unscheduled pool entries; otherwise first playable
        Puzzle puzzle = candidates.stream()
                .filter(p -> p.getPuzzleDate() == null)
                .findFirst()
                .orElse(candidates.get(0));

        UserPuzzleSession session = sessionRepository.findByUserIdAndPuzzleId(userId, puzzle.getId()).orElse(null);
        return PuzzleViewResponse.builder()
                .puzzle(toPlayDto(puzzle, null, false))
                .progress(toProgressDto(session, puzzle))
                .build();
    }

    @Transactional
    public UserPuzzleSession startSession(UUID userId, UUID puzzleId) {
        User user = requireUser(userId);
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PUZZLE_NOT_FOUND, "Puzzle not found"));

        Optional<UserPuzzleSession> existing = sessionRepository.findByUserIdAndPuzzleId(userId, puzzleId);
        if (existing.isPresent()) {
            // Idempotent — including completed sessions for review lock state
            return existing.get();
        }

        boolean isDaily = isTodaysDaily(puzzle.getId());
        if (!isDaily) {
            ensureChoiceQuota(user);
        }

        return sessionRepository.save(UserPuzzleSession.builder()
                .user(user)
                .puzzle(puzzle)
                .wordsFound(new ArrayList<>())
                .hintedWords(new ArrayList<>())
                .currentScore(0)
                .currentStreak(0)
                .completed(false)
                .build());
    }

    @Transactional
    public SubmitWordResponse submitWord(UUID userId, UUID puzzleId, String rawWord) {
        User user = requireUser(userId);
        UserPuzzleSession session = sessionRepository.findByUserIdAndPuzzleId(userId, puzzleId)
                .orElseThrow(() -> new ValidationException("Active puzzle session not found. Start session first."));

        if (session.isCompleted()) {
            throw new ValidationException("Puzzle already completed.");
        }

        String word = wordNormalizer.normalize(rawWord).map(wordNormalizer::toDisplay).orElse("");
        if (word.isEmpty()) {
            return SubmitWordResponse.builder().valid(false).duplicate(false).points(0).build();
        }

        // Always copy — JPA converter / empty defaults may yield immutable lists
        List<String> found = new ArrayList<>(
                session.getWordsFound() != null ? session.getWordsFound() : List.of());
        session.setWordsFound(found);

        // #region agent log
        try {
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                    "{\"sessionId\":\"156feb\",\"runId\":\"post-fix\",\"hypothesisId\":\"E\",\"location\":\"PuzzleService.submitWord\",\"message\":\"Mutable wordsFound ready\",\"data\":{\"listClass\":\""
                            + found.getClass().getName()
                            + "\",\"size\":" + found.size()
                            + ",\"wordLen\":" + word.length()
                            + "},\"timestamp\":" + System.currentTimeMillis() + "}\n",
                    java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
        // #endregion

        if (found.stream().anyMatch(w -> w.equalsIgnoreCase(word))) {
            return SubmitWordResponse.builder().valid(false).duplicate(true).points(0).build();
        }

        Puzzle puzzle = session.getPuzzle();
        List<Character> letterPool = puzzle.getLetters().stream()
                .map(s -> s.charAt(0))
                .collect(Collectors.toList());

        boolean letterOk = puzzleValidator.matchesLetterRules(word, letterPool, puzzle.getCenterLetter().charAt(0));
        // Authoritative: PuzzleWord snapshot (fallback to legacy validWords TEXT for older rows)
        boolean inPuzzle = puzzleWordSnapshotService.isPlayableWord(puzzle.getId(), word)
                || playableWordSet(puzzle).contains(word);

        if (!letterOk || !inPuzzle) {
            boolean retain = cardBonusEvaluator.shouldRetainStreakOnFailure(user.getEquippedCardId(), 1);
            if (!retain) {
                session.setCurrentStreak(0);
            }
            sessionRepository.save(session);
            return SubmitWordResponse.builder().valid(false).duplicate(false).points(0).build();
        }

        boolean isPangram = puzzleWordSnapshotService.isPangramSnapshot(puzzle.getId(), word)
                || (puzzle.getPangrams() != null
                && puzzle.getPangrams().stream().anyMatch(p -> p.equalsIgnoreCase(word)))
                || puzzleValidator.isPangram(word, letterPool);

        int points = scoreCalculator.calculateWordPoints(
                word, isPangram, session.getCurrentStreak(), user.getEquippedCardId(), puzzle.getCenterLetter().charAt(0));

        found.add(word);
        session.setCurrentScore(session.getCurrentScore() + points + (isPangram ? 75 : 0));
        session.setCurrentStreak(session.getCurrentStreak() + 1);

        int xpAwarded = 0;
        int coinsAwarded = 0;
        int required = requiredWords(puzzle);
        if (found.size() >= required) {
            int[] rewards = completeSession(session, user);
            xpAwarded = rewards[0];
            coinsAwarded = rewards[1];
        }

        sessionRepository.save(session);
        userRepository.save(user);
        achievementService.evaluateAndUnlock(userId);

        return SubmitWordResponse.builder()
                .valid(true)
                .duplicate(false)
                .points(points)
                .isPangram(isPangram)
                .completed(session.isCompleted())
                .xpAwarded(xpAwarded)
                .coinsAwarded(coinsAwarded)
                .totalXp(user.getXp())
                .totalCoins(user.getCoins())
                .belt(user.getBelt())
                .build();
    }

    @Transactional
    public String revealHint(UUID userId, UUID puzzleId) {
        User user = requireUser(userId);
        UserPuzzleSession session = sessionRepository.findByUserIdAndPuzzleId(userId, puzzleId)
                .orElseThrow(() -> new ValidationException("Session not found"));

        if (session.isCompleted()) {
            throw new ValidationException("Puzzle is already completed.");
        }

        int hinted = session.getHintedWords() == null ? 0 : session.getHintedWords().size();
        if (hinted >= GameEconomy.MAX_PAID_HINTS_PER_PUZZLE + GameEconomy.FREE_DAILY_HINTS) {
            throw new ValidationException("Hint limit reached for this puzzle.");
        }

        boolean freeHints = "dragon_warrior_po".equals(user.getEquippedCardId())
                || "Oogway_legendary".equals(user.getEquippedCardId());
        if (!freeHints) {
            if (user.getCoins() < GameEconomy.HINT_COST_COINS) {
                throw new ValidationException("Not enough coins for a hint");
            }
            user.setCoins(user.getCoins() - GameEconomy.HINT_COST_COINS);
        }

        List<String> hintedWords = new ArrayList<>(
                session.getHintedWords() != null ? session.getHintedWords() : List.of());
        session.setHintedWords(hintedWords);
        Set<String> found = new HashSet<>(session.getWordsFound() != null ? session.getWordsFound() : List.of());

        List<String> remaining = playableWordSet(session.getPuzzle()).stream()
                .filter(w -> !found.contains(w) && hintedWords.stream().noneMatch(h -> h.equalsIgnoreCase(w)))
                .collect(Collectors.toList());
        if (remaining.isEmpty()) {
            remaining = puzzleWordSnapshotService.displayWords(session.getPuzzle().getId()).stream()
                    .filter(w -> !found.contains(w) && hintedWords.stream().noneMatch(h -> h.equalsIgnoreCase(w)))
                    .collect(Collectors.toList());
        }

        if (remaining.isEmpty()) {
            throw new ValidationException("No more hints available");
        }

        Collections.shuffle(remaining);
        String hint = remaining.get(0);
        hintedWords.add(hint);
        sessionRepository.save(session);
        userRepository.save(user);
        return hint;
    }

    // -------------------------------------------------------------------------

    private Puzzle resolveDailyPuzzle(LocalDate date) {
        // 1) Redis (immutable definition only)
        Optional<DailyPuzzleCacheDto> cached = dailyPuzzleCache.get(date);
        if (cached.isPresent()) {
            UUID id = cached.get().getPuzzleId();
            Optional<Puzzle> fromCache = puzzleRepository.findById(id);
            if (fromCache.isPresent()) {
                return fromCache.get();
            }
        }

        // 2) DailyPuzzle mapping
        Optional<DailyPuzzle> mapping = dailyPuzzleRepository.findByScheduledDateWithPuzzle(date);
        if (mapping.isEmpty()) {
            // 3) Assign / legacy migrate
            mapping = Optional.of(puzzleSchedulerJobs.assignDaily(date));
        }

        Puzzle puzzle = mapping.get().getPuzzle();
        dailyPuzzleCache.put(date, DailyPuzzleCacheDto.builder()
                .puzzleId(puzzle.getId())
                .difficulty(puzzle.getDifficulty().name())
                .letters(puzzle.getLetters())
                .centerLetter(puzzle.getCenterLetter())
                .minimumWordLength(puzzle.getMinimumWordLength())
                .targetWordCount(requiredWords(puzzle))
                .scheduledDate(date.toString())
                .xpReward(puzzle.getXpReward())
                .coinReward(puzzle.getCoinReward())
                .build());
        return puzzle;
    }

    private boolean isTodaysDaily(UUID puzzleId) {
        return dailyPuzzleRepository.findByScheduledDate(gameClock.today())
                .map(d -> d.getPuzzle().getId().equals(puzzleId))
                .orElseGet(() -> puzzleRepository.findByPuzzleDate(gameClock.today())
                        .map(p -> p.getId().equals(puzzleId))
                        .orElse(false));
    }

    private void ensureChoiceQuota(User user) {
        String todayKey = gameClock.today().toString();
        if (!todayKey.equals(user.getChoicePuzzlesDate())) {
            user.setChoicePuzzlesDate(todayKey);
            user.setChoicePuzzlesCompletedToday(0);
        }
        if (user.getChoicePuzzlesCompletedToday() >= GameEconomy.MAX_CHOICE_PUZZLES_PER_DAY) {
            throw new ValidationException("Daily choice puzzle quota reached.");
        }
    }

    private int[] completeSession(UserPuzzleSession session, User user) {
        if (session.isCompleted()) {
            return new int[]{0, 0}; // idempotent
        }
        session.setCompleted(true);
        session.setCompletedAt(LocalDateTime.now());

        Puzzle puzzle = session.getPuzzle();
        int baseXp = puzzle.getXpReward();
        int baseCoins = puzzle.getCoinReward();

        int rewardXp = cardBonusEvaluator.applyXpModifier(baseXp, user.getEquippedCardId(), puzzle.getDifficulty());
        int rewardCoins = cardBonusEvaluator.applyCoinModifier(baseCoins, user.getEquippedCardId(), 0);

        user.setXp(user.getXp() + rewardXp);
        user.setCoins(user.getCoins() + rewardCoins);
        user.getStats().setPuzzlesCompleted(user.getStats().getPuzzlesCompleted() + 1);
        user.getStats().setWordsFound(
                user.getStats().getWordsFound() + session.getWordsFound().size());
        if (session.getCurrentScore() > user.getStats().getHighestScore()) {
            user.getStats().setHighestScore(session.getCurrentScore());
        }

        if (!isTodaysDaily(puzzle.getId())) {
            String todayKey = gameClock.today().toString();
            if (!todayKey.equals(user.getChoicePuzzlesDate())) {
                user.setChoicePuzzlesDate(todayKey);
                user.setChoicePuzzlesCompletedToday(0);
            }
            user.setChoicePuzzlesCompletedToday(user.getChoicePuzzlesCompletedToday() + 1);
        } else {
            user.setLastPuzzleDate(gameClock.today().toString());
        }

        var progress = progressionService.resolve(user.getXp());
        user.setBelt(progress.belt());
        user.setLevel(progress.dojoLevel());

        leaderboardService.updateScore(user.getUsername(), user.getXp());
        cardService.consumeEquippedCharge(user.getId());
        return new int[]{rewardXp, rewardCoins};
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));
    }

    private static Set<String> playableWordSet(Puzzle puzzle) {
        if (puzzle.getValidWords() == null) return Set.of();
        return puzzle.getValidWords().stream()
                .map(w -> w.toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }

    private int requiredWords(Puzzle puzzle) {
        // Always use canonical difficulty rules (Easy 10 / Medium 15 / Hard 20 / Expert 25).
        // Stored targetWordCount may be stale (legacy = validWords.size()) and must not override rules.
        int canonical = switch (puzzle.getDifficulty()) {
            case EASY -> GameEconomy.difficulty("Easy").targetWords();
            case MEDIUM -> GameEconomy.difficulty("Medium").targetWords();
            case HARD -> GameEconomy.difficulty("Hard").targetWords();
            case EXPERT -> GameEconomy.difficulty("Expert").targetWords();
        };
        int snapshotCount = (int) puzzleWordSnapshotService.countWords(puzzle.getId());
        int legacyCount = puzzle.getValidWords() == null ? 0 : puzzle.getValidWords().size();
        int total = Math.max(snapshotCount, legacyCount);
        int required = total > 0 ? Math.min(canonical, total) : canonical;

        // #region agent log
        try {
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                    "{\"sessionId\":\"156feb\",\"runId\":\"post-fix\",\"hypothesisId\":\"T\",\"location\":\"PuzzleService.requiredWords\",\"message\":\"Canonical target applied\",\"data\":{\"difficulty\":\""
                            + puzzle.getDifficulty()
                            + "\",\"storedTarget\":" + puzzle.getTargetWordCount()
                            + ",\"canonical\":" + canonical
                            + ",\"snapshotCount\":" + snapshotCount
                            + ",\"legacyCount\":" + legacyCount
                            + ",\"required\":" + required
                            + "},\"timestamp\":" + System.currentTimeMillis() + "}\n",
                    java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
        // #endregion

        return required;
    }

    private int safePangramCount(Puzzle puzzle) {
        if (puzzle.getPangramCount() > 0) {
            return puzzle.getPangramCount();
        }
        return puzzle.getPangrams() == null ? 0 : puzzle.getPangrams().size();
    }

    private PuzzlePlayDto toPlayDto(Puzzle puzzle, LocalDate scheduledDate, boolean daily) {
        return PuzzlePlayDto.builder()
                .id(puzzle.getId())
                .difficulty(puzzle.getDifficulty())
                .letters(puzzle.getLetters())
                .centerLetter(puzzle.getCenterLetter())
                .minimumWordLength(puzzle.getMinimumWordLength() > 0
                        ? puzzle.getMinimumWordLength()
                        : GameEconomy.MIN_WORD_LENGTH)
                .targetWordCount(requiredWords(puzzle))
                .pangramCount(safePangramCount(puzzle))
                .xpReward(puzzle.getXpReward())
                .coinReward(puzzle.getCoinReward())
                .scheduledDate(scheduledDate)
                .daily(daily)
                .build();
    }

    private PuzzleProgressDto toProgressDto(UserPuzzleSession session, Puzzle puzzle) {
        if (session == null) {
            return PuzzleProgressDto.builder()
                    .status("NOT_STARTED")
                    .completed(false)
                    .foundWords(List.of())
                    .score(0)
                    .streak(0)
                    .hintsUsed(0)
                    .wordsFoundCount(0)
                    .targetWordCount(requiredWords(puzzle))
                    .build();
        }
        String status = session.isCompleted() ? "COMPLETED" : "IN_PROGRESS";
        List<String> found = session.getWordsFound() != null ? session.getWordsFound() : List.of();
        int hints = session.getHintedWords() != null ? session.getHintedWords().size() : 0;
        return PuzzleProgressDto.builder()
                .status(status)
                .completed(session.isCompleted())
                .foundWords(found)
                .score(session.getCurrentScore())
                .streak(session.getCurrentStreak())
                .hintsUsed(hints)
                .wordsFoundCount(found.size())
                .targetWordCount(requiredWords(puzzle))
                .startedAt(session.getCreatedAt())
                .completedAt(session.getCompletedAt())
                .build();
    }
}
