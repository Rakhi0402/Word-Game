package com.kungfu.wordquest.user.repository;

import com.kungfu.wordquest.user.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {
}
