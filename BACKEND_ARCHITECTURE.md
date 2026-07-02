# Kung Fu Word Quest - Backend Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Layers](#architecture-layers)
5. [Database Design](#database-design)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [Caching Strategy](#caching-strategy)
9. [Business Logic & Services](#business-logic--services)
10. [Error Handling](#error-handling)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & DevOps](#deployment--devops)
13. [Performance Optimization](#performance-optimization)

---

## Overview

**Backend Service** for Kung Fu Word Quest provides RESTful APIs to support the frontend application with persistent data storage, authentication, complex business logic, and real-time leaderboard rankings.

### Key Responsibilities
- User authentication and session management
- Daily puzzle generation and word validation
- Player progression tracking and XP calculations
- Card collection and equip management
- Achievement unlocking and tracking
- Leaderboard ranking and calculations
- Real-time data synchronization
- Caching and performance optimization

### Scalability Goals
- Support 10,000+ concurrent players
- Sub-200ms API response times
- Real-time leaderboard updates
- Horizontal scaling via microservices (future)

---

## Technology Stack

### Core Framework & Runtime
| Component | Version | Purpose |
|-----------|---------|---------|
| Java | 17+ | Application runtime |
| Spring Boot | 3.x | Web framework & dependency injection |
| Spring Data JPA | 3.x | ORM and database access |
| Spring Security | 6.x | Authentication & authorization |
| Spring Cache | 3.x | Caching abstraction |
| Lombok | 1.18+ | Boilerplate reduction |

### Database & Persistence
| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 14+ | Primary relational database |
| Flyway | 9.x | Database migration management |
| HikariCP | 5.x | Connection pooling |

### Caching & Data Store
| Component | Version | Purpose |
|-----------|---------|---------|
| Redis | 7.x | Distributed caching layer |
| Spring Data Redis | 3.x | Redis integration |
| Lettuce | 6.x | Redis client (non-blocking) |

### API & Communication
| Component | Version | Purpose |
|-----------|---------|---------|
| Spring Web (MVC) | 3.x | REST controller support |
| Jackson | 2.15+ | JSON serialization |
| Springdoc OpenAPI | 2.x | Swagger/OpenAPI documentation |

### Testing & Quality
| Component | Version | Purpose |
|-----------|---------|---------|
| JUnit 5 | 5.9+ | Unit testing framework |
| Mockito | 5.x | Mocking framework |
| AssertJ | 3.x | Fluent assertions |
| Testcontainers | 1.x | Integration test containers |
| H2 Database | 2.x | In-memory DB for testing |

### Build & DevOps
| Component | Version | Purpose |
|-----------|---------|---------|
| Maven | 3.8+ | Build tool |
| Docker | Latest | Containerization |
| Docker Compose | Latest | Local development environment |

---

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/kungfu/wordquest/
│   │   │   ├── KungFuWordQuestApplication.java  # Spring Boot entry point
│   │   │   │
│   │   │   ├── controller/                      # REST endpoints
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── PuzzleController.java
│   │   │   │   ├── UserController.java
│   │   │   │   ├── CardController.java
│   │   │   │   ├── LeaderboardController.java
│   │   │   │   ├── AchievementController.java
│   │   │   │   └── HealthController.java
│   │   │   │
│   │   │   ├── service/                        # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── PuzzleService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── CardService.java
│   │   │   │   ├── LeaderboardService.java
│   │   │   │   ├── AchievementService.java
│   │   │   │   ├── RewardCalculationService.java
│   │   │   │   └── CacheService.java
│   │   │   │
│   │   │   ├── repository/                     # Data access layer
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── PuzzleRepository.java
│   │   │   │   ├── WordRepository.java
│   │   │   │   ├── CardRepository.java
│   │   │   │   ├── UserCardRepository.java
│   │   │   │   ├── AchievementRepository.java
│   │   │   │   ├── LeaderboardCacheRepository.java
│   │   │   │   └── PuzzleSubmissionRepository.java
│   │   │   │
│   │   │   ├── model/entity/                   # JPA entities
│   │   │   │   ├── User.java
│   │   │   │   ├── UserProfile.java
│   │   │   │   ├── DailyPuzzle.java
│   │   │   │   ├── PuzzleWord.java
│   │   │   │   ├── CharacterCard.java
│   │   │   │   ├── UserCard.java
│   │   │   │   ├── UserStats.java
│   │   │   │   ├── Achievement.java
│   │   │   │   ├── UserAchievement.java
│   │   │   │   ├── PuzzleSubmission.java
│   │   │   │   └── Leaderboard.java
│   │   │   │
│   │   │   ├── model/dto/                      # Data transfer objects
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── SubmitWordRequest.java
│   │   │   │   │   ├── DrawCardRequest.java
│   │   │   │   │   └── UpdateUserRequest.java
│   │   │   │   ├── response/
│   │   │   │   │   ├── AuthResponse.java
│   │   │   │   │   ├── UserResponse.java
│   │   │   │   │   ├── PuzzleResponse.java
│   │   │   │   │   ├── SubmitWordResponse.java
│   │   │   │   │   ├── CardResponse.java
│   │   │   │   │   ├── AchievementResponse.java
│   │   │   │   │   ├── LeaderboardResponse.java
│   │   │   │   │   └── ApiErrorResponse.java
│   │   │   │   └── PayloadResponse.java
│   │   │   │
│   │   │   ├── security/                       # Security & JWT
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   │
│   │   │   ├── cache/                          # Redis caching logic
│   │   │   │   ├── CacheConfig.java
│   │   │   │   ├── CacheConstants.java
│   │   │   │   └── CacheManager.java
│   │   │   │
│   │   │   ├── exception/                      # Exception handling
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── ValidationException.java
│   │   │   │   ├── DuplicateWordException.java
│   │   │   │   ├── InvalidWordException.java
│   │   │   │   └── AuthenticationException.java
│   │   │   │
│   │   │   ├── util/                          # Utility classes
│   │   │   │   ├── JwtUtil.java
│   │   │   │   ├── PasswordEncoderUtil.java
│   │   │   │   ├── DateTimeUtil.java
│   │   │   │   ├── RewardCalculationUtil.java
│   │   │   │   └── PuzzleGenerationUtil.java
│   │   │   │
│   │   │   └── config/                        # Configuration classes
│   │   │       ├── AppConfig.java
│   │   │       ├── DatabaseConfig.java
│   │   │       ├── CacheConfig.java
│   │   │       ├── WebConfig.java
│   │   │       └── SwaggerConfig.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                # Main config
│   │       ├── application-dev.yml            # Dev profile
│   │       ├── application-prod.yml           # Prod profile
│   │       ├── db/migration/                  # Flyway migrations
│   │       │   ├── V1__Initial_Schema.sql
│   │       │   ├── V2__Add_Achievements.sql
│   │       │   └── V3__Add_Leaderboard.sql
│   │       └── data/
│   │           └── initial-puzzles.json       # Seeding data
│   │
│   └── test/
│       ├── java/com/kungfu/wordquest/
│       │   ├── controller/
│       │   │   ├── AuthControllerTest.java
│       │   │   ├── PuzzleControllerTest.java
│       │   │   └── UserControllerTest.java
│       │   ├── service/
│       │   │   ├── PuzzleServiceTest.java
│       │   │   ├── UserServiceTest.java
│       │   │   ├── RewardCalculationServiceTest.java
│       │   │   └── LeaderboardServiceTest.java
│       │   ├── repository/
│       │   │   └── UserRepositoryTest.java
│       │   └── util/
│       │       └── RewardCalculationUtilTest.java
│       └── resources/
│           ├── application-test.yml
│           └── test-data.sql
│
├── pom.xml                                    # Maven dependency config
├── Dockerfile                                # Docker container definition
├── docker-compose.yml                        # Local dev environment
├── .env.example                              # Environment variables template
└── README.md                                 # Backend setup guide

```

---

## Architecture Layers

### 1. **Controller Layer (REST API)**

Entry point for HTTP requests. Handles routing, parameter validation, and response formatting.

```java
@RestController
@RequestMapping("/api/v1/puzzle")
@RequiredArgsConstructor
public class PuzzleController {
    private final PuzzleService puzzleService;
    private final CacheManager cacheManager;
    
    @GetMapping("/daily")
    public ResponseEntity<PayloadResponse<PuzzleResponse>> getDailyPuzzle() {
        DailyPuzzle puzzle = puzzleService.getDailyPuzzle();
        return ResponseEntity.ok(new PayloadResponse<>(new PuzzleResponse(puzzle)));
    }
    
    @PostMapping("/submit")
    public ResponseEntity<PayloadResponse<SubmitWordResponse>> submitWord(
        @Valid @RequestBody SubmitWordRequest request,
        @AuthenticationPrincipal UserDetails user
    ) {
        SubmitWordResponse response = puzzleService.submitWord(user.getUsername(), request);
        return ResponseEntity.ok(new PayloadResponse<>(response));
    }
}
```

**Key Responsibilities:**
- Request validation (@Valid)
- Authentication/Authorization checks
- Response formatting
- Exception translation to HTTP status codes

### 2. **Service Layer (Business Logic)**

Encapsulates application logic, orchestrates repositories, and manages transactions.

```java
@Service
@RequiredArgsConstructor
public class PuzzleService {
    private final PuzzleRepository puzzleRepository;
    private final WordRepository wordRepository;
    private final PuzzleSubmissionRepository submissionRepository;
    private final RewardCalculationService rewardService;
    private final CacheService cacheService;
    private final UserService userService;
    
    @Transactional
    public SubmitWordResponse submitWord(String username, SubmitWordRequest request) {
        // 1. Fetch user & puzzle
        User user = userService.findByUsername(username);
        DailyPuzzle puzzle = getDailyPuzzle();
        
        // 2. Validate word
        if (!wordRepository.existsByWordAndPuzzleId(request.getWord(), puzzle.getId())) {
            throw new InvalidWordException("Word not in puzzle list");
        }
        
        // 3. Check duplicate
        if (submissionRepository.existsByUserIdAndWordAndPuzzleId(
            user.getId(), request.getWord(), puzzle.getId())) {
            throw new DuplicateWordException("Word already found");
        }
        
        // 4. Calculate score & rewards
        int score = calculateScore(request.getWord(), puzzle);
        
        // 5. Save submission
        PuzzleSubmission submission = new PuzzleSubmission(user, puzzle, request.getWord(), score);
        submissionRepository.save(submission);
        
        // 6. Update user stats
        user.addXp(score);
        user.incrementWordsFound();
        userService.save(user);
        
        // 7. Invalidate cache
        cacheService.invalidateUserLeaderboard(user.getId());
        
        return new SubmitWordResponse(score, true);
    }
}
```

**Key Responsibilities:**
- Transaction management (@Transactional)
- Orchestrate repositories and other services
- Business rule enforcement
- Cache invalidation on data mutations

### 3. **Repository Layer (Data Access)**

Spring Data JPA provides abstraction over database operations.

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.createdAt >= ?1 ORDER BY u.xp DESC")
    List<User> findTopUsersByXpSince(LocalDateTime since);
    
    @Query(value = "SELECT * FROM users WHERE belt = ?1 LIMIT 100", nativeQuery = true)
    List<User> findUsersByBeltRank(String beltRank);
}

@Repository
public interface PuzzleSubmissionRepository extends JpaRepository<PuzzleSubmission, Long> {
    boolean existsByUserIdAndWordAndPuzzleId(Long userId, String word, Long puzzleId);
    
    List<PuzzleSubmission> findByUserId(Long userId);
    
    @Query("SELECT COUNT(DISTINCT ps.word) FROM PuzzleSubmission ps WHERE ps.user.id = ?1 AND ps.puzzle.id = ?2")
    long countFoundWords(Long userId, Long puzzleId);
}
```

**Key Responsibilities:**
- Database query abstraction
- CRUD operations
- Custom query methods
- Pagination and sorting

### 4. **Entity/Model Layer (Domain Objects)**

JPA entities representing database tables.

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String passwordHash;
    
    private Long xp = 0L;
    private Long coins = 50L;
    private Integer dailyStreak = 1;
    
    @Enumerated(EnumType.STRING)
    private BeltColor belt = BeltColor.WHITE;
    
    private String rank = "Novice Disciple";
    
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "user")
    private UserStats stats;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<PuzzleSubmission> submissions = new ArrayList<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public void addXp(long amount) {
        this.xp += amount;
        evaluateBelt();
    }
    
    private void evaluateBelt() {
        // Belt progression logic
    }
}
```

### 5. **DTO Layer (Data Transfer Objects)**

Separate objects for API contracts to decouple frontend and backend schemas.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmitWordRequest {
    @NotBlank(message = "Word is required")
    @Size(min = 4, max = 20)
    private String word;
    
    @NotNull(message = "Puzzle ID is required")
    private Long puzzleId;
}

@Data
@AllArgsConstructor
public class SubmitWordResponse {
    private Integer score;
    private Boolean valid;
    private Boolean isPangram;
    private Long totalScore;
    private Integer wordsFound;
}
```

---

## Database Design

### Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────────┐
│    users    │ 1────N  │ puzzle_submission│
├─────────────┤         ├──────────────────┤
│ id (PK)     │         │ id (PK)          │
│ username    │         │ user_id (FK)     │
│ email       │         │ puzzle_id (FK)   │
│ password    │         │ word             │
│ xp          │         │ score            │
│ coins       │         │ submitted_at     │
│ belt        │         └──────────────────┘
│ streak      │
│ created_at  │         ┌──────────────────┐
└─────────────┘         │   daily_puzzle   │
        │ 1──N          ├──────────────────┤
        └───────────────│ id (PK)          │
                        │ letters          │
        ┌──────────────┐ │ center_letter    │
        │ user_stats   │ │ difficulty       │
        ├──────────────┤ │ created_at       │
        │ id (PK)      │ └──────────────────┘
        │ user_id (FK) │
        │ words_found  │  ┌─────────────────┐
        │ cards_coll   │  │ puzzle_words    │
        │ score_high   │  ├─────────────────┤
        │ puzzles_done │  │ id (PK)         │
        └──────────────┘  │ puzzle_id (FK)  │
                          │ word            │
        ┌──────────────┐   │ is_pangram      │
        │ character_   │   └─────────────────┘
        │ card         │
        ├──────────────┤
        │ id (PK)      │
        │ name         │
        │ rarity       │
        │ bonuses      │
        └──────────────┘
                 1──N
                  │
        ┌─────────────────┐
        │ user_cards      │
        ├─────────────────┤
        │ id (PK)         │
        │ user_id (FK)    │
        │ card_id (FK)    │
        │ equipped        │
        │ unlocked_at     │
        └─────────────────┘
```

### Key Tables

**users**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    xp BIGINT DEFAULT 0,
    coins BIGINT DEFAULT 50,
    daily_streak INT DEFAULT 1,
    belt VARCHAR(20) DEFAULT 'WHITE',
    rank VARCHAR(100) DEFAULT 'Novice Disciple',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_xp (xp DESC)
);
```

**daily_puzzle**
```sql
CREATE TABLE daily_puzzle (
    id BIGSERIAL PRIMARY KEY,
    puzzle_date DATE UNIQUE NOT NULL,
    letters VARCHAR(7) NOT NULL,
    center_letter CHAR(1) NOT NULL,
    difficulty VARCHAR(20),
    xp_reward INT DEFAULT 100,
    coin_reward INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_puzzle_date (puzzle_date)
);
```

**puzzle_words**
```sql
CREATE TABLE puzzle_words (
    id BIGSERIAL PRIMARY KEY,
    puzzle_id BIGINT NOT NULL REFERENCES daily_puzzle(id),
    word VARCHAR(50) NOT NULL,
    is_pangram BOOLEAN DEFAULT FALSE,
    word_score INT DEFAULT 10,
    UNIQUE(puzzle_id, word),
    INDEX idx_puzzle_id (puzzle_id)
);
```

**puzzle_submission**
```sql
CREATE TABLE puzzle_submission (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    puzzle_id BIGINT NOT NULL REFERENCES daily_puzzle(id),
    word VARCHAR(50) NOT NULL,
    score INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, puzzle_id, word),
    INDEX idx_user_puzzle (user_id, puzzle_id),
    INDEX idx_submitted_at (submitted_at DESC)
);
```

**character_card**
```sql
CREATE TABLE character_card (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rarity VARCHAR(20),
    image_url VARCHAR(255),
    stars INT,
    bonuses TEXT[],
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_card**
```sql
CREATE TABLE user_card (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    card_id BIGINT NOT NULL REFERENCES character_card(id),
    equipped BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, card_id),
    INDEX idx_user_equipped (user_id, equipped)
);
```

**achievement**
```sql
CREATE TABLE achievement (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    reward_xp INT,
    reward_coins INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**user_achievement**
```sql
CREATE TABLE user_achievement (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    achievement_id BIGINT NOT NULL REFERENCES achievement(id),
    progress INT DEFAULT 0,
    target INT,
    unlocked_at TIMESTAMP,
    UNIQUE(user_id, achievement_id),
    INDEX idx_user_achievement (user_id, unlocked_at DESC)
);
```

---

## API Endpoints

### Authentication Endpoints

```
POST /api/v1/auth/register
├─ Request: { username, email, password, password_confirmation }
├─ Response: { userId, token, user: { username, belt, rank } }
└─ Status: 201 Created

POST /api/v1/auth/login
├─ Request: { username, password }
├─ Response: { token, user: { id, username, xp, coins, belt } }
└─ Status: 200 OK

POST /api/v1/auth/refresh
├─ Request: { refresh_token }
├─ Response: { token }
└─ Status: 200 OK

POST /api/v1/auth/logout
├─ Authorization: JWT token
├─ Response: {}
└─ Status: 204 No Content
```

### Puzzle Endpoints

```
GET /api/v1/puzzle/daily
├─ Authorization: JWT token
├─ Response: { id, letters, centerLetter, validWordCount, difficulty }
└─ Status: 200 OK

POST /api/v1/puzzle/submit
├─ Authorization: JWT token
├─ Request: { word, puzzleId }
├─ Response: { score, valid, isPangram, totalScore, wordsFound }
└─ Status: 200 OK or 400 Invalid Word

GET /api/v1/puzzle/history
├─ Authorization: JWT token
├─ Query: page=0&size=10
├─ Response: { totalPages, totalElements, content: [{ puzzleDate, score, wordsFound }] }
└─ Status: 200 OK
```

### User Endpoints

```
GET /api/v1/user/profile
├─ Authorization: JWT token
├─ Response: { id, username, email, xp, coins, belt, rank, stats: {...} }
└─ Status: 200 OK

PUT /api/v1/user/profile
├─ Authorization: JWT token
├─ Request: { username, email }
├─ Response: { user object }
└─ Status: 200 OK

DELETE /api/v1/user/progress
├─ Authorization: JWT token
├─ Response: {}
└─ Status: 204 No Content

GET /api/v1/user/stats
├─ Authorization: JWT token
├─ Response: { wordsFound, cardsCollected, achievementsEarned, highestScore, puzzlesCompleted }
└─ Status: 200 OK
```

### Card Endpoints

```
GET /api/v1/card/collection
├─ Authorization: JWT token
├─ Response: { unlocked: [...], equipped: {...}, available: 5 }
└─ Status: 200 OK

PUT /api/v1/card/:cardId/equip
├─ Authorization: JWT token
├─ Response: { equipped: true, bonuses: [...] }
└─ Status: 200 OK

POST /api/v1/card/draw
├─ Authorization: JWT token
├─ Request: { quantity: 1 }
├─ Response: { cards: [...], totalCards: 45, costCoins: 50 }
└─ Status: 200 OK or 400 Insufficient Coins
```

### Leaderboard Endpoints

```
GET /api/v1/leaderboard/top
├─ Authorization: JWT token
├─ Query: limit=100&offset=0
├─ Response: { entries: [{ rank, username, score, belt, avatar }] }
└─ Status: 200 OK

GET /api/v1/leaderboard/around-me
├─ Authorization: JWT token
├─ Query: range=10
├─ Response: { yourRank, above: [...], you: {...}, below: [...] }
└─ Status: 200 OK

GET /api/v1/leaderboard/weekly
├─ Authorization: JWT token
├─ Response: { entries: [...], updatedAt }
└─ Status: 200 OK
```

### Achievement Endpoints

```
GET /api/v1/achievement/list
├─ Authorization: JWT token
├─ Response: { achievements: [{ id, title, progress, target, unlocked }] }
└─ Status: 200 OK

GET /api/v1/achievement/:id
├─ Authorization: JWT token
├─ Response: { achievement object }
└─ Status: 200 OK
```

---

## Authentication & Security

### JWT Token Strategy

```
Header: Authorization: Bearer <jwt_token>

JWT Payload:
{
  "sub": "username",
  "userId": 123,
  "email": "user@example.com",
  "role": "USER",
  "iat": 1693478400,
  "exp": 1693564800,  // 24 hours
  "iss": "kung-fu-word-quest"
}
```

### Security Config

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtTokenProvider jwtTokenProvider;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .exceptionHandling()
                .authenticationEntryPoint((req, res, auth) -> {
                    res.setContentType("application/json");
                    res.setStatus(401);
                    res.getWriter().write("{\"error\": \"Unauthorized\"}");
                })
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
                .antMatchers("/api/v1/auth/**").permitAll()
                .antMatchers("/api/v1/health").permitAll()
                .antMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider);
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### Password Hashing

```java
@Component
public class PasswordEncoderUtil {
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(12);
    
    public String encode(String password) {
        return encoder.encode(password);
    }
    
    public boolean matches(String rawPassword, String hashedPassword) {
        return encoder.matches(rawPassword, hashedPassword);
    }
}
```

---

## Caching Strategy

### Redis Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("userProfile", 
                RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("leaderboard",
                RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("dailyPuzzle",
                RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofHours(24)))
            .build();
    }
    
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory();
    }
}
```

### Caching Points

```java
public class CacheConstants {
    public static final String USER_PROFILE_CACHE = "userProfile";
    public static final String USER_LEADERBOARD_CACHE = "leaderboard";
    public static final String DAILY_PUZZLE_CACHE = "dailyPuzzle";
    public static final String CARD_COLLECTION_CACHE = "cardCollection";
    public static final String ACHIEVEMENTS_CACHE = "achievements";
}

// Usage in services
@Service
public class UserService {
    
    @Cacheable(value = "userProfile", key = "#username")
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
    
    @CacheEvict(value = "userProfile", key = "#user.username")
    public User updateUser(User user) {
        return userRepository.save(user);
    }
}

public class LeaderboardService {
    
    @Cacheable(value = "leaderboard", unless = "#result == null")
    public List<LeaderboardResponse> getTopUsers(int limit) {
        return userRepository.findTopUsersByXpSince(LocalDateTime.now().minusDays(30))
            .stream()
            .limit(limit)
            .map(LeaderboardResponse::fromUser)
            .collect(Collectors.toList());
    }
    
    @CacheEvict(value = "leaderboard", allEntries = true)
    public void invalidateLeaderboard() {
        // Triggered after user XP update
    }
}
```

### Cache Invalidation Strategy

```java
@Service
public class CacheService {
    private final CacheManager cacheManager;
    
    public void invalidateUserCache(Long userId) {
        cacheManager.getCache("userProfile").evict(userId);
    }
    
    public void invalidateLeaderboard() {
        cacheManager.getCache("leaderboard").clear();
    }
    
    public void invalidateUserCards(Long userId) {
        cacheManager.getCache("cardCollection").evict(userId);
    }
    
    public void invalidateAchievements(Long userId) {
        cacheManager.getCache("achievements").evict(userId);
    }
}
```

### Cache Warming

```java
@Component
public class CacheWarmer {
    private final PuzzleService puzzleService;
    private final LeaderboardService leaderboardService;
    
