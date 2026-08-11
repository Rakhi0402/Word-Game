package com.kungfu.wordquest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Getter
@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenValidity;
    private final long refreshTokenValidity;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long accessTokenValidity,
            @Value("${jwt.refresh-expiration-ms}") long refreshTokenValidity) {

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }

        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    public String generateAccessToken(Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        return buildToken(user, accessTokenValidity, "ACCESS");
    }

    public String generateRefreshToken(Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        return buildToken(user, refreshTokenValidity, "REFRESH");
    }

    private String buildToken(CustomUserDetails user, long validity, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validity);

        List<String> roles = user.getAuthorities().stream()
                .map(Object::toString)
                .toList();

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("uid", user.getId().toString())
                .claim("email", user.getEmail())
                .claim("type", tokenType)
                .claim("roles", roles)
                .claim("ver", user.getUser().getTokenVersion())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        return extractClaims(token).getSubject();
    }

    public UUID getUserIdFromJWT(String token) {
        String uid = extractClaims(token).get("uid", String.class);
        return uid != null ? UUID.fromString(uid) : null;
    }

    public Integer getTokenVersion(String token) {
        return extractClaims(token).get("ver", Integer.class);
    }

    public String getTokenType(String token) {
        return extractClaims(token).get("type", String.class);
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT expired.");
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT.");
        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT.");
        } catch (SecurityException ex) {
            log.warn("JWT signature validation failed.");
        } catch (IllegalArgumentException ex) {
            log.warn("JWT is empty.");
        } catch (JwtException ex) {
            log.warn("JWT validation failed.");
        }
        return false;
    }

    public boolean isExpired(String token) {
        try {
            extractClaims(token);
            return false;
        } catch (ExpiredJwtException ex) {
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
