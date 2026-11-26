package com.kungfu.wordquest.config;

import com.kungfu.wordquest.card.entity.Card;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.dictionary.DictionaryProperties;
import com.kungfu.wordquest.dictionary.PuzzleWordSnapshotService;
import com.kungfu.wordquest.economy.GameEconomy;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Seeds cards / sample puzzles / achievements before the (slow) dictionary import
 * so Home and Quest work immediately on a fresh database.
 */
@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements ApplicationRunner {

    private final CardRepository cardRepository;
    private final PuzzleRepository puzzleRepository;
    private final DailyPuzzleRepository dailyPuzzleRepository;
    private final AchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GameClock gameClock;
    private final PuzzleWordSnapshotService puzzleWordSnapshotService;
    private final DictionaryProperties dictionaryProperties;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${app.seed.local-admin:false}")
    private boolean localAdminSeed;

    @Override
    public void run(ApplicationArguments args) {
        seedCards();
        seedPuzzles();
        seedAchievements();
        seedLocalAdminIfNeeded();
    }

    /**
     * Dev-only fallback when env bootstrap is unset and no ROLE_ADMIN exists.
     * Credentials: admin@local.test / Admin123!
     */
    private void seedLocalAdminIfNeeded() {
        if (!localAdminSeed) {
            return;
        }
        if (StringUtils.hasText(adminEmail)) {
            return;
        }
        if (userRepository.countByRole(UserRole.ROLE_ADMIN) > 0) {
            return;
        }
        String email = "admin@local.test";
        if (userRepository.existsByEmailIgnoreCase(email)) {
            User existing = userRepository.findByEmailIgnoreCase(email).orElseThrow();
            existing.setRole(UserRole.ROLE_ADMIN);
            existing.setEnabled(true);
            existing.setLocked(false);
            existing.setTokenVersion(existing.getTokenVersion() + 1);
            userRepository.save(existing);
            log.warn("Promoted {} to ROLE_ADMIN (local seeder fallback)", email);
            return;
        }
        String encoded = passwordEncoder.encode("Admin123!");
        User admin = User.builder()
                .username("admin")
                .email(email)
                .passwordHash(encoded)
                .legacyPassword(encoded)
                .role(UserRole.ROLE_ADMIN)
                .coins(GameEconomy.STARTING_COINS)
                .enabled(true)
                .locked(false)
                .build();
        admin.setStats(UserStats.builder().user(admin).build());
        userRepository.save(admin);
        log.warn("Seeded local admin {} / Admin123! — do not use in production", email);
    }

    private void seedCards() {
        if (cardRepository.count() > 0) return;

        log.info("Seeding default character cards...");

        cardRepository.save(Card.builder()
                .id("po_common")
                .name("Po (Initiate)")
                .rarity("common")
                .image("/assets/card_pack/po_common.png")
                .stars(1)
                .description("A passionate panda who dreams of kung fu greatness. Slow but full of determination.")
                .bonuses(Arrays.asList("+10% Score bonus on Common Words", "+10 XP per Puzzle Completed", "+2 Streak Shield Tokens"))
                .build());

        cardRepository.save(Card.builder()
                .id("monkey_common")
                .name("Master Monkey")
                .rarity("common")
                .image("/assets/card_pack/monkey_common.png")
                .stars(1)
                .description("Playful, mischievous, and incredibly agile. Monkey uses speed and trickery to confuse foes.")
                .bonuses(Arrays.asList("+10 Submission Speed Bonus", "+5 Coins on 4-Letter Words", "+2 Streak Shield Tokens"))
                .build());

        cardRepository.save(Card.builder()
                .id("crane_common")
                .name("Master Crane")
                .rarity("common")
                .image("/assets/card_pack/crane_common.png")
                .stars(1)
                .description("Calm and steady. Crane utilizes defensive maneuvers to redirect enemy force with grace.")
                .bonuses(Arrays.asList("Hover Ability: Shuffles are free", "+10 XP on Easy Puzzles", "+2 Streak Shield Tokens"))
                .build());

        cardRepository.save(Card.builder()
                .id("mantis_rare")
                .name("Master Mantis")
                .rarity("rare")
                .image("/assets/card_pack/mantis_rare.png")
                .stars(3)
                .description("Small but mighty. Mantis strikes with absolute precision and blinding speed.")
                .bonuses(Arrays.asList("Pinpoint Strike: Double points for 5-letter words", "+20 XP per Puzzle Completed"))
                .build());

        cardRepository.save(Card.builder()
                .id("viper_rare")
                .name("Master Viper")
                .rarity("rare")
                .image("/assets/card_pack/viper_rare.png")
                .stars(3)
                .description("A compassionate dancer who fights with flexible and unpredictable strikes.")
                .bonuses(Arrays.asList("Coiled Defense: Retain streak on first invalid word", "+10 Coins per Puzzle Completed"))
                .build());

        cardRepository.save(Card.builder()
                .id("tigress_rare")
                .name("Master Tigress")
                .rarity("rare")
                .image("/assets/card_pack/tigress_rare.png")
                .stars(3)
                .description("The strongest and most dedicated of the Furious Five. Fierce, disciplined, and powerful.")
                .bonuses(Arrays.asList("Tiger Claw: Double points for words starting with Center Letter", "+15% Score Overall"))
                .build());

        cardRepository.save(Card.builder()
                .id("shifu_epic")
                .name("Master Shifu")
                .rarity("epic")
                .image("/assets/card_pack/shifu_epic.png")
                .stars(4)
                .description("The wise master of the Jade Palace. Patiently guides others to unlock their inner potential.")
                .bonuses(Arrays.asList("Inner Peace: Double streak score multipliers", "+25% Coins from all sources"))
                .build());

        cardRepository.save(Card.builder()
                .id("dragon_warrior_po")
                .name("Dragon Warrior Po")
                .rarity("epic")
                .image("/assets/card_pack/dragon_warrior_po_epic.png")
                .stars(4)
                .description("The legendary Dragon Warrior. Combines body weight, noodle-eating stamina, and inner peace.")
                .bonuses(Arrays.asList("Wuxi Finger Hold: Auto-reveal 1 word per puzzle", "+35% XP Overall", "+20% Score Overall"))
                .build());

        cardRepository.save(Card.builder()
                .id("oogway_legendary")
                .name("Grand Master Oogway")
                .rarity("legendary")
                .image("/assets/card_pack/oogway_legendary.png")
                .stars(5)
                .description("The founder of Kung Fu and the Valley of Peace. His wisdom is infinite and his moves are timeless.")
                .bonuses(Arrays.asList("Universal Harmony: Free word suggestions", "Double XP & Coins from all puzzles", "Instantly clear letter wheel once per puzzle for a massive score multiplier"))
                .build());
    }

    private void seedPuzzles() {
        if (puzzleRepository.count() > 0) {
            // Ensure today has a DailyPuzzle mapping if legacy rows exist
            var today = gameClock.today();
            if (!dailyPuzzleRepository.existsByScheduledDate(today)) {
                puzzleRepository.findByPuzzleDate(today).ifPresent(p ->
                        dailyPuzzleRepository.save(DailyPuzzle.builder().puzzle(p).scheduledDate(today).build()));
            }
            return;
        }

        log.info("Seeding default puzzle pool + today's daily...");

        var today = gameClock.today();
        Puzzle easy = saveSeed(
                Arrays.asList("A", "D", "N", "P", "S", "T", "G"),
                "A",
                Arrays.asList("PANDA","PANDAS","SAND","SPAN","SNAP","PAST","SPAT","TAPS","PANS","PATS","NAPS","STAND","TAGS","GASP","GAPS","PANG","PANGS","PAGAN","PAGANS","STANDGAP"),
                Collections.singletonList("STANDGAP"),
                PuzzleDifficulty.EASY,
                today
        );
        snapshotAfterSeed(easy);
        snapshotAfterSeed(saveSeed(
                Arrays.asList("D", "R", "A", "G", "O", "N", "S"),
                "O",
                Arrays.asList("DRAGON","DRAGONS","ROAD","ROADS","ORGAN","ORGANS","SONG","SONGS","SOAR","GROAN","GROANS","DONOR","DONORS","GOAD","GOADS","RADON"),
                Arrays.asList("DRAGON", "DRAGONS"),
                PuzzleDifficulty.MEDIUM,
                null
        ));
        snapshotAfterSeed(saveSeed(
                Arrays.asList("E", "M", "A", "S", "T", "R", "C"),
                "E",
                Arrays.asList("MASTER","MASTERS","STEAM","TEAMS","SEAM","MEAT","TAME","CRATE","CRATES","CREAM","CREAMS","SCREAM","SCREAMS","ACRE","ACRES","TEAR","TEARS","STARE","RATES","MATE","MATES","STREAMCASTER"),
                Collections.singletonList("STREAMCASTER"),
                PuzzleDifficulty.HARD,
                null
        ));
        snapshotAfterSeed(saveSeed(
                Arrays.asList("B", "L", "A", "C", "K", "E", "T"),
                "A",
                Arrays.asList("BLACK","BLEAK","TABLE","CABLE","LACE","LAKE","BAKE","CAKE","TALE","LATE","BEAT","BEATEN","BLANKET","BLANKETS","CABLET","ABLE","BALE","TACKLE","BLACKTEA"),
                Arrays.asList("BLANKET", "BLANKETS", "BLACKTEA"),
                PuzzleDifficulty.EXPERT,
                null
        ));

        dailyPuzzleRepository.save(DailyPuzzle.builder()
                .puzzle(easy)
                .scheduledDate(today)
                .build());
    }

    private void snapshotAfterSeed(Puzzle puzzle) {
        puzzleWordSnapshotService.replaceSnapshot(puzzle, puzzle.getValidWords(), puzzle.getPangrams());
    }

    private Puzzle saveSeed(
            List<String> letters,
            String center,
            List<String> words,
            List<String> pangrams,
            PuzzleDifficulty difficulty,
            java.time.LocalDate date
    ) {
        var rewards = switch (difficulty) {
            case EASY -> GameEconomy.difficulty("Easy");
            case MEDIUM -> GameEconomy.difficulty("Medium");
            case HARD -> GameEconomy.difficulty("Hard");
            case EXPERT -> GameEconomy.difficulty("Expert");
        };
        return puzzleRepository.saveAndFlush(Puzzle.builder()
                .puzzleDate(date)
                .letters(letters)
                .centerLetter(center)
                .validWords(words)
                .pangrams(pangrams)
                .difficulty(difficulty)
                .minimumWordLength(GameEconomy.MIN_WORD_LENGTH)
                .targetWordCount(rewards.targetWords())
                .pangramCount(pangrams.size())
                .xpReward(rewards.baseXp())
                .coinReward(rewards.baseCoins())
                .fingerprint(PuzzleGenerationService.fingerprint(letters, center, difficulty))
                .generationBatchId("seed")
                .dictionarySourceVersion(dictionaryProperties.getSourceVersion())
                .active(true)
                .build());
    }

    private void seedAchievements() {
        if (achievementRepository.count() > 0) return;

        log.info("Seeding achievements...");

        achievementRepository.saveAll(java.util.List.of(
            Achievement.builder().id("first_word").title("First Step").description("Find your first word").target(1).rewardXp(25).rewardCoins(10).iconName("🥋").build(),
            Achievement.builder().id("word_master_10").title("Apprentice").description("Find 10 total words").target(10).rewardXp(50).rewardCoins(20).iconName("📖").build(),
            Achievement.builder().id("word_master_50").title("Disciple").description("Find 50 total words").target(50).rewardXp(100).rewardCoins(40).iconName("📚").build(),
            Achievement.builder().id("word_master_100").title("Scholar").description("Find 100 total words").target(100).rewardXp(200).rewardCoins(75).iconName("🎓").build(),
            Achievement.builder().id("puzzle_complete_1").title("First Scroll").description("Complete your first puzzle").target(1).rewardXp(50).rewardCoins(25).iconName("📜").build(),
            Achievement.builder().id("puzzle_complete_10").title("Scroll Keeper").description("Complete 10 puzzles").target(10).rewardXp(150).rewardCoins(60).iconName("🏆").build(),
            Achievement.builder().id("puzzle_complete_30").title("Grand Keeper").description("Complete 30 puzzles").target(30).rewardXp(400).rewardCoins(150).iconName("🎖️").build(),
            Achievement.builder().id("streak_3").title("Three Day Journey").description("Maintain a 3-day streak").target(3).rewardXp(75).rewardCoins(30).iconName("🔥").build(),
            Achievement.builder().id("streak_7").title("Week Warrior").description("Maintain a 7-day streak").target(7).rewardXp(200).rewardCoins(80).iconName("⚔️").build(),
            Achievement.builder().id("streak_30").title("Iron Discipline").description("Maintain a 30-day streak").target(30).rewardXp(1000).rewardCoins(400).iconName("🥇").build(),
            Achievement.builder().id("collector_3").title("Scroll Collector").description("Collect 3 character scrolls").target(3).rewardXp(100).rewardCoins(50).iconName("✨").build(),
            Achievement.builder().id("collector_all").title("Complete the Five").description("Collect all 9 scrolls").target(9).rewardXp(500).rewardCoins(250).iconName("🌟").build(),
            Achievement.builder().id("belt_yellow").title("Yellow Belt").description("Earn your Yellow Belt").target(1).rewardXp(50).rewardCoins(25).iconName("🟡").build(),
            Achievement.builder().id("belt_black").title("Dragon Warrior").description("Reach the Black Belt").target(1).rewardXp(2000).rewardCoins(1000).iconName("⬛").build()
        ));
    }
}
