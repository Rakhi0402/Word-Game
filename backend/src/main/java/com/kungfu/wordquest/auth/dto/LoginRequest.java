package com.kungfu.wordquest.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kungfu.wordquest.auth.validation.AuthPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @JsonProperty("userEmail")
    @NotBlank(message = "Email is required")
    @Size(max = 120, message = "Email must be at most 120 characters")
    @Pattern(regexp = AuthPatterns.EMAIL, message = AuthPatterns.EMAIL_MESSAGE)
    private String userEmail;

    @NotBlank(message = "Password is required")
    @Size(min = 1, max = 40, message = "Password is required")
    @Pattern(regexp = AuthPatterns.PASSWORD_PATTERN, message = AuthPatterns.PASSWORD_MESSAGE)
    private String password;
}
