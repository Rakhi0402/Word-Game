package com.kungfu.wordquest.ai;

import com.kungfu.wordquest.admin.dto.AdminAiGenerateResponse;
import com.kungfu.wordquest.admin.dto.AdminPuzzleDetail;
import com.kungfu.wordquest.ai.dto.GroqLetterCandidate;
import com.kungfu.wordquest.ai.dto.GroqLetterProposalResponse;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.puzzle.engine.DifficultyGate;
import com.kungfu.wordquest.puzzle.engine.PuzzleGenerationService;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.time.GameClock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

/**
 * Groq proposes letter hives; open-source dictionary expands + validates every word (≥4 chars).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiPuzzleGenerationService {

    private final GroqClient groqClient;
    private final PuzzleGenerationService puzzleGenerationService;
    private final DifficultyGate difficultyGate;
    private final GameClock gameClock;

    public boolean isAiAvailable() {
        return groqClient.isAvailable();
    }

    @Transactional
    public AdminAiGenerateResponse generateWithAi(
            PuzzleDifficulty difficulty,
            int count,
            Function<Puzzle, AdminPuzzleDetail> toDetail) {
        puzzleGenerationService.requireDictionaryReady();
        int want = Math.max(1, Math.min(count, 20));
        String batch = "ai-groq-" + gameClock.today() + "-" + UUID.randomUUID().toString().substring(0, 8);

        List<AdminPuzzleDetail> created = new ArrayList<>();
        List<String> rejected = new ArrayList<>();

        // Prefer Groq letter sets; fill remainder with local random dictionary search.
        if (groqClient.isAvailable()) {
            try {
                GroqLetterProposalResponse proposal = groqClient.proposeLetterSets(difficulty, want);
                for (GroqLetterCandidate c : proposal.getCandidates()) {
                    if (created.size() >= want) {
                        break;
                    }
                    Optional<Puzzle> built = materializeCandidate(c, difficulty, batch);
                    if (built.isEmpty()) {
                        rejected.add(describeReject(c, "failed dictionary gate ("
                                + difficultyGate.describe(difficulty) + ")"));
                        continue;
                    }
                    Optional<Puzzle> saved = puzzleGenerationService.saveNewCandidate(built.get());
                    if (saved.isEmpty()) {
                        rejected.add(describeReject(c, "duplicate fingerprint"));
                        continue;
                    }
                    created.add(toDetail.apply(saved.get()));
                }
            } catch (ValidationException ex) {
                rejected.add("Groq: " + ex.getMessage());
            }
        } else {
            rejected.add("Groq not configured (GROQ_API_KEY); using local dictionary search only.");
        }

        int attempts = 0;
        int maxLocal = want * 80;
        while (created.size() < want && attempts < maxLocal) {
            attempts++;
            Puzzle candidate = puzzleGenerationService.tryGenerate(difficulty, batch);
            if (candidate == null) {
                continue;
            }
            Optional<Puzzle> saved = puzzleGenerationService.saveNewCandidate(candidate);
            saved.ifPresent(p -> created.add(toDetail.apply(p)));
        }

        if (created.isEmpty()) {
            throw new ValidationException(
                    "Could not create any " + difficulty + " puzzles. "
                            + difficultyGate.describe(difficulty)
                            + ". Rejected: " + String.join("; ", rejected.stream().limit(5).toList()));
        }

        log.info("AI/local generation batch {} created {}/{} {} puzzles ({} rejects)",
                batch, created.size(), want, difficulty, rejected.size());

        return AdminAiGenerateResponse.builder()
                .batchId(batch)
                .difficulty(difficulty.name())
                .requested(want)
                .created(created.size())
                .groqUsed(groqClient.isAvailable())
                .puzzles(created)
                .rejected(rejected)
                .build();
    }

    private Optional<Puzzle> materializeCandidate(
            GroqLetterCandidate c, PuzzleDifficulty difficulty, String batch) {
        if (c == null || c.getLetters() == null || c.getCenterLetter() == null
                || c.getCenterLetter().isBlank()) {
            return Optional.empty();
        }
        List<Character> letters = new ArrayList<>();
        for (String s : c.getLetters()) {
            if (s == null || s.isBlank()) {
                continue;
            }
            letters.add(Character.toUpperCase(s.trim().charAt(0)));
        }
        char center = Character.toUpperCase(c.getCenterLetter().trim().charAt(0));
        PuzzleDifficulty d = difficulty;
        if (c.getDifficulty() != null && !c.getDifficulty().isBlank()) {
            try {
                d = PuzzleDifficulty.valueOf(c.getDifficulty().trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                d = difficulty;
            }
        }
        // Force requested difficulty for admin batch consistency
        d = difficulty;
        return puzzleGenerationService.materializeFromLetters(letters, center, d, batch, false);
    }

    private static String describeReject(GroqLetterCandidate c, String reason) {
        String letters = c.getLetters() == null ? "?" : String.join("", c.getLetters());
        return letters + "/" + c.getCenterLetter() + ": " + reason;
    }
}
