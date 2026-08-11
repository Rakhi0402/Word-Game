package com.kungfu.wordquest.dictionary;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WordNormalizerTest {

    private final WordNormalizer normalizer = new WordNormalizer();

    @Test
    void lowercases() {
        assertEquals("apple", normalizer.normalize("Apple").orElseThrow());
        assertEquals("apple", normalizer.normalize("APPLE").orElseThrow());
    }

    @Test
    void rejectsHyphenSpaceDigits() {
        assertTrue(normalizer.normalize("hello-world").isEmpty());
        assertTrue(normalizer.normalize("hello world").isEmpty());
        assertTrue(normalizer.normalize("123hello").isEmpty());
        assertTrue(normalizer.normalize("don't").isEmpty());
    }

    @Test
    void playableRequiresMinLength() {
        assertTrue(normalizer.normalizePlayable("cat", 4).isEmpty());
        assertEquals("sand", normalizer.normalizePlayable("SAND", 4).orElseThrow());
    }

    @Test
    void displayUppercases() {
        assertEquals("APPLE", normalizer.toDisplay("apple"));
    }
}
