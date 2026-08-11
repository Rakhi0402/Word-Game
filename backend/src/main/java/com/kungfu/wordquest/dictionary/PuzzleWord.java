package com.kungfu.wordquest.dictionary;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Immutable snapshot of a playable word for a specific puzzle.
 * Gameplay validates against this table — never against the live dictionary.
 */
@Entity
@Table(
        name = "puzzle_words",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_puzzle_word",
                columnNames = {"puzzle_id", "normalized_word"}
        ),
        indexes = {
                @Index(name = "idx_puzzle_words_puzzle", columnList = "puzzle_id"),
                @Index(name = "idx_puzzle_words_lookup", columnList = "puzzle_id, normalized_word")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PuzzleWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "puzzle_id", nullable = false)
    private Puzzle puzzle;

    @Column(name = "normalized_word", nullable = false, length = 64)
    private String normalizedWord;

    /** Display / session form (uppercase). */
    @Column(name = "display_word", nullable = false, length = 64)
    private String displayWord;

    @Builder.Default
    @Column(name = "is_pangram", nullable = false)
    private boolean pangram = false;
}
