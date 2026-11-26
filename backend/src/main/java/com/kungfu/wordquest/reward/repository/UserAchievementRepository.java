package com.kungfu.wordquest.reward.repository;

import com.kungfu.wordquest.reward.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {
    List<UserAchievement> findByUserId(UUID userId);

    @Query("""
            SELECT ua FROM UserAchievement ua
            JOIN FETCH ua.achievement
            WHERE ua.user.id = :userId
            """)
    List<UserAchievement> findByUserIdWithAchievement(@Param("userId") UUID userId);

    Optional<UserAchievement> findByUserIdAndAchievementId(UUID userId, String achievementId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserAchievement ua WHERE ua.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
