package com.kungfu.wordquest.auth;

import com.kungfu.wordquest.auth.dto.LoginRequest;
import com.kungfu.wordquest.auth.dto.RegisterRequest;
import com.kungfu.wordquest.auth.dto.RegisterResponse;
import com.kungfu.wordquest.auth.service.AuthService;
import com.kungfu.wordquest.card.repository.CardRepository;
import com.kungfu.wordquest.card.repository.UserCardRepository;
import com.kungfu.wordquest.common.exception.ConflictException;
import com.kungfu.wordquest.leaderboard.service.LeaderboardService;
import com.kungfu.wordquest.security.JwtTokenProvider;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock CardRepository cardRepository;
    @Mock UserCardRepository userCardRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider tokenProvider;
    @Mock AuthenticationManager authenticationManager;
    @Mock LeaderboardService leaderboardService;

    @InjectMocks AuthService authService;

    @BeforeEach
    void stubEncoder() {
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
    }

    @Test
    void register_success_hashesPasswordAndReturnsUser() {
        when(userRepository.existsByUsernameIgnoreCase("Rakhi")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("rakhi@example.com")).thenReturn(false);
        when(cardRepository.findById("po_common")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        RegisterRequest req = new RegisterRequest("Rakhi", "  Rakhi@Example.com ", "StrongPass1");
        RegisterResponse res = authService.register(req);

        assertThat(res.getMessage()).isEqualTo("Registration successful");
        assertThat(res.getUser().getUserName()).isEqualTo("Rakhi");
        assertThat(res.getUser().getUserEmail()).isEqualTo("rakhi@example.com");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hashed");
        assertThat(captor.getValue().getRole()).isEqualTo(UserRole.ROLE_USER);
        verify(passwordEncoder).encode("StrongPass1");
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByUsernameIgnoreCase("Rakhi")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("rakhi@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                authService.register(new RegisterRequest("Rakhi", "rakhi@example.com", "StrongPass1")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.existsByUsernameIgnoreCase("Rakhi")).thenReturn(true);

        assertThatThrownBy(() ->
                authService.register(new RegisterRequest("Rakhi", "rakhi@example.com", "StrongPass1")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Username");
    }

    @Test
    void login_unknownEmail_throwsBadCredentials() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.login(new LoginRequest("missing@example.com", "StrongPass1")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void login_wrongPassword_throwsGenericMessage() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("Rakhi")
                .email("rakhi@example.com")
                .passwordHash("hashed")
                .role(UserRole.ROLE_USER)
                .build();
        when(userRepository.findByEmailIgnoreCase("rakhi@example.com")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() ->
                authService.login(new LoginRequest("rakhi@example.com", "WrongPass1")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void login_success_returnsTokensAndUser() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("Rakhi")
                .email("rakhi@example.com")
                .passwordHash("hashed")
                .role(UserRole.ROLE_USER)
                .belt("White")
                .build();
        when(userRepository.findByEmailIgnoreCase("rakhi@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        com.kungfu.wordquest.security.CustomUserDetails details =
                new com.kungfu.wordquest.security.CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                details, null, details.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(tokenProvider.generateAccessToken(auth)).thenReturn("access");
        when(tokenProvider.generateRefreshToken(auth)).thenReturn("refresh");

        var res = authService.login(new LoginRequest("rakhi@example.com", "StrongPass1"));

        assertThat(res.getAccessToken()).isEqualTo("access");
        assertThat(res.getRefreshToken()).isEqualTo("refresh");
        assertThat(res.getUser().getUserEmail()).isEqualTo("rakhi@example.com");
        verify(leaderboardService, never()).updateScore(anyString(), anyInt());
    }
}
