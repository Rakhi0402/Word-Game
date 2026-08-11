package com.kungfu.wordquest.dictionary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WordDictionaryRepository extends JpaRepository<WordDictionaryEntry, UUID> {

    Optional<WordDictionaryEntry> findByNormalizedWord(String normalizedWord);

    boolean existsByNormalizedWord(String normalizedWord);

    long countByAllowedTrueAndSourceVersion(String sourceVersion);

    long countByAllowedTrue();

    @Query("""
            SELECT w FROM WordDictionaryEntry w
            WHERE w.allowed = true
              AND w.wordLength >= :minLen
              AND w.wordLength <= :maxLen
            """)
    List<WordDictionaryEntry> findAllowedByLengthRange(
            @Param("minLen") int minLen,
            @Param("maxLen") int maxLen);

    @Query("""
            SELECT w.normalizedWord FROM WordDictionaryEntry w
            WHERE w.allowed = true
              AND w.wordLength >= :minLen
            """)
    List<String> findAllowedNormalizedWords(@Param("minLen") int minLen);
}
