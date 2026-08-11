package com.kungfu.wordquest.dictionary;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FrequencyData {
    double score;
    Integer rank;
    String source;
}
