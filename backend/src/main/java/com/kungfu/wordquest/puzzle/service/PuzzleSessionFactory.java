package com.kungfu.wordquest.puzzle.service;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.entity.UserPuzzleSession;
import com.kungfu.wordquest.puzzle.repository.UserPuzzleSessionRepository;
import com.kungfu.wordquest.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

/**
 * Creates puzzle sessions in a fresh transaction so concurrent inserts
 * that hit uk(user_id, puzzle_id) can recover without poisoning the caller TX.
 */
@Service
@RequiredArgsConstructor
public class PuzzleSessionFactory {

    private final UserPuzzleSessionRepository sessionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UserPuzzleSession getOrCreate(User user, Puzzle puzzle) {
        return sessionRepository.findByUserIdAndPuzzleId(user.getId(), puzzle.getId())
                .orElseGet(() -> insertIgnoringRace(user, puzzle));
    }

    private UserPuzzleSession insertIgnoringRace(User user, Puzzle puzzle) {
        try {
            return sessionRepository.saveAndFlush(UserPuzzleSession.builder()
                    .user(user)
                    .puzzle(puzzle)
                    .wordsFound(new ArrayList<>())
                    .hintedWords(new ArrayList<>())
                    .currentScore(0)
                    .currentStreak(0)
                    .completed(false)
                    .build());
        } catch (DataIntegrityViolationException ex) {
            return sessionRepository.findByUserIdAndPuzzleId(user.getId(), puzzle.getId())
                    .orElseThrow(() -> ex);
        }
    }
}