    @PostConstruct
    public void warmCache() {
        // Pre-load daily puzzle
        puzzleService.getDailyPuzzle();
        
        // Pre-load top leaderboard
        leaderboardService.getTopUsers(100);
    }
}
```

---

## Business Logic & Services

### Reward Calculation

```java
@Service
@RequiredArgsConstructor
public class RewardCalculationService {
    private static final int BASE_XP_EASY = 100;
    private static final int BASE_XP_MEDIUM = 175;
    private static final int BASE_XP_HARD = 300;
    private static final int BASE_XP_EXPERT = 450;
    
    private static final int PANGRAM_BONUS = 75;
    private static final int STREAK_MULTIPLIER = 10;
    
    public RewardCalculation calculateRewards(
        String difficulty, 
        int pangramsFound, 
        int streak, 
        double characterMultiplier
    ) {
        int baseXp = getBasXpByDifficulty(difficulty);
        int pangramBonus = pangramsFound * PANGRAM_BONUS;
        int streakBonus = streak * STREAK_MULTIPLIER;
        int characterBonus = (int) (baseXp * characterMultiplier);
        
        int totalXp = baseXp + pangramBonus + streakBonus + characterBonus;
        int coins = getCoinsByDifficulty(difficulty);
        
        String achievement = evaluateAchievement(pangramsFound, streak);
        
        return new RewardCalculation(totalXp, coins, pangramBonus, streakBonus, 
                                    characterBonus, achievement);
    }
    
