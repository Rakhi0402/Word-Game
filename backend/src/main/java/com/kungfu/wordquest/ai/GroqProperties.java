package com.kungfu.wordquest.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "groq")
public class GroqProperties {

    /** Master switch; still requires a non-blank api-key to call Groq. */
    private boolean enabled = true;

    private String apiKey = "";

    private String baseUrl = "https://api.groq.com/openai/v1";

    /** Default: current Groq production model (llama-3.3-70b-versatile deprecated Aug 2026). */
    private String model = "openai/gpt-oss-20b";

    private int timeoutMs = 60_000;

    private int maxTokens = 2048;

    private double temperature = 0.7;

    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
