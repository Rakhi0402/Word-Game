package com.kungfu.wordquest.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GroqLetterProposalResponse {
    private List<GroqLetterCandidate> candidates = new ArrayList<>();
}
