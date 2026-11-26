package com.kungfu.wordquest.puzzle.repository;

import com.kungfu.wordquest.puzzle.entity.DailyPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyPuzzleRepository extends JpaRepository<DailyPuzzle, UUID> {

    boolean existsByScheduledDate(LocalDate scheduledDate);

    boolean existsByPuzzle_Id(Long puzzleId);

    Optional<DailyPuzzle> findByScheduledDate(LocalDate scheduledDate);

    @Query("""
            SELECT d FROM DailyPuzzle d
            JOIN FETCH d.puzzle p
            WHERE d.scheduledDate = :date
            """)
    Optional<DailyPuzzle> findByScheduledDateWithPuzzle(@Param("date") LocalDate date);
}
