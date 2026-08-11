package com.kungfu.wordquest.economy;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProgressionServiceTest {

    private final ProgressionService progressionService = new ProgressionService();

    @Test
    void whiteBeltAtZeroXp() {
        var p = progressionService.resolve(0);
        assertEquals("White", p.belt());
        assertEquals("Novice Disciple", p.rank());
        assertEquals(1, p.dojoLevel());
        assertEquals(0, p.xpForCurrentBelt());
        assertEquals(500, p.xpForNextBelt());
        assertEquals(0, p.xpProgress());
        assertEquals(0, p.xpProgressPercentage());
        assertFalse(p.isMaxBelt());
    }

    @Test
    void yellowBeltAt500() {
        var p = progressionService.resolve(500);
        assertEquals("Yellow", p.belt());
        assertEquals("Temple Initiate", p.rank());
        assertEquals(2, p.dojoLevel());
        assertEquals(500, p.xpForCurrentBelt());
        assertEquals(1000, p.xpForNextBelt());
        assertEquals(0, p.xpProgress());
    }

    @Test
    void midYellowProgressPercentage() {
        var p = progressionService.resolve(750);
        assertEquals("Yellow", p.belt());
        assertEquals(250, p.xpProgress());
        assertEquals(50, p.xpProgressPercentage());
    }

    @Test
    void blackBeltIsMax() {
        var p = progressionService.resolve(10000);
        assertEquals("Black", p.belt());
        assertEquals("Dragon Master", p.rank());
        assertEquals(7, p.dojoLevel());
        assertTrue(p.isMaxBelt());
        assertEquals(100, p.xpProgressPercentage());
    }

    @Test
    void beltThresholdsMatchRewardsTs() {
        assertEquals("White", progressionService.beltForXp(0));
        assertEquals("Yellow", progressionService.beltForXp(500));
        assertEquals("Orange", progressionService.beltForXp(1000));
        assertEquals("Green", progressionService.beltForXp(2500));
        assertEquals("Blue", progressionService.beltForXp(5000));
        assertEquals("Brown", progressionService.beltForXp(7000));
        assertEquals("Black", progressionService.beltForXp(10000));
    }
}
