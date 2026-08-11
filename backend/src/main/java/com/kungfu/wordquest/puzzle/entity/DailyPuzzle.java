package com.kungfu.wordquest.puzzle.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** Maps one game date → one immutable Puzzle. */
@Entity
@Table(
        name = "daily_puzzles",
        uniqueConstraints = @UniqueConstraint(name = "uk_daily_scheduled_date", columnNames = "scheduled_date")
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyPuzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "puzzle_id", nullable = false)
    private Puzzle puzzle;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
