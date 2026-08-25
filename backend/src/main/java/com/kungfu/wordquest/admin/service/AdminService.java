package com.kungfu.wordquest.admin.service;

import com.kungfu.wordquest.admin.dto.*;
import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.ResourceNotFoundException;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.dictionary.DictionaryImportResult;
import com.kungfu.wordquest.dictionary.DictionaryImportService;
import com.kungfu.wordquest.dictionary.DictionaryProperties;
import com.kungfu.wordquest.dictionary.DictionaryService;
import com.kungfu.wordquest.puzzle.cache.DailyPuzzleCacheService;
import com.kungfu.wordquest.puzzle.engine.PuzzleGenerationService;
import com.kungfu.wordquest.puzzle.entity.DailyPuzzle;
import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import com.kungfu.wordquest.puzzle.repository.DailyPuzzleRepository;
import com.kungfu.wordquest.puzzle.repository.PuzzleRepository;
import com.kungfu.wordquest.puzzle.time.GameClock;
import com.kungfu.wordquest.reward.entity.Achievement;
import com.kungfu.wordquest.reward.repository.AchievementRepository;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PuzzleRepository puzzleRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final CardRepository cardRepository;
    private final AchievementRepository achievementRepository;
    private final PuzzleGenerationService puzzleGenerationService;
    private final DailyPuzzleCacheService dailyPuzzleCache;
    private final DictionaryService dictionaryService;
    private final DictionaryImportService dictionaryImportService;
    private final DictionaryProperties dictionaryProperties;
    private final GameClock gameClock;

    // ---------- Overview ----------

    @Transactional(readOnly = true)
    public AdminOverviewResponse overview() {
        LocalDate today = gameClock.today();
        var daily = dailyPuzzleRepository.findByScheduledDateWithPuzzle(today);
        return AdminOverviewResponse.builder()
                .userCount(userRepository.count())
                .adminCount(userRepository.countByRole(UserRole.ROLE_ADMIN))
                .puzzleCount(puzzleRepository.count())
                .activePuzzleCount(puzzleRepository.findByActiveTrue().size())
                .todayDailyPuzzleId(daily.map(d -> d.getPuzzle().getId().toString()).orElse(null))
                .todayDailyDate(today.toString())
                .dictionaryAllowedCount(dictionaryService.allowedCount())
                .dictionarySourceVersion(dictionaryProperties.getSourceVersion())
                .build();
    }

    // ---------- Users ----------

    @Transactional(readOnly = true)
    public PageResponse<AdminUserSummary> listUsers(String q, int page, int size) {
        Page<User> result = userRepository.searchAdminUsers(
                q == null ? "" : q.trim(),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)));
        return toPage(result.map(this::toUserSummary));
    }

    @Transactional(readOnly = true)
    public AdminUserDetail getUser(UUID id) {
        User user = userRepository.findWithStatsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));
        return toUserDetail(user);
    }

    @Transactional
    public AdminUserDetail patchUser(UUID id, AdminUserPatchRequest request) {
        User user = userRepository.findWithStatsById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        boolean revokeTokens = false;
        if (StringUtils.hasText(request.getRole())) {
            UserRole role = parseRole(request.getRole());
            if (user.getRole() != role) {
                user.setRole(role);
                revokeTokens = true;
            }
        }
        if (request.getEnabled() != null && user.isEnabled() != request.getEnabled()) {
            user.setEnabled(request.getEnabled());
            revokeTokens = true;
        }
        if (request.getLocked() != null && user.isLocked() != request.getLocked()) {
            user.setLocked(request.getLocked());
            revokeTokens = true;
        }
        if (revokeTokens) {
            user.setTokenVersion(user.getTokenVersion() + 1);
        }
        userRepository.save(user);
        return toUserDetail(user);
    }

    // ---------- Puzzles ----------

    @Transactional(readOnly = true)
    public PageResponse<AdminPuzzleSummary> listPuzzles(String difficulty, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        Page<Puzzle> result;
        if (StringUtils.hasText(difficulty)) {
            result = puzzleRepository.findByDifficulty(parseDifficulty(difficulty), pr);
        } else {
            result = puzzleRepository.findAll(pr);
        }
        return toPage(result.map(this::toPuzzleSummary));
    }

    @Transactional(readOnly = true)
    public AdminPuzzleDetail getPuzzle(UUID id) {
        Puzzle puzzle = puzzleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PUZZLE_NOT_FOUND, "Puzzle not found"));
        return toPuzzleDetail(puzzle);
    }

    @Transactional
    public AdminPuzzleDetail generatePuzzle(String difficulty) {
        PuzzleDifficulty d = parseDifficulty(difficulty);
        String batch = "admin-" + gameClock.today() + "-" + UUID.randomUUID().toString().substring(0, 8);
        int created = puzzleGenerationService.generateForDifficulty(d, 1, batch);
        if (created < 1) {
            throw new ValidationException("Could not generate a puzzle for " + d + ". Check dictionary size.");
        }
        Puzzle latest = puzzleRepository.findUnscheduledPoolByDifficulty(d).stream()
                .filter(p -> batch.equals(p.getGenerationBatchId()))
                .findFirst()
                .orElseGet(() -> puzzleRepository.findByDifficulty(d).stream()
                        .filter(p -> batch.equals(p.getGenerationBatchId()))
                        .findFirst()
                        .orElseThrow(() -> new ValidationException("Generated puzzle not found")));
        return toPuzzleDetail(latest);
    }

    @Transactional
    public AdminPuzzleDetail setPuzzleActive(UUID id, boolean active) {
        Puzzle puzzle = puzzleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PUZZLE_NOT_FOUND, "Puzzle not found"));
        puzzle.setActive(active);
        puzzleRepository.save(puzzle);
        return toPuzzleDetail(puzzle);
    }

    @Transactional(readOnly = true)
    public AdminDailyResponse getDaily(LocalDate date) {
        LocalDate d = date != null ? date : gameClock.today();
        DailyPuzzle daily = dailyPuzzleRepository.findByScheduledDateWithPuzzle(d)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.PUZZLE_NOT_FOUND, "No daily puzzle for " + d));
        return toDaily(daily);
    }

    @Transactional
    public AdminDailyResponse assignDaily(LocalDate date, UUID puzzleId) {
        LocalDate d = date != null ? date : gameClock.today();
        Puzzle puzzle = puzzleRepository.findById(puzzleId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PUZZLE_NOT_FOUND, "Puzzle not found"));
        if (!puzzle.isActive()) {
            throw new ValidationException("Cannot assign an inactive puzzle as daily.");
        }

        DailyPuzzle daily = dailyPuzzleRepository.findByScheduledDate(d).orElse(null);
        if (daily == null) {
            daily = DailyPuzzle.builder().scheduledDate(d).puzzle(puzzle).build();
        } else {
            daily.setPuzzle(puzzle);
        }
        puzzle.setPuzzleDate(d);
        puzzleRepository.save(puzzle);
        daily = dailyPuzzleRepository.save(daily);
        dailyPuzzleCache.evict(d);
        return toDaily(dailyPuzzleRepository.findByScheduledDateWithPuzzle(d).orElse(daily));
    }

    // ---------- Cards ----------

    @Transactional(readOnly = true)
    public List<Card> listCards() {
        return cardRepository.findAll();
    }

    @Transactional
    public Card createCard(AdminCardRequest request) {
        if (cardRepository.existsById(request.getId())) {
            throw new ValidationException("Card id already exists: " + request.getId());
        }
        return cardRepository.save(toCard(request));
    }

    @Transactional
    public Card updateCard(String id, AdminCardRequest request) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CARD_NOT_FOUND, "Card not found"));
        card.setName(request.getName());
        card.setRarity(request.getRarity());
        card.setImage(request.getImage());
        card.setStars(request.getStars());
        card.setDescription(request.getDescription());
        card.setBonuses(request.getBonuses());
        return cardRepository.save(card);
    }

    // ---------- Achievements ----------

    @Transactional(readOnly = true)
    public List<Achievement> listAchievements() {
        return achievementRepository.findAll();
    }

    @Transactional
    public Achievement createAchievement(AdminAchievementRequest request) {
        if (achievementRepository.existsById(request.getId())) {
            throw new ValidationException("Achievement id already exists: " + request.getId());
        }
        return achievementRepository.save(toAchievement(request));
    }

    @Transactional
    public Achievement updateAchievement(String id, AdminAchievementRequest request) {
        Achievement a = achievementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found"));
        a.setTitle(request.getTitle());
        a.setDescription(request.getDescription());
        a.setTarget(request.getTarget());
        a.setRewardXp(request.getRewardXp());
        a.setRewardCoins(request.getRewardCoins());
        a.setIconName(request.getIconName());
        return achievementRepository.save(a);
    }

    // ---------- Dictionary ----------

    @Transactional(readOnly = true)
    public AdminOverviewResponse dictionaryStats() {
        return AdminOverviewResponse.builder()
                .dictionaryAllowedCount(dictionaryService.allowedCount())
                .dictionarySourceVersion(dictionaryProperties.getSourceVersion())
                .build();
    }

    @Transactional
    public DictionaryImportResult importDictionary() {
        return dictionaryImportService.importFromConfiguredSource();
    }

    // ---------- mappers ----------

    private static UserRole parseRole(String raw) {
        String n = raw.trim().toUpperCase();
        if ("ADMIN".equals(n) || "ROLE_ADMIN".equals(n)) return UserRole.ROLE_ADMIN;
        if ("USER".equals(n) || "ROLE_USER".equals(n)) return UserRole.ROLE_USER;
        throw new ValidationException("Invalid role: " + raw);
    }

    private static PuzzleDifficulty parseDifficulty(String raw) {
        try {
            return PuzzleDifficulty.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw new ValidationException("Invalid difficulty: " + raw);
        }
    }

    private AdminUserSummary toUserSummary(User u) {
        return AdminUserSummary.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : UserRole.ROLE_USER.name())
                .belt(u.getBelt())
                .xp(u.getXp())
                .coins(u.getCoins())
                .enabled(u.isEnabled())
                .locked(u.isLocked())
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .build();
    }

    private AdminUserDetail toUserDetail(User u) {
        UserStats s = u.getStats();
        return AdminUserDetail.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : UserRole.ROLE_USER.name())
                .belt(u.getBelt())
                .xp(u.getXp())
                .coins(u.getCoins())
                .enabled(u.isEnabled())
                .locked(u.isLocked())
                .tokenVersion(u.getTokenVersion())
                .createdAt(u.getCreatedAt())
                .lastLogin(u.getLastLogin())
                .lastPlayed(u.getLastPlayed())
                .wordsFound(s != null ? s.getWordsFound() : null)
                .puzzlesCompleted(s != null ? s.getPuzzlesCompleted() : null)
                .cardsCollected(s != null ? s.getCardsCollected() : null)
                .achievementsEarned(s != null ? s.getAchievementsEarned() : null)
                .build();
    }

    private AdminPuzzleSummary toPuzzleSummary(Puzzle p) {
        return AdminPuzzleSummary.builder()
                .id(p.getId())
                .difficulty(p.getDifficulty().name())
                .letters(p.getLetters())
                .centerLetter(p.getCenterLetter())
                .targetWordCount(p.getTargetWordCount())
                .pangramCount(p.getPangramCount())
                .validWordCount(p.getValidWords() != null ? p.getValidWords().size() : 0)
                .active(p.isActive())
                .puzzleDate(p.getPuzzleDate())
                .fingerprint(p.getFingerprint())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private AdminPuzzleDetail toPuzzleDetail(Puzzle p) {
        return AdminPuzzleDetail.builder()
                .id(p.getId())
                .difficulty(p.getDifficulty().name())
                .letters(p.getLetters())
                .centerLetter(p.getCenterLetter())
                .minimumWordLength(p.getMinimumWordLength())
                .targetWordCount(p.getTargetWordCount())
                .pangramCount(p.getPangramCount())
                .xpReward(p.getXpReward())
                .coinReward(p.getCoinReward())
                .active(p.isActive())
                .puzzleDate(p.getPuzzleDate())
                .fingerprint(p.getFingerprint())
                .generationBatchId(p.getGenerationBatchId())
                .dictionarySourceVersion(p.getDictionarySourceVersion())
                .validWords(p.getValidWords())
                .pangrams(p.getPangrams())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private AdminDailyResponse toDaily(DailyPuzzle d) {
        Puzzle p = d.getPuzzle();
        return AdminDailyResponse.builder()
                .scheduledDate(d.getScheduledDate())
                .puzzleId(p.getId())
                .difficulty(p.getDifficulty().name())
                .letters(p.getLetters())
                .centerLetter(p.getCenterLetter())
                .active(p.isActive())
                .build();
    }

    private static Card toCard(AdminCardRequest r) {
        return Card.builder()
                .id(r.getId())
                .name(r.getName())
                .rarity(r.getRarity())
                .image(r.getImage())
                .stars(r.getStars())
                .description(r.getDescription())
                .bonuses(r.getBonuses())
                .build();
    }

    private static Achievement toAchievement(AdminAchievementRequest r) {
        return Achievement.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .target(r.getTarget())
                .rewardXp(r.getRewardXp())
                .rewardCoins(r.getRewardCoins())
                .iconName(r.getIconName())
                .build();
    }

    private static <T> PageResponse<T> toPage(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
