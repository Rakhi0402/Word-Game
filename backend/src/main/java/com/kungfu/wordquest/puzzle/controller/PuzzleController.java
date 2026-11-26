package com.kungfu.wordquest.puzzle.controller;

import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.puzzle.dto.PuzzlePlayDto;
import com.kungfu.wordquest.puzzle.dto.PuzzleViewResponse;
import com.kungfu.wordquest.puzzle.dto.SubmitWordResponse;
import com.kungfu.wordquest.puzzle.dto.SyncProgressRequest;
import com.kungfu.wordquest.puzzle.dto.SyncProgressResponse;
import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.service.PuzzleService;
import com.kungfu.wordquest.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/puzzles")
@RequiredArgsConstructor
public class PuzzleController {

    private final PuzzleService puzzleService;

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<PuzzleViewResponse>> getDailyPuzzle(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        PuzzleViewResponse view = puzzleService.getDailyPuzzle(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Daily puzzle loaded successfully", view));
    }

    /** Difficulty pool retrieval — EASY | MEDIUM | HARD | EXPERT. */
    @GetMapping
    public ResponseEntity<ApiResponse<PuzzleViewResponse>> getByDifficulty(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String difficulty) {
        PuzzleDifficulty d = parseDifficulty(difficulty);
        PuzzleViewResponse view = puzzleService.getByDifficulty(userDetails.getId(), d);
        return ResponseEntity.ok(ApiResponse.success("Puzzle loaded successfully", view));
    }

    /**
     * Warm-cache pool: up to 10 puzzle definitions (with word lists) per difficulty for IDB.
     */
    @GetMapping("/pool")
    public ResponseEntity<ApiResponse<List<PuzzlePlayDto>>> getPool(
            @RequestParam String difficulty,
            @RequestParam(defaultValue = "10") int limit) {
        PuzzleDifficulty d = parseDifficulty(difficulty);
        return ResponseEntity.ok(ApiResponse.success(
                "Puzzle pool",
                puzzleService.getPuzzlePool(d, limit)));
    }

    @PostMapping("/session/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startSession(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long puzzleId) {
        UserPuzzleSession session = puzzleService.startSession(userDetails.getId(), puzzleId);
        return ResponseEntity.ok(ApiResponse.success(
                "Session started successfully",
                Map.of(
                        "sessionId", session.getId(),
                        "puzzleId", puzzleId,
                        "completed", session.isCompleted(),
                        "score", session.getCurrentScore(),
                        "wordsFound", session.getWordsFound() != null ? session.getWordsFound() : java.util.List.of()
                )));
    }

    @PostMapping("/session/submit")
    public ResponseEntity<ApiResponse<SubmitWordResponse>> submitWord(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long puzzleId,
            @RequestParam String word) {
        SubmitWordResponse response = puzzleService.submitWord(userDetails.getId(), puzzleId, word);
        return ResponseEntity.ok(ApiResponse.success("Word submitted", response));
    }

    /** Batch sync after local Spelling Bee–style play. */
    @PostMapping("/session/sync")
    public ResponseEntity<ApiResponse<SyncProgressResponse>> syncProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SyncProgressRequest request) {
        SyncProgressResponse response = puzzleService.syncProgress(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Progress synced", response));
    }

    /** Alias: POST /api/v1/puzzles/{puzzleId}/words */
    @PostMapping("/{puzzleId}/words")
    public ResponseEntity<ApiResponse<SubmitWordResponse>> submitWordBody(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long puzzleId,
            @RequestBody Map<String, String> body) {
        String word = body != null ? body.getOrDefault("word", "") : "";
        SubmitWordResponse response = puzzleService.submitWord(userDetails.getId(), puzzleId, word);
        return ResponseEntity.ok(ApiResponse.success("Word submitted", response));
    }

    @PostMapping("/session/hint")
    public ResponseEntity<ApiResponse<String>> revealHint(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam Long puzzleId) {
        String hint = puzzleService.revealHint(userDetails.getId(), puzzleId);
        return ResponseEntity.ok(ApiResponse.success("Hint generated", hint));
    }

    @PostMapping("/{puzzleId}/hints")
    public ResponseEntity<ApiResponse<String>> revealHintPath(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long puzzleId) {
        String hint = puzzleService.revealHint(userDetails.getId(), puzzleId);
        return ResponseEntity.ok(ApiResponse.success("Hint generated", hint));
    }

    private static PuzzleDifficulty parseDifficulty(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("difficulty is required");
        }
        String n = raw.trim().toUpperCase(Locale.ROOT);
        return switch (n) {
            case "EASY", "MEDIUM", "HARD", "EXPERT" -> PuzzleDifficulty.valueOf(n);
            default -> throw new IllegalArgumentException("Unsupported difficulty: " + raw);
        };
    }
}
