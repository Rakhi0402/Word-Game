package com.kungfu.wordquest.dictionary;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Historical determinism: puzzle word snapshots are not recalculated from the live dictionary.
 */
@ExtendWith(MockitoExtension.class)
class PuzzleWordHistoricalDeterminismTest {

    @Mock PuzzleWordRepository puzzleWordRepository;
    @InjectMocks PuzzleWordSnapshotService snapshotService;

    private final WordNormalizer normalizer = new WordNormalizer();

    @Test
    void snapshotPersistsWordsIndependentlyOfLaterDictionary() {
        snapshotService = new PuzzleWordSnapshotService(puzzleWordRepository, normalizer);
        Puzzle puzzle = Puzzle.builder()
                .id(UUID.randomUUID())
                .letters(List.of("A", "P", "L", "E", "X", "T", "R"))
                .centerLetter("A")
                .validWords(List.of("APPLE", "PALE"))
                .pangrams(List.of())
                .difficulty(PuzzleDifficulty.EASY)
                .build();

        snapshotService.replaceSnapshot(puzzle, List.of("APPLE", "PALE"), List.of());

        ArgumentCaptor<PuzzleWord> captor = ArgumentCaptor.forClass(PuzzleWord.class);
        verify(puzzleWordRepository, atLeast(2)).save(captor.capture());
        assertTrue(captor.getAllValues().stream().anyMatch(w -> "apple".equals(w.getNormalizedWord())));

        // Later dictionary change would not call replaceSnapshot again — gameplay uses exists lookup:
        when(puzzleWordRepository.existsByPuzzleIdAndNormalizedWord(puzzle.getId(), "apple")).thenReturn(true);
        when(puzzleWordRepository.existsByPuzzleIdAndNormalizedWord(puzzle.getId(), "zebra")).thenReturn(false);

        assertTrue(snapshotService.isPlayableWord(puzzle.getId(), "APPLE"));
        assertFalse(snapshotService.isPlayableWord(puzzle.getId(), "ZEBRA"));
    }
}
