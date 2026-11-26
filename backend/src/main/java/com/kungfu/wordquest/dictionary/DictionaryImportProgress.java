package com.kungfu.wordquest.dictionary;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DictionaryImportProgress {
    /** IDLE | RUNNING | COMPLETED | FAILED */
    String status;
    String message;
    long processed;
    long accepted;
    long rejected;
    long duplicates;
    long updated;
    long allowedCount;
    String source;
    String sourceVersion;
}
