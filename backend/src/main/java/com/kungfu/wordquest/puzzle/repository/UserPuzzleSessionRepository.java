package com.kungfu.wordquest.puzzle.repository;

import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPuzzleSessionRepository extends JpaRepository<UserPuzzleSession, UUID> {
    Optional<UserPuzzleSession> findByUserIdAndPuzzleId(UUID userId, UUID puzzleId);
}
