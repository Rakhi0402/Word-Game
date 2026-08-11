package com.kungfu.wordquest.security;

import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;
    private CustomUserDetails details;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(
                "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy0zMi1ieXRlcw==",
                3_600_000L,
                86_400_000L
        );
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("Rakhi")
                .email("rakhi@example.com")
                .passwordHash("x")
                .role(UserRole.ROLE_USER)
                .tokenVersion(2)
                .build();
        details = new CustomUserDetails(user);
    }

    @Test
    void generateAndValidateAccessToken() {
        var auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        String token = provider.generateAccessToken(auth);

        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUsernameFromJWT(token)).isEqualTo("Rakhi");
        assertThat(provider.getTokenType(token)).isEqualTo("ACCESS");
        assertThat(provider.getTokenVersion(token)).isEqualTo(2);
        assertThat(provider.getUserIdFromJWT(token)).isEqualTo(details.getId());
    }

    @Test
    void expiredToken_isInvalid() {
        JwtTokenProvider shortLived = new JwtTokenProvider(
                "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy0zMi1ieXRlcw==",
                1L,
                86_400_000L
        );
        var auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        String token = shortLived.generateAccessToken(auth);
        try {
            Thread.sleep(5);
        } catch (InterruptedException ignored) {
        }
        assertThat(shortLived.validateToken(token)).isFalse();
        assertThat(shortLived.isExpired(token)).isTrue();
    }
}
