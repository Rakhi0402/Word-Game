package com.kungfu.wordquest.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kungfu.wordquest.ai.dto.GroqLetterProposalResponse;
import com.kungfu.wordquest.common.exception.ValidationException;
import com.kungfu.wordquest.puzzle.enums.PuzzleDifficulty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Thin Groq Chat Completions client. Proposes letter hives only — never trusted for word lists.
 */
@Component
@Slf4j
public class GroqClient {

    private final GroqProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GroqClient(GroqProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.min(properties.getTimeoutMs(), 15_000)))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofMillis(properties.getTimeoutMs()));
        this.restClient = RestClient.builder()
                .baseUrl(trimSlash(properties.getBaseUrl()))
                .requestFactory(factory)
                .build();
    }

    public boolean isAvailable() {
        return properties.isConfigured();
    }

    public GroqLetterProposalResponse proposeLetterSets(PuzzleDifficulty difficulty, int count) {
        if (!properties.isConfigured()) {
            throw new ValidationException(
                    "Groq is not configured. Set GROQ_API_KEY in the backend environment.");
        }
        int n = Math.max(1, Math.min(count, 20));
        String system = """
                You design Spelling Bee style letter hives for an English word game.
                Rules for each candidate:
                - Exactly 7 DISTINCT uppercase letters A-Z.
                - centerLetter must be one of those 7 letters.
                - Prefer vowel-rich sets (include at least 2 vowels among A E I O U).
                - Avoid Q unless U is also present.
                - Aim for hives that yield MANY common English words of length >= 4 that must use the center letter.
                - Do NOT list valid words. Only propose letters, centerLetter, difficulty, optional themeHint.
                Respond with JSON only matching:
                {"candidates":[{"letters":["A","B","C","D","E","F","G"],"centerLetter":"A","difficulty":"MEDIUM","themeHint":"..."}]}
                """;
        String user = "Propose " + n + " distinct letter hives for difficulty " + difficulty.name()
                + ". Each must have difficulty \"" + difficulty.name() + "\".";

        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "temperature", properties.getTemperature(),
                "max_tokens", properties.getMaxTokens(),
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                )
        );

        try {
            String raw = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + properties.getApiKey().trim())
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (raw == null || raw.isBlank()) {
                throw new ValidationException("Groq returned an empty response.");
            }
            JsonNode root = objectMapper.readTree(raw);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new ValidationException("Groq response missing message content.");
            }
            String json = content.asText().trim();
            GroqLetterProposalResponse parsed =
                    objectMapper.readValue(json, GroqLetterProposalResponse.class);
            if (parsed.getCandidates() == null) {
                parsed.setCandidates(List.of());
            }
            return parsed;
        } catch (ValidationException ex) {
            throw ex;
        } catch (RestClientException ex) {
            log.warn("Groq HTTP error: {}", ex.getMessage());
            throw new ValidationException("Groq API request failed: " + ex.getMessage());
        } catch (Exception ex) {
            log.warn("Groq parse/error: {}", ex.getMessage());
            throw new ValidationException("Failed to parse Groq letter proposals: " + ex.getMessage());
        }
    }

    private static String trimSlash(String base) {
        if (base == null || base.isBlank()) {
            return "https://api.groq.com/openai/v1";
        }
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
