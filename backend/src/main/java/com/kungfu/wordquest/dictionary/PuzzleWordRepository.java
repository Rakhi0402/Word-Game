package com.kungfu.wordquest.dictionary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PuzzleWordRepository extends JpaRepository<PuzzleWord, UUID> {

    boolean existsByPuzzleIdAndNormalizedWord(Long puzzleId, String normalizedWord);

    Optional<PuzzleWord> findByPuzzleIdAndNormalizedWord(Long puzzleId, String normalizedWord);

    List<PuzzleWord> findByPuzzleId(Long puzzleId);

    long countByPuzzleId(Long puzzleId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM PuzzleWord pw WHERE pw.puzzle.id = :puzzleId")
    void deleteAllByPuzzleId(@Param("puzzleId") Long puzzleId);
}
