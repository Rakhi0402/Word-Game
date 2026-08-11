package com.kungfu.wordquest.reward.repository;

import com.kungfu.wordquest.reward.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, String> {
}
