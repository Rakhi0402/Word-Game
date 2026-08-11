package com.kungfu.wordquest.dictionary;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DictionaryWordView {
    String normalizedWord;
    int wordLength;
    Double frequencyScore;
    Integer frequencyRank;
    VocabularyDifficulty difficulty;
    String source;
    String sourceVersion;
    boolean allowed;
}
