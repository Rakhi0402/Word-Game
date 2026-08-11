package com.kungfu.wordquest.dictionary;

import com.kungfu.wordquest.puzzle.entity.Puzzle;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Persists immutable per-puzzle playable word snapshots.
 */
@Service
@RequiredArgsConstructor
public class PuzzleWordSnapshotService {

    private final PuzzleWordRepository puzzleWordRepository;
    private final WordNormalizer normalizer;

    @Transactional
    public void replaceSnapshot(Puzzle puzzle, List<String> playableWords, List<String> pangrams) {
        if (puzzle.getId() == null) {
            throw new IllegalArgumentException("Puzzle must be persisted before snapshotting words");
        }
        puzzleWordRepository.deleteAllByPuzzleId(puzzle.getId());

        Set<String> pangramSet = new HashSet<>();
        if (pangrams != null) {
            for (String p : pangrams) {
                normalizer.normalize(p).ifPresent(pangramSet::add);
            }
        }

        Set<String> seen = new HashSet<>();
        for (String raw : playableWords) {
            var n = normalizer.normalize(raw);
            if (n.isEmpty() || !seen.add(n.get())) {
                continue;
            }
            String normalized = n.get();
            puzzleWordRepository.save(PuzzleWord.builder()
                    .puzzle(puzzle)
                    .normalizedWord(normalized)
                    .displayWord(normalizer.toDisplay(normalized))
                    .pangram(pangramSet.contains(normalized))
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public boolean isPlayableWord(UUID puzzleId, String rawWord) {
        return normalizer.normalize(rawWord)
                .map(n -> puzzleWordRepository.existsByPuzzleIdAndNormalizedWord(puzzleId, n))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isPangramSnapshot(UUID puzzleId, String rawWord) {
        return normalizer.normalize(rawWord)
                .flatMap(n -> puzzleWordRepository.findByPuzzleIdAndNormalizedWord(puzzleId, n))
                .map(PuzzleWord::isPangram)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public long countWords(UUID puzzleId) {
        return puzzleWordRepository.countByPuzzleId(puzzleId);
    }

    @Transactional(readOnly = true)
    public List<String> displayWords(UUID puzzleId) {
        return puzzleWordRepository.findByPuzzleId(puzzleId).stream()
                .map(PuzzleWord::getDisplayWord)
                .toList();
    }
}
