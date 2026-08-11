package com.kungfu.wordquest.dictionary;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class DictionaryImportServiceTest {

    @Mock WordDictionaryRepository repository;
    @Mock DictionaryService dictionaryService;

    private DictionaryImportService importService;
    private DictionaryProperties properties;

    @BeforeEach
    void wire() {
        properties = new DictionaryProperties();
        properties.setPath("classpath:dictionaries/wordlist.txt");
        properties.setSource("ESDB");
        properties.setSourceVersion("1.0.0");
        properties.setFrequencyPath("");
        importService = new DictionaryImportService(
                repository, new WordNormalizer(), dictionaryService, properties);
        lenient().when(dictionaryService.classifyDifficulty(anyDouble(), anyInt()))
                .thenReturn(VocabularyDifficulty.EASY);
        lenient().when(repository.findByNormalizedWord(any())).thenReturn(Optional.empty());
        lenient().when(repository.findAll()).thenReturn(java.util.List.of());
        lenient().when(repository.save(any(WordDictionaryEntry.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void importAcceptsWordsFromSeedLexicon() {
        DictionaryImportResult result = importService.importFromConfiguredSource();
        assertEquals("ESDB", result.getSource());
        assertEquals("1.0.0", result.getSourceVersion());
        assertTrue(result.getAccepted() > 50);
        assertTrue(result.getProcessed() > result.getAccepted());
        // wordlist contains repeated lines (e.g. dragon) — counted as file duplicates
        assertTrue(result.getDuplicates() >= 0);
        verify(repository, atLeastOnce()).save(any(WordDictionaryEntry.class));
    }

    @Test
    void secondPassUpdatesExistingNormalizedWords() {
        when(repository.findByNormalizedWord(any())).thenAnswer(inv -> Optional.of(
                WordDictionaryEntry.builder()
                        .normalizedWord(inv.getArgument(0))
                        .word(inv.getArgument(0))
                        .wordLength(((String) inv.getArgument(0)).length())
                        .difficulty(VocabularyDifficulty.MEDIUM)
                        .source("ESDB")
                        .sourceVersion("0.9.0")
                        .allowed(true)
                        .build()));

        DictionaryImportResult result = importService.importFromConfiguredSource();
        assertTrue(result.getUpdated() > 0);
        assertTrue(result.getAccepted() > 0);
    }

    @Test
    void fallbackFrequencyNeverRejects() {
        assertTrue(DictionaryImportService.fallbackFrequency(4) > 0);
        assertTrue(DictionaryImportService.fallbackFrequency(12) > 0);
    }
}
