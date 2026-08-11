package com.kungfu.wordquest.puzzle.entity;

import com.kungfu.wordquest.common.StringListConverter;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Immutable playable puzzle definition (candidate pool + historically scheduled).
 * Date assignment lives on {@link DailyPuzzle}; {@code puzzleDate} is kept nullable for legacy rows.
 */
@Entity
@Table(
        name = "puzzles",
        indexes = {
                @Index(name = "idx_puzzle_date", columnList = "puzzle_date"),
                @Index(name = "idx_puzzle_difficulty", columnList = "difficulty"),
                @Index(name = "idx_puzzle_fingerprint", columnList = "fingerprint")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Puzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Legacy / denormalized schedule hint — prefer DailyPuzzle. Nullable for pool candidates. */
    @Column(name = "puzzle_date")
    private LocalDate puzzleDate;

    @Convert(converter = StringListConverter.class)
    @Column(nullable = false)
    private List<String> letters;

    @Column(nullable = false, length = 1)
    private String centerLetter;

    /** Persisted playable word set — authoritative for submit validation (immutable after insert). */
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT", nullable = false)
    private List<String> validWords;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT", nullable = false)
    private List<String> pangrams;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PuzzleDifficulty difficulty;

    @Builder.Default
    @ColumnDefault("4")
    @Column(name = "minimum_word_length", nullable = false)
    private int minimumWordLength = 4;

    @Column(nullable = false)
    private int targetWordCount;

    @Column(nullable = false)
    private int pangramCount;

    @Column(nullable = false)
    private int xpReward;

    @Column(nullable = false)
    private int coinReward;

    @Builder.Default
    @Column(nullable = false)
    private int maxScore = 0;

    @Builder.Default
    @Column(nullable = false)
    private int availableHints = 3;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    /** Deterministic uniqueness key: letters+center+difficulty. */
    @Column(length = 64, unique = true)
    private String fingerprint;

    @Column(name = "generation_batch_id", length = 64)
    private String generationBatchId;

    /** Dictionary sourceVersion used when this puzzle's word set was snapshotted. */
    @Column(name = "dictionary_source_version", length = 64)
    private String dictionarySourceVersion;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (targetWordCount == 0) {
            targetWordCount = validWords == null ? 0 : validWords.size();
        }
        if (pangramCount == 0) {
            pangramCount = pangrams == null ? 0 : pangrams.size();
        }
        if (minimumWordLength <= 0) {
            minimumWordLength = 4;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