    private int getBasXpByDifficulty(String difficulty) {
        return switch(difficulty) {
            case "Easy" -> BASE_XP_EASY;
            case "Medium" -> BASE_XP_MEDIUM;
            case "Hard" -> BASE_XP_HARD;
            case "Expert" -> BASE_XP_EXPERT;
            default -> 100;
        };
    }
    
    private String evaluateAchievement(int pangramsFound, int streak) {
        if (streak >= 30) return "30 Day Streak";
        if (pangramsFound > 0) return "Pangram Hunter";
        return null;
    }
}
```

### Word Validation

```java
@Service
@RequiredArgsConstructor
public class PuzzleService {
    private final PuzzleRepository puzzleRepository;
    private final WordRepository wordRepository;
    
    public boolean isValidWord(String word, Long puzzleId) {
        // 1. Check word exists in puzzle word list
        if (!wordRepository.existsByWordAndPuzzleId(word, puzzleId)) {
            return false;
        }
        
        // 2. Check minimum length
        if (word.length() < 4) {
            return false;
        }
        
        // 3. Check center letter included
        DailyPuzzle puzzle = puzzleRepository.findById(puzzleId)
            .orElseThrow(() -> new ResourceNotFoundException("Puzzle not found"));
        
        if (!word.toUpperCase().contains(puzzle.getCenterLetter())) {
            return false;
        }
        
        return true;
    }
    
