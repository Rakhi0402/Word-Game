package com.kungfu.wordquest.dictionary;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DictionaryImportResult {
    String source;
    String sourceVersion;
    long processed;
    long accepted;
    long rejected;
    long duplicates;
    long updated;
}
