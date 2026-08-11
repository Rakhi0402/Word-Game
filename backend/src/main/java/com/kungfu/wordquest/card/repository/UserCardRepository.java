package com.kungfu.wordquest.card.repository;

import com.kungfu.wordquest.card.entity.UserCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCardRepository extends JpaRepository<UserCard, UUID> {
    List<UserCard> findByUserId(UUID userId);

    @Query("""
            SELECT uc FROM UserCard uc
            JOIN FETCH uc.card
            WHERE uc.user.id = :userId
            """)
    List<UserCard> findByUserIdWithCard(@Param("userId") UUID userId);

    Optional<UserCard> findByUserIdAndCardId(UUID userId, String cardId);

    /** Bulk delete so the unique (user_id, card_id) row is gone before re-inserting starter cards. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserCard uc WHERE uc.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
