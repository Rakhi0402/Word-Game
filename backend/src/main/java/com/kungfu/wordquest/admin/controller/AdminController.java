package com.kungfu.wordquest.admin.controller;

import com.kungfu.wordquest.admin.dto.*;
import com.kungfu.wordquest.admin.service.AdminService;
import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.dictionary.DictionaryImportProgress;
import com.kungfu.wordquest.dictionary.DictionaryImportResult;
import com.kungfu.wordquest.reward.entity.Achievement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> overview() {
        return ResponseEntity.ok(ApiResponse.success("Admin overview", adminService.overview()));
    }

    // ----- Users -----

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserSummary>>> listUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Users", adminService.listUsers(q, page, size)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDetail>> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User", adminService.getUser(id)));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDetail>> patchUser(
            @PathVariable UUID id,
            @RequestBody AdminUserPatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated", adminService.patchUser(id, request)));
    }

    // ----- Puzzles -----

    @GetMapping("/puzzles")
    public ResponseEntity<ApiResponse<PageResponse<AdminPuzzleSummary>>> listPuzzles(
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponse.success("Puzzles", adminService.listPuzzles(difficulty, page, size)));
    }

    @GetMapping("/puzzles/{id}")
    public ResponseEntity<ApiResponse<AdminPuzzleDetail>> getPuzzle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Puzzle", adminService.getPuzzle(id)));
    }

    @PostMapping("/puzzles/generate")
    public ResponseEntity<ApiResponse<AdminPuzzleDetail>> generatePuzzle(
            @RequestParam String difficulty) {
        return ResponseEntity.ok(
                ApiResponse.success("Puzzle generated", adminService.generatePuzzle(difficulty)));
    }

    @GetMapping("/puzzles/ai-status")
    public ResponseEntity<ApiResponse<AdminAiStatusResponse>> aiStatus() {
        return ResponseEntity.ok(ApiResponse.success("AI generation status", adminService.aiStatus()));
    }

    @PostMapping("/puzzles/generate-ai")
    public ResponseEntity<ApiResponse<AdminAiGenerateResponse>> generatePuzzlesWithAi(
            @RequestParam String difficulty,
            @RequestParam(defaultValue = "5") int count) {
        return ResponseEntity.ok(ApiResponse.success(
                "AI puzzle generation finished",
                adminService.generatePuzzlesWithAi(difficulty, count)));
    }

    @PatchMapping("/puzzles/{id}/active")
    public ResponseEntity<ApiResponse<AdminPuzzleDetail>> setActive(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        return ResponseEntity.ok(
                ApiResponse.success("Puzzle updated", adminService.setPuzzleActive(id, active)));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<AdminDailyResponse>> getDaily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success("Daily puzzle", adminService.getDaily(date)));
    }

    @PostMapping("/daily/assign")
    public ResponseEntity<ApiResponse<AdminDailyResponse>> assignDaily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long puzzleId) {
        return ResponseEntity.ok(
                ApiResponse.success("Daily assigned", adminService.assignDaily(date, puzzleId)));
    }

    // ----- Cards -----

    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<List<Card>>> listCards() {
        return ResponseEntity.ok(ApiResponse.success("Cards", adminService.listCards()));
    }

    @PostMapping("/cards")
    public ResponseEntity<ApiResponse<Card>> createCard(@Valid @RequestBody AdminCardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Card created", adminService.createCard(request)));
    }

    @PutMapping("/cards/{id}")
    public ResponseEntity<ApiResponse<Card>> updateCard(
            @PathVariable String id,
            @Valid @RequestBody AdminCardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Card updated", adminService.updateCard(id, request)));
    }

    // ----- Achievements -----

    @GetMapping("/achievements")
    public ResponseEntity<ApiResponse<List<Achievement>>> listAchievements() {
        return ResponseEntity.ok(ApiResponse.success("Achievements", adminService.listAchievements()));
    }

    @PostMapping("/achievements")
    public ResponseEntity<ApiResponse<Achievement>> createAchievement(
            @Valid @RequestBody AdminAchievementRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Achievement created", adminService.createAchievement(request)));
    }

    @PutMapping("/achievements/{id}")
    public ResponseEntity<ApiResponse<Achievement>> updateAchievement(
            @PathVariable String id,
            @Valid @RequestBody AdminAchievementRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Achievement updated", adminService.updateAchievement(id, request)));
    }

    // ----- Dictionary -----

    @GetMapping("/dictionary/stats")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> dictionaryStats() {
        return ResponseEntity.ok(ApiResponse.success("Dictionary stats", adminService.dictionaryStats()));
    }

    /** Starts chunked background import — returns immediately. Poll {@code /dictionary/import/status}. */
    @PostMapping("/dictionary/import")
    public ResponseEntity<ApiResponse<DictionaryImportProgress>> importDictionary() {
        return ResponseEntity.ok(
                ApiResponse.success("Dictionary import started", adminService.startDictionaryImport()));
    }

    @GetMapping("/dictionary/import/status")
    public ResponseEntity<ApiResponse<DictionaryImportProgress>> importStatus() {
        return ResponseEntity.ok(
                ApiResponse.success("Dictionary import status", adminService.dictionaryImportStatus()));
    }

    /** Optional blocking import (CLI/debug). Prefer async {@code POST /dictionary/import}. */
    @PostMapping("/dictionary/import/sync")
    public ResponseEntity<ApiResponse<DictionaryImportResult>> importDictionarySync() {
        return ResponseEntity.ok(
                ApiResponse.success("Dictionary import finished", adminService.importDictionary()));
    }
}
