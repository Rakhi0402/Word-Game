package com.kungfu.wordquest.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_user_username", columnList = "username"),
                @Index(name = "idx_user_email", columnList = "email"),
                @Index(name = "idx_users_xp_id", columnList = "xp, id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    /** Canonical BCrypt hash column. */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /**
     * Legacy NOT NULL column still present in DB.
     * Kept identical to {@link #passwordHash} on persist/update.
     */
    @Column(name = "password", nullable = false)
    private String legacyPassword;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.ROLE_USER;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String belt = "White";

    @Builder.Default
    @Column(nullable = false)
    private int level = 1;

    @Builder.Default
    @Column(nullable = false)
    private int xp = 0;

    @Builder.Default
    @Column(nullable = false)
    private int coins = 0;

    @Builder.Default
    @Column(nullable = false)
    private int gems = 0;

    @Builder.Default
    @Column(name = "current_streak", nullable = false)
    private int currentStreak = 0;

    @Builder.Default
    @Column(name = "daily_streak", nullable = false)
    private int dailyStreak = 0;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "streak_shields", nullable = false)
    private int streakShields = 0;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "free_chest_tokens", nullable = false)
    private int freeChestTokens = 0;

    @Builder.Default
    @ColumnDefault("false")
    @Column(name = "permanent_extra_daily_hint", nullable = false)
    private boolean permanentExtraDailyHint = false;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "bonus_free_hints_next_day", nullable = false)
    private int bonusFreeHintsNextDay = 0;

    @Column(name = "last_puzzle_date", length = 16)
    private String lastPuzzleDate;

    @Column(name = "choice_puzzles_date", length = 16)
    private String choicePuzzlesDate;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "choice_puzzles_completed_today", nullable = false)
    private int choicePuzzlesCompletedToday = 0;

    @Builder.Default
    @Column(name = "equipped_card_id", nullable = false)
    private String equippedCardId = "po_common";

    @Column(name = "last_played")
    private LocalDateTime lastPlayed;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean locked = false;

    @Builder.Default
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;

    @Version
    private Long version;

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private UserStats stats;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        syncPasswordColumns();
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        syncPasswordColumns();
        updatedAt = LocalDateTime.now();
    }

    private void syncPasswordColumns() {
        if (passwordHash != null && !passwordHash.isBlank()) {
            legacyPassword = passwordHash;
        } else if (legacyPassword != null && !legacyPassword.isBlank()) {
            passwordHash = legacyPassword;
        }
    }
}
