package com.kungfu.wordquest.user.repository;

import com.kungfu.wordquest.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // ==========================
    // Authentication
    // ==========================

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    // ==========================
    // Profile
    // ==========================

    @EntityGraph(attributePaths = "stats")
    Optional<User> findWithStatsById(UUID id);

    @EntityGraph(attributePaths = "stats")
    Optional<User> findWithStatsByUsername(String username);

    // ==========================
    // Leaderboard (XP DESC, id ASC — deterministic ties)
    // ==========================

    @Query("""
            SELECT u FROM User u
            WHERE u.enabled = true
            ORDER BY u.xp DESC, u.id ASC
            """)
    Page<User> findLeaderboardPage(Pageable pageable);

    /**
     * Number of enabled users ranked strictly above (xp, id) under
     * ORDER BY xp DESC, id ASC.
     */
    @Query("""
            SELECT COUNT(u) FROM User u
            WHERE u.enabled = true
              AND (u.xp > :xp OR (u.xp = :xp AND u.id < :id))
            """)
    long countRankedAbove(@Param("xp") int xp, @Param("id") UUID id);

    List<User> findTop20ByOrderByXpDesc();

    List<User> findTop20ByOrderByCoinsDesc();

    // ==========================
    // Daily Reward / Scheduler
    // ==========================

    List<User> findByLastPlayedBefore(LocalDateTime dateTime);

    // ==========================
    // Admin
    // ==========================

    long countByRole(com.kungfu.wordquest.user.entity.UserRole role);

    @EntityGraph(attributePaths = "stats")
    @Query("""
            SELECT u FROM User u
            WHERE (:q IS NULL OR :q = ''
               OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY u.createdAt DESC
            """)
    Page<User> searchAdminUsers(@Param("q") String q, Pageable pageable);

    @Query("""
            SELECT u
            FROM User u
            ORDER BY u.createdAt DESC
            """)
    List<User> findRecentlyRegisteredUsers();

}