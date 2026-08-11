package com.kungfu.wordquest.puzzle.repository;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PuzzleRepository extends JpaRepository<Puzzle, UUID> {

    Optional<Puzzle> findByPuzzleDate(LocalDate puzzleDate);

    boolean existsByPuzzleDate(LocalDate puzzleDate);

    boolean existsByFingerprint(String fingerprint);

    Optional<Puzzle> findByFingerprint(String fingerprint);

    List<Puzzle> findByActiveTrue();

    List<Puzzle> findByDifficulty(PuzzleDifficulty difficulty);

    @Query("""
            SELECT p FROM Puzzle p
            WHERE p.active = true
              AND p.difficulty = :difficulty
              AND p.id NOT IN (
                  SELECT d.puzzle.id FROM DailyPuzzle d
              )
            ORDER BY p.createdAt ASC
            """)
    List<Puzzle> findUnscheduledPoolByDifficulty(@Param("difficulty") PuzzleDifficulty difficulty);

    @Query("""
            SELECT p FROM Puzzle p
            WHERE p.active = true
              AND p.difficulty = :difficulty
              AND p.id NOT IN (
                  SELECT s.puzzle.id FROM UserPuzzleSession s
                  WHERE s.user.id = :userId AND s.completed = true
              )
            ORDER BY p.createdAt DESC
            """)
    List<Puzzle> findPlayableByDifficultyForUser(
            @Param("difficulty") PuzzleDifficulty difficulty,
            @Param("userId") UUID userId);

    @Query("""
            SELECT p FROM Puzzle p
            WHERE p.active = true
            ORDER BY p.createdAt DESC
            """)
    List<Puzzle> findRecentlyGeneratedPuzzles();

    @Query("""
            SELECT p FROM Puzzle p
            ORDER BY p.createdAt DESC
            """)
    List<Puzzle> findLatestPuzzles();
}
