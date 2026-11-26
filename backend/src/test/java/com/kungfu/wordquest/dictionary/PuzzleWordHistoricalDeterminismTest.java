package com.kungfu.wordquest.dictionary;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Historical determinism: puzzle word snapshots are not recalculated from the live dictionary.
 */
@ExtendWith(MockitoExtension.class)
class PuzzleWordHistoricalDeterminismTest {

    @Mock PuzzleWordRepository puzzleWordRepository;
    @Mock EntityManager entityManager;

    private final WordNormalizer normalizer = new WordNormalizer();

    @Test
    void snapshotPersistsWordsIndependentlyOfLaterDictionary() {
        PuzzleWordSnapshotService snapshotService =
                new PuzzleWordSnapshotService(puzzleWordRepository, normalizer, entityManager);
        Puzzle puzzle = Puzzle.builder()
                .id(42L)
                .letters(List.of("A", "P", "L", "E", "X", "T", "R"))
                .centerLetter("A")
                .validWords(List.of("APPLE", "PALE"))
                .pangrams(List.of())
                .difficulty(PuzzleDifficulty.EASY)
                .build();

        snapshotService.replaceSnapshot(puzzle, List.of("APPLE", "PALE"), List.of());

        verify(entityManager).flush();
        ArgumentCaptor<PuzzleWord> captor = ArgumentCaptor.forClass(PuzzleWord.class);
        verify(puzzleWordRepository, atLeast(2)).save(captor.capture());
        assertTrue(captor.getAllValues().stream().anyMatch(w -> "apple".equals(w.getNormalizedWord())));

        when(puzzleWordRepository.existsByPuzzleIdAndNormalizedWord(puzzle.getId(), "apple")).thenReturn(true);
        when(puzzleWordRepository.existsByPuzzleIdAndNormalizedWord(puzzle.getId(), "zebra")).thenReturn(false);

        assertTrue(snapshotService.isPlayableWord(puzzle.getId(), "APPLE"));
        assertFalse(snapshotService.isPlayableWord(puzzle.getId(), "ZEBRA"));
    }
}