    public boolean isPangram(String word, Long puzzleId) {
        DailyPuzzle puzzle = puzzleRepository.findById(puzzleId)
            .orElseThrow();
        
        String letters = puzzle.getLetters().toUpperCase();
        String wordUpper = word.toUpperCase();
        
        for (char c : letters.toCharArray()) {
            if (!wordUpper.contains(String.valueOf(c))) {
                return false;
            }
        }
        return true;
    }
}
```

### Achievement Tracking

```java
@Service
@RequiredArgsConstructor
public class AchievementService {
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    
    @Transactional
    public void checkAndUnlockAchievements(User user) {
        List<Achievement> allAchievements = achievementRepository.findAll();
        
        for (Achievement achievement : allAchievements) {
            UserAchievement userAch = userAchievementRepository
                .findByUserAndAchievement(user, achievement)
                .orElse(new UserAchievement(user, achievement));
            
            if (!userAch.isUnlocked()) {
                int progress = calculateProgress(user, achievement);
                userAch.setProgress(progress);
                
                if (progress >= userAch.getTarget()) {
                    userAch.setUnlocked(true);
                    userAch.setUnlockedAt(LocalDateTime.now());
                    
                    // Award XP & coins
                    user.addXp(achievement.getRewardXp());
                    user.addCoins(achievement.getRewardCoins());
                }
                
                userAchievementRepository.save(userAch);
            }
        }
    }
    
