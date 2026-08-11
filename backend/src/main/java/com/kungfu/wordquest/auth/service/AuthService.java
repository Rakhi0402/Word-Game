package com.kungfu.wordquest.auth.service;

import com.kungfu.wordquest.auth.dto.AuthResponse;
import com.kungfu.wordquest.auth.dto.LoginRequest;
import com.kungfu.wordquest.auth.dto.RegisterRequest;
import com.kungfu.wordquest.auth.dto.RegisterResponse;
import com.kungfu.wordquest.auth.mapper.UserResponseMapper;
import com.kungfu.wordquest.card.entity.UserCard;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ConflictException;
import com.kungfu.wordquest.common.exception.ErrorCode;
import com.kungfu.wordquest.common.exception.UnauthorizedException;
import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.security.CustomUserDetails;
import com.kungfu.wordquest.security.JwtTokenProvider;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final UserCardRepository userCardRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final LeaderboardService leaderboardService;

    public RegisterResponse register(RegisterRequest request) {
        String username = request.getUserName().trim();
        String email = request.getUserEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException(ErrorCode.DUPLICATE_RESOURCE, "Username already taken.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException(ErrorCode.DUPLICATE_RESOURCE, "Email already registered.");
        }

        String encoded = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(encoded)
                .legacyPassword(encoded)
                .role(UserRole.ROLE_USER)
                .coins(GameEconomy.STARTING_COINS)
                .build();

        UserStats stats = UserStats.builder()
                .user(user)
                .cardsCollected(1)
                .build();
        user.setStats(stats);

        User savedUser;
        savedUser = userRepository.save(user);


        cardRepository.findById("po_common").ifPresent(card -> {
            int charges = GameEconomy.starTier(card.getStars()).charges();
            UserCard starterCard = UserCard.builder()
                    .user(savedUser)
                    .card(card)
                    .count(1)
                    .chargesRemaining(charges)
                    .status("available")
                    .build();
            userCardRepository.save(starterCard);
        });

        try {
            leaderboardService.updateScore(savedUser.getUsername(), savedUser.getXp());
        } catch (Exception ignored) {
            // Redis optional for auth; registration must succeed without leaderboard
        }

        return RegisterResponse.builder()
                .message("Registration successful")
                .user(UserResponseMapper.toResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getUserEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid email or password");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        principal.getUser().setLastLogin(LocalDateTime.now());
        userRepository.save(principal.getUser());

        return AuthResponse.builder()
                .accessToken(tokenProvider.generateAccessToken(authentication))
                .refreshToken(tokenProvider.generateRefreshToken(authentication))
                .user(UserResponseMapper.toResponse(principal.getUser()))
                .build();
    }

    public AuthResponse refresh(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            // #region agent log
            try {
                boolean expired = tokenProvider.isExpired(refreshToken);
                java.nio.file.Files.writeString(
                        java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                        "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"B\",\"location\":\"AuthService.refresh\",\"message\":\"Refresh token invalid\",\"data\":{\"expired\":"
                                + expired
                                + "},\"timestamp\":"
                                + System.currentTimeMillis()
                                + "}\n",
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignored) {
            }
            // #endregion
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Invalid refresh token.");
        }

        String type = tokenProvider.extractClaims(refreshToken).get("type", String.class);
        if (!"REFRESH".equals(type)) {
            // #region agent log
            try {
                java.nio.file.Files.writeString(
                        java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                        "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"E\",\"location\":\"AuthService.refresh\",\"message\":\"Wrong token type for refresh\",\"data\":{\"type\":\""
                                + type
                                + "\"},\"timestamp\":"
                                + System.currentTimeMillis()
                                + "}\n",
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignored) {
            }
            // #endregion
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Token is not a refresh token.");
        }

        Integer tokenVer = tokenProvider.extractClaims(refreshToken).get("ver", Integer.class);
        String username = tokenProvider.getUsernameFromJWT(refreshToken);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Invalid refresh token."));

        if (tokenVer != null && tokenVer != user.getTokenVersion()) {
            // #region agent log
            try {
                java.nio.file.Files.writeString(
                        java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                        "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"B\",\"location\":\"AuthService.refresh\",\"message\":\"Refresh revoked via tokenVersion\",\"data\":{\"tokenVer\":"
                                + tokenVer
                                + ",\"userVer\":"
                                + user.getTokenVersion()
                                + "},\"timestamp\":"
                                + System.currentTimeMillis()
                                + "}\n",
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND);
            } catch (Exception ignored) {
            }
            // #endregion
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Refresh token has been revoked.");
        }

        CustomUserDetails details = new CustomUserDetails(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                details, null, details.getAuthorities());

        return AuthResponse.builder()
                .accessToken(tokenProvider.generateAccessToken(authentication))
                .refreshToken(tokenProvider.generateRefreshToken(authentication))
                .user(UserResponseMapper.toResponse(user))
                .build();
    }

    public void logout(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Not authenticated."));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        SecurityContextHolder.clearContext();
    }
}
