package com.kungfu.wordquest.card.repository;

import com.kungfu.wordquest.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CardRepository extends JpaRepository<Card, String> {
}
