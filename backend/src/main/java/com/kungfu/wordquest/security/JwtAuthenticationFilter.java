package com.kungfu.wordquest.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/v1/auth/register")
                || path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/refresh")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String jwt = tokenProvider.resolveToken(request);
            String path = request.getServletPath();

            if (StringUtils.hasText(jwt)
                    && tokenProvider.validateToken(jwt)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                String type = tokenProvider.getTokenType(jwt);
                if (!"ACCESS".equals(type)) {
                    // #region agent log
                    try {
                        java.nio.file.Files.writeString(
                                java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                                "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"E\",\"location\":\"JwtAuthenticationFilter\",\"message\":\"Non-ACCESS token on protected path\",\"data\":{\"path\":\""
                                        + path
                                        + "\",\"type\":\""
                                        + type
                                        + "\"},\"timestamp\":"
                                        + System.currentTimeMillis()
                                        + "}\n",
                                java.nio.file.StandardOpenOption.CREATE,
                                java.nio.file.StandardOpenOption.APPEND);
                    } catch (Exception ignored) {
                    }
                    // #endregion
                    filterChain.doFilter(request, response);
                    return;
                }

                String username = tokenProvider.getUsernameFromJWT(jwt);
                CustomUserDetails userDetails =
                        (CustomUserDetails) userDetailsService.loadUserByUsername(username);

                Integer tokenVer = tokenProvider.getTokenVersion(jwt);
                if (tokenVer != null && tokenVer != userDetails.getUser().getTokenVersion()) {
                    // #region agent log
                    try {
                        java.nio.file.Files.writeString(
                                java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                                "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"B\",\"location\":\"JwtAuthenticationFilter\",\"message\":\"tokenVersion mismatch\",\"data\":{\"path\":\""
                                        + path
                                        + "\",\"tokenVer\":"
                                        + tokenVer
                                        + ",\"userVer\":"
                                        + userDetails.getUser().getTokenVersion()
                                        + "},\"timestamp\":"
                                        + System.currentTimeMillis()
                                        + "}\n",
                                java.nio.file.StandardOpenOption.CREATE,
                                java.nio.file.StandardOpenOption.APPEND);
                    } catch (Exception ignored) {
                    }
                    // #endregion
                    filterChain.doFilter(request, response);
                    return;
                }

                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token");
            // #region agent log
            try {
                java.nio.file.Files.writeString(
                        java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                        "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"C\",\"location\":\"JwtAuthenticationFilter.catch\",\"message\":\"ExpiredJwtException escaped validateToken\",\"data\":{\"path\":\""
                                + request.getServletPath()
                                + "\"},\"timestamp\":"
                                + System.currentTimeMillis()
                                + "}\n",
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignored) {
            }
            // #endregion
        } catch (JwtException ex) {
            log.warn("Invalid JWT token");
        } catch (Exception ex) {
            log.error("Authentication error", ex);
        }
        // #region agent log
        if (StringUtils.hasText(tokenProvider.resolveToken(request))
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                java.nio.file.Files.writeString(
                        java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                        "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"A\",\"location\":\"JwtAuthenticationFilter.exit\",\"message\":\"Request continues unauthenticated with Bearer present\",\"data\":{\"path\":\""
                                + request.getServletPath()
                                + "\",\"method\":\""
                                + request.getMethod()
                                + "\"},\"timestamp\":"
                                + System.currentTimeMillis()
                                + "}\n",
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignored) {
            }
        }
        // #endregion
        filterChain.doFilter(request, response);
    }
}