    private int calculateProgress(User user, Achievement achievement) {
        return switch(achievement.getId()) {
            case 1 -> (int) user.getStats().getWordsFound();           // Words Found
            case 2 -> (int) user.getStats().getCardsCollected();       // Cards Collected
            case 3 -> user.getDailyStreak();                            // Streak Days
            case 4 -> (int) user.getStats().getPuzzlesCompleted();     // Puzzles Completed
            default -> 0;
        };
    }
}
```

---

## Error Handling

### Exception Hierarchy

```java
public abstract class KungFuException extends RuntimeException {
    private final HttpStatus httpStatus;
    
    public KungFuException(String message, HttpStatus status) {
        super(message);
        this.httpStatus = status;
    }
    
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}

public class InvalidWordException extends KungFuException {
    public InvalidWordException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

public class DuplicateWordException extends KungFuException {
    public DuplicateWordException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}

public class ResourceNotFoundException extends KungFuException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
```

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(KungFuException.class)
    public ResponseEntity<ApiErrorResponse> handleKungFuException(
        KungFuException ex, HttpServletRequest request
    ) {
        return ResponseEntity
            .status(ex.getHttpStatus())
            .body(new ApiErrorResponse(
                ex.getHttpStatus().value(),
                ex.getMessage(),
                request.getRequestURI(),
                LocalDateTime.now()
            ));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex, HttpServletRequest request
    ) {
        String errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ApiErrorResponse(
                400,
                "Validation failed: " + errors,
                request.getRequestURI(),
                LocalDateTime.now()
            ));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
        Exception ex, HttpServletRequest request
    ) {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiErrorResponse(
                500,
                "Internal server error",
                request.getRequestURI(),
                LocalDateTime.now()
            ));
    }
}
```

---

## Testing Strategy

### Unit Testing

```java
@SpringBootTest
class PuzzleServiceTest {
    @Mock
    private PuzzleRepository puzzleRepository;
    
    @Mock
    private WordRepository wordRepository;
    
    @InjectMocks
    private PuzzleService puzzleService;
    
    @Test
    void testValidWordSubmission() {
        // Arrange
        Long puzzleId = 1L;
        String word = "PUZZLE";
        when(wordRepository.existsByWordAndPuzzleId(word, puzzleId)).thenReturn(true);
        
        // Act
        boolean isValid = puzzleService.isValidWord(word, puzzleId);
        
        // Assert
        assertThat(isValid).isTrue();
        verify(wordRepository, times(1)).existsByWordAndPuzzleId(word, puzzleId);
    }
    
    @Test
    void testDuplicateWordSubmission() {
        // Should throw exception on duplicate
    }
}
```

### Integration Testing

```java
@SpringBootTest
@Testcontainers
class PuzzleIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14")
        .withDatabaseName("wordquest_test")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testDailyPuzzleEndpoint() {
        ResponseEntity<PuzzleResponse> response = restTemplate
            .getForEntity("/api/v1/puzzle/daily", PuzzleResponse.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }
}
```

### Test Coverage Goals
- Service layer: 80%+ coverage
- Controller layer: 70%+ coverage
- Repository layer: 60%+ coverage
- Util functions: 90%+ coverage

---

## Deployment & DevOps

### Docker Setup

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/kung-fu-word-quest-*.jar app.jar

ENV JAVA_OPTS="-Xmx512m -Xms256m"

EXPOSE 8080

ENTRYPOINT exec java $JAVA_OPTS -jar app.jar
```

### Docker Compose (Local Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: wordquest
      POSTGRES_USER: wordquest
      POSTGRES_PASSWORD: wordquest
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/wordquest
      SPRING_DATASOURCE_USERNAME: wordquest
      SPRING_DATASOURCE_PASSWORD: wordquest
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Application Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:wordquest}
    username: ${DB_USER:wordquest}
    password: ${DB_PASSWORD:wordquest}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    timeout: 2000ms
  
  cache:
    type: redis
    redis:
      time-to-live: 3600000

server:
  port: 8080
  servlet:
    context-path: /
    
logging:
  level:
    root: INFO
    com.kungfu.wordquest: DEBUG

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build with Maven
        run: mvn clean verify
      
      - name: Run Tests
        run: mvn test
      
      - name: Build Docker Image
        run: docker build -t wordquest:latest .
```

---

## Performance Optimization

### Query Optimization

```java
// Use projections for large queries
@Query("SELECT new com.kungfu.dto.UserSummaryDTO(u.id, u.username, u.xp, u.belt) " +
       "FROM User u ORDER BY u.xp DESC LIMIT 100")
List<UserSummaryDTO> findTopUsers();

// Use fetch joins to prevent N+1 queries
@Query("SELECT DISTINCT u FROM User u " +
       "LEFT JOIN FETCH u.stats " +
       "LEFT JOIN FETCH u.cards " +
       "WHERE u.id = :userId")
Optional<User> findUserWithDetails(@Param("userId") Long userId);

// Use batch fetching
@EntityGraph(attributePaths = {"stats", "cards", "achievements"})
List<User> findAll();
```

### Indexing Strategy

```sql
-- High-cardinality indexes
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Foreign key indexes (often auto-created)
CREATE INDEX idx_submission_user_id ON puzzle_submission(user_id);
CREATE INDEX idx_submission_puzzle_id ON puzzle_submission(puzzle_id);

-- Composite indexes for common queries
CREATE INDEX idx_user_puzzle_date ON puzzle_submission(user_id, puzzle_id, submitted_at);
```

### Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20          # Max connections
      minimum-idle: 5                # Min idle connections
      connection-timeout: 20000      # 20 seconds
      idle-timeout: 600000           # 10 minutes
      max-lifetime: 1800000          # 30 minutes
      auto-commit: true
```

### Response Compression

```yaml
server:
  compression:
    enabled: true
    min-response-size: 1024
    mime-types:
      - application/json
      - application/xml
      - text/html
      - text/xml
      - text/plain
```

---

## Monitoring & Logging

### Structured Logging

```java
@Service
public class PuzzleService {
    private static final Logger log = LoggerFactory.getLogger(PuzzleService.class);
    
    public SubmitWordResponse submitWord(String username, SubmitWordRequest request) {
        log.info("Word submission started", 
            kv("username", username), 
            kv("word", request.getWord()));
        
        try {
            SubmitWordResponse response = // ... logic
            log.info("Word submission successful",
                kv("username", username),
                kv("score", response.getScore()));
            return response;
        } catch (Exception ex) {
            log.error("Word submission failed",
                kv("username", username),
                kv("error", ex.getMessage()), ex);
            throw ex;
        }
    }
}
```

### Health Check Endpoint

```java
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    
    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
}
```

---

## Scalability Roadmap

### Phase 1 (Current)
- Single Spring Boot instance
- PostgreSQL with connection pooling
- Redis for caching
- Basic monitoring

### Phase 2 (Future)
- Load balancer (NGINX/AWS ALB)
- Multiple Spring Boot instances
- Database read replicas
- Message queue (RabbitMQ/Kafka) for async tasks

### Phase 3 (Advanced)
- Microservices architecture
- API Gateway
- Circuit breakers
- Service mesh (Istio)
- Horizontal pod autoscaling (K8s)

---

## Security Checklist

- [x] HTTPS enforced in production
- [x] JWT token expiration (24 hours)
- [x] Password hashing (BCrypt)
- [x] SQL injection prevention (Parameterized queries)
- [x] CSRF protection disabled for REST API (stateless)
- [x] Rate limiting on auth endpoints
- [x] Input validation & sanitization
- [x] CORS configured
- [x] Sensitive data not logged
- [x] Secrets stored in environment variables

---

## Deployment Checklist

- [ ] Run all tests: `mvn clean test`
- [ ] Build JAR: `mvn clean package`
- [ ] Build Docker image: `docker build -t wordquest:v1.0 .`
- [ ] Push to registry: `docker push wordquest:v1.0`
- [ ] Run Flyway migrations
- [ ] Verify Redis connection
- [ ] Load test with load generator
- [ ] Test all critical endpoints
- [ ] Monitor logs in production
- [ ] Set up alerts

---

## Conclusion

The Kung Fu Word Quest backend is architected for **scalability**, **security**, and **maintainability**. Clear separation of concerns across controllers, services, and repositories, combined with Redis caching and PostgreSQL persistence, provides a robust foundation for supporting thousands of concurrent players. The use of Spring Boot, Spring Data JPA, and proven design patterns ensures rapid development and easy maintenance.
