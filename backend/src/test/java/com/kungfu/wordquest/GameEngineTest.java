package com.kungfu.wordquest;

import com.kungfu.wordquest.dictionary.WordNormalizer;
import com.kungfu.wordquest.puzzle.engine.*;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class GameEngineTest {

    private PuzzleValidator puzzleValidator;
    private CardBonusEvaluator cardBonusEvaluator;
    private ScoreCalculator scoreCalculator;
    private DifficultyAnalyzer difficultyAnalyzer;
    private HintGenerator hintGenerator;
    private WordNormalizer wordNormalizer;

    @BeforeEach
    public void setup() {
        wordNormalizer = new WordNormalizer();
        puzzleValidator = new PuzzleValidator(wordNormalizer);
        cardBonusEvaluator = new CardBonusEvaluator();
        scoreCalculator = new ScoreCalculator(cardBonusEvaluator);
        difficultyAnalyzer = new DifficultyAnalyzer();
        hintGenerator = new HintGenerator();
    }

    @Test
    public void testPuzzleLetterRulesWithoutDictionary() {
        List<Character> letters = Arrays.asList('A', 'D', 'N', 'P', 'S', 'T', 'G');
        char center = 'A';

        assertTrue(puzzleValidator.matchesLetterRules("PANDA", letters, center));
        assertFalse(puzzleValidator.matchesLetterRules("POST", letters, center));
        assertFalse(puzzleValidator.matchesLetterRules("AND", letters, center));
        assertFalse(puzzleValidator.matchesLetterRules("POND", letters, center));
    }

    @Test
    public void testPangramDetection() {
        List<Character> letters = Arrays.asList('A', 'D', 'N', 'P', 'S', 'T', 'G');
        assertTrue(puzzleValidator.isPangram("STANDGAP", letters));
        assertFalse(puzzleValidator.isPangram("PANDA", letters));
    }

    @Test
    public void testScoreCalculations() {
        int score1 = scoreCalculator.calculateWordPoints("PANDA", false, 0, null, 'A');
        assertEquals(50, score1);

        int score2 = scoreCalculator.calculateWordPoints("PANDA", false, 2, null, 'A');
        assertEquals(60, score2);

        int score3 = scoreCalculator.calculateWordPoints("PANDA", false, 2, "shifu_epic", 'A');
        assertEquals(70, score3);
    }

    @Test
    public void testCardPassiveModifiers() {
        int base = 50;
        assertEquals(100, cardBonusEvaluator.applyScoreModifier("PANDA", base, "mantis_rare", false, 'A'));
    }

    @Test
    public void testDifficultyIncludesExpert() {
        List<String> many = Arrays.asList(
                "AAAAAAAA", "BBBBBBBB", "CCCCCCCC", "DDDDDDDD", "EEEEEEEE",
                "FFFFFFFF", "GGGGGGGG", "HHHHHHHH", "IIIIIIII", "JJJJJJJJ",
                "KKKKKKKK", "LLLLLLLL", "MMMMMMMM", "NNNNNNNN", "OOOOOOOO",
                "PPPPPPPP", "QQQQQQQQ", "RRRRRRRR", "SSSSSSSS", "TTTTTTTT",
                "UUUUUUUU", "VVVVVVVV", "WWWWWWWW", "XXXXXXXX", "YYYYYYYY",
                "ZZZZZZZZ", "ABCDEFGH", "BCDEFGHI", "CDEFGHIJ", "DEFGHIJK",
                "EFGHIJKL", "FGHIJKLM", "GHIJKLMN", "HIJKLMNO", "IJKLMNOP",
                "JKLMNOPQ");
        assertEquals(PuzzleDifficulty.EXPERT,
                difficultyAnalyzer.analyzeDifficulty(many, List.of("ABCDEFG")));
    }

    @Test
    public void testHintGenerator() {
        assertNotNull(hintGenerator);
    }
}
