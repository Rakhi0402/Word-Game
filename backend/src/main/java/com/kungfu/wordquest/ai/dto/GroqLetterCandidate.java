package com.kungfu.wordquest.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GroqLetterCandidate {
    private List<String> letters;
    private String centerLetter;
    private String difficulty;
    private String themeHint;
}
