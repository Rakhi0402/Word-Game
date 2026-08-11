package com.kungfu.wordquest.puzzle.entity;

import com.kungfu.wordquest.common.StringListConverter;
import com.kungfu.wordquest.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_puzzle_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "puzzle_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPuzzleSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    private Puzzle puzzle;

    @Column(name = "words_found", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> wordsFound;

    @Column(name = "hinted_words", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> hintedWords;

    @Column(name = "current_score")
    private int currentScore;

    @Column(name = "current_streak")
    private int currentStreak;

    private boolean completed;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
