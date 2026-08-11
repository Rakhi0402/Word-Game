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
@Table(name = "user_stats")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStats {

    @Id
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    @Column(name = "words_found", nullable = false)
    private int wordsFound = 0;

    @Builder.Default
    @Column(name = "pangrams_found", nullable = false)
    private int pangramsFound = 0;

    @Builder.Default
    @Column(name = "cards_collected", nullable = false)
    private int cardsCollected = 0;

    @Builder.Default
    @Column(name = "achievements_earned", nullable = false)
    private int achievementsEarned = 0;

    @Builder.Default
    @Column(name = "highest_score", nullable = false)
    private int highestScore = 0;

    @Builder.Default
    @Column(name = "days_played", nullable = false)
    private int daysPlayed = 0;

    @Builder.Default
    @Column(name = "games_played", nullable = false)
    private int gamesPlayed = 0;

    @Builder.Default
    @Column(name = "puzzles_completed", nullable = false)
    private int puzzlesCompleted = 0;

    @Builder.Default
    @Column(name = "perfect_puzzles", nullable = false)
    private int perfectPuzzles = 0;

    @Builder.Default
    @Column(name = "hints_used", nullable = false)
    private int hintsUsed = 0;

    @Builder.Default
    @ColumnDefault("0")
    @Column(name = "hints_bought", nullable = false)
    private int hintsBought = 0;

    @Builder.Default
    @Column(name = "highest_streak", nullable = false)
    private int highestStreak = 0;

    @Builder.Default
    @Column(name = "total_play_time_minutes", nullable = false)
    private long totalPlayTimeMinutes = 0;

    @Column(name = "last_puzzle_completed")
    private LocalDateTime lastPuzzleCompleted;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    public void prePersist() {
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}