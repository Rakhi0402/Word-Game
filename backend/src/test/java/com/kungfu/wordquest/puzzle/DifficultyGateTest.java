package com.kungfu.wordquest.puzzle;

import com.kungfu.wordquest.puzzle.config.PuzzleProperties;
import com.kungfu.wordquest.puzzle.engine.DifficultyGate;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DifficultyGateTest {

    private DifficultyGate gate;

    @BeforeEach
    void setUp() {
        PuzzleProperties props = new PuzzleProperties();
        gate = new DifficultyGate(props);
    }

    @Test
    void easyRequiresLargeEnoughListAndPangram() {
        assertFalse(gate.passes(PuzzleDifficulty.EASY, 19, 1));
        assertTrue(gate.passes(PuzzleDifficulty.EASY, 20, 1));
        assertFalse(gate.passes(PuzzleDifficulty.EASY, 25, 0));
    }

    @Test
    void expertRequiresTwoPangrams() {
        assertFalse(gate.passes(PuzzleDifficulty.EXPERT, 80, 1));
        assertTrue(gate.passes(PuzzleDifficulty.EXPERT, 70, 2));
    }

    @Test
    void randomBandAppliesSoftMax() {
        assertTrue(gate.passesRandomBand(PuzzleDifficulty.EASY, 30, 1));
        assertFalse(gate.passesRandomBand(PuzzleDifficulty.EASY, 50, 1));
        assertTrue(gate.passes(PuzzleDifficulty.EASY, 50, 1));
    }
}
