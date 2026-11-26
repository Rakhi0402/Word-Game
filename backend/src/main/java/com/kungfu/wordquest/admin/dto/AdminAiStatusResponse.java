package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminAiStatusResponse {
    boolean groqConfigured;
    boolean dictionaryReady;
    long dictionaryAllowedCount;
    long minDictionaryWords;
    String model;
    String easyGate;
    String mediumGate;
    String hardGate;
    String expertGate;
}
