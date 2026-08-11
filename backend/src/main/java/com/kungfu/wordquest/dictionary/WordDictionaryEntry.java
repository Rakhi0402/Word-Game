package com.kungfu.wordquest.dictionary;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "word_dictionary",
        indexes = {
                @Index(name = "idx_word_dict_normalized", columnList = "normalized_word", unique = true),
                @Index(name = "idx_word_dict_allowed_len", columnList = "allowed, word_length"),
                @Index(name = "idx_word_dict_difficulty", columnList = "difficulty"),
                @Index(name = "idx_word_dict_source_ver", columnList = "source, source_version")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordDictionaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Original surface form retained for auditing (usually lowercase). */
    @Column(nullable = false, length = 64)
    private String word;

    @Column(name = "normalized_word", nullable = false, length = 64, unique = true)
    private String normalizedWord;

    @Column(name = "word_length", nullable = false)
    private int wordLength;

    /** Higher = more common. Null if frequency source unavailable. */
    @Column(name = "frequency_score")
    private Double frequencyScore;

    @Column(name = "frequency_rank")
    private Integer frequencyRank;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private VocabularyDifficulty difficulty;

    @Column(nullable = false, length = 32)
    private String source;

    @Column(name = "source_version", nullable = false, length = 64)
    private String sourceVersion;

    @Builder.Default
    @Column(nullable = false)
    private boolean allowed = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
