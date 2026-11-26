package com.kungfu.wordquest.puzzle;

import com.kungfu.wordquest.card.service.CardService;
import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
import com.kungfu.wordquest.dictionary.WordNormalizer;
import com.kungfu.wordquest.economy.ProgressionService;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.puzzle.cache.DailyPuzzleCacheService;
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
import com.kungfu.wordquest.puzzle.service.PuzzleService;
import com.kungfu.wordquest.puzzle.time.GameClock;
import com.kungfu.wordquest.reward.service.AchievementService;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PuzzleServiceTest {

    @Mock PuzzleRepository puzzleRepository;
    @Mock DailyPuzzleRepository dailyPuzzleRepository;
    @Mock UserPuzzleSessionRepository sessionRepository;
    @Mock UserRepository userRepository;
    @Mock PuzzleValidator puzzleValidator;
    @Mock ScoreCalculator scoreCalculator;
    @Mock CardBonusEvaluator cardBonusEvaluator;
    @Mock LeaderboardService leaderboardService;
    @Mock AchievementService achievementService;
    @Mock CardService cardService;
    @Mock ProgressionService progressionService;
    @Mock DailyPuzzleCacheService dailyPuzzleCache;
    @Mock GameClock gameClock;
    @Mock PuzzleSchedulerJobs puzzleSchedulerJobs;
    @Mock PuzzleWordSnapshotService puzzleWordSnapshotService;
    @Spy WordNormalizer wordNormalizer = new WordNormalizer();

    @InjectMocks PuzzleService puzzleService;

    private UUID userId;
    private User user;
    private Puzzle puzzle;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        today = LocalDate.of(2026, 8, 10);
        user = User.builder()
                .id(userId)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .xp(0)
                .coins(200)
                .stats(UserStats.builder().build())
                .build();
        puzzle = Puzzle.builder()
                .id(1L)
                .letters(List.of("A", "D", "N", "P", "S", "T", "G"))
                .centerLetter("A")
                .validWords(List.of("PANDA", "SAND", "SPAN", "SNAP", "PAST", "SPAT", "PANS", "PATS", "NAPS", "TAGS"))
                .pangrams(List.of())
                .difficulty(PuzzleDifficulty.EASY)
                .targetWordCount(10)
                .minimumWordLength(4)
                .xpReward(100)
                .coinReward(30)
                .active(true)
                .build();
        lenient().when(gameClock.today()).thenReturn(today);
    }

    @Test
    void getDaily_returnsDtoWithoutNeedingValidWordsOnWire() {
        when(dailyPuzzleCache.get(today)).thenReturn(Optional.empty());
        when(dailyPuzzleRepository.findByScheduledDateWithPuzzle(today)).thenReturn(Optional.of(
                DailyPuzzle.builder().id(UUID.randomUUID()).puzzle(puzzle).scheduledDate(today).build()));
        when(sessionRepository.findByUserIdAndPuzzleId(userId, puzzle.getId())).thenReturn(Optional.empty());

        PuzzleViewResponse view = puzzleService.getDailyPuzzle(userId);

        assertEquals(puzzle.getId(), view.getPuzzle().getId());
        assertEquals(PuzzleDifficulty.EASY, view.getPuzzle().getDifficulty());
        assertEquals("NOT_STARTED", view.getProgress().getStatus());
        verify(dailyPuzzleCache).put(eq(today), any());
    }

    @Test
    void submit_rejectsWordNotInPersistedPlayableSet() {
        UserPuzzleSession session = UserPuzzleSession.builder()
                .id(UUID.randomUUID())
                .user(user)
                .puzzle(puzzle)
                .wordsFound(new ArrayList<>())
                .hintedWords(new ArrayList<>())
                .currentScore(0)
                .currentStreak(0)
                .completed(false)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(sessionRepository.findByUserIdAndPuzzleId(userId, puzzle.getId())).thenReturn(Optional.of(session));
        when(puzzleValidator.matchesLetterRules(eq("XXXX"), anyList(), eq('A'))).thenReturn(true);
        when(puzzleWordSnapshotService.isPlayableWord(eq(puzzle.getId()), eq("XXXX"))).thenReturn(false);

        SubmitWordResponse res = puzzleService.submitWord(userId, puzzle.getId(), "XXXX");

        assertFalse(res.isValid());
        assertTrue(session.getWordsFound().isEmpty());
    }

    @Test
    void submit_acceptsPlayableWordOnce() {
        UserPuzzleSession session = UserPuzzleSession.builder()
                .id(UUID.randomUUID())
                .user(user)
                .puzzle(puzzle)
                .wordsFound(new ArrayList<>())
                .hintedWords(new ArrayList<>())
                .currentScore(0)
                .currentStreak(0)
                .completed(false)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(sessionRepository.findByUserIdAndPuzzleId(userId, puzzle.getId())).thenReturn(Optional.of(session));
        when(puzzleValidator.matchesLetterRules(eq("PANDA"), anyList(), eq('A'))).thenReturn(true);
        when(puzzleWordSnapshotService.isPlayableWord(eq(puzzle.getId()), eq("PANDA"))).thenReturn(true);
        when(puzzleWordSnapshotService.isPangramSnapshot(eq(puzzle.getId()), eq("PANDA"))).thenReturn(false);
        when(puzzleValidator.isPangram(eq("PANDA"), anyList())).thenReturn(false);
        when(scoreCalculator.calculateWordPoints(eq("PANDA"), eq(false), eq(0), any(), eq('A'))).thenReturn(50);

        SubmitWordResponse first = puzzleService.submitWord(userId, puzzle.getId(), "panda");
        assertTrue(first.isValid());
        assertEquals(50, first.getPoints());

        SubmitWordResponse dup = puzzleService.submitWord(userId, puzzle.getId(), "PANDA");
        assertTrue(dup.isDuplicate());
        assertFalse(dup.isValid());
    }

    @Test
    void getByDifficulty_includesExpert() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        Puzzle expert = Puzzle.builder()
                .id(2L)
                .letters(List.of("B", "L", "A", "C", "K", "E", "T"))
                .centerLetter("A")
                .validWords(List.of("BLACK", "TABLE", "BLANKET", "CABLE", "LAKE", "BAKE", "CAKE", "TALE", "LATE", "BEAT",
                        "ABLE", "BALE", "LACE", "TACK", "BEATEN", "BLANKETS", "CABLET", "BLACKTEA", "BLEAK", "CAKE"))
                .pangrams(List.of("BLANKET"))
                .difficulty(PuzzleDifficulty.EXPERT)
                .targetWordCount(25)
                .xpReward(250)
                .coinReward(100)
                .active(true)
                .build();
        when(puzzleRepository.findPlayableByDifficultyForUser(PuzzleDifficulty.EXPERT, userId))
                .thenReturn(List.of(expert));
        when(sessionRepository.findByUserIdAndPuzzleId(userId, expert.getId())).thenReturn(Optional.empty());

        PuzzleViewResponse view = puzzleService.getByDifficulty(userId, PuzzleDifficulty.EXPERT);
        assertEquals(PuzzleDifficulty.EXPERT, view.getPuzzle().getDifficulty());
    }
}
