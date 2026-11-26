package com.kungfu.wordquest.puzzle.repository;

import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPuzzleSessionRepository extends JpaRepository<UserPuzzleSession, UUID> {
    Optional<UserPuzzleSession> findByUserIdAndPuzzleId(UUID userId, Long puzzleId);

    @Query("""
            SELECT s.completedAt FROM UserPuzzleSession s
            WHERE s.user.id = :userId
              AND s.completed = true
              AND s.completedAt IS NOT NULL
              AND s.completedAt >= :since
            ORDER BY s.completedAt DESC
            """)
    List<LocalDateTime> findCompletedAtSince(
            @Param("userId") UUID userId,
            @Param("since") LocalDateTime since);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserPuzzleSession s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
