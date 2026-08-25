package com.kungfu.wordquest.config;

import com.kungfu.wordquest.economy.GameEconomy;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Promotes or creates an admin from {@code ADMIN_EMAIL} / {@code ADMIN_PASSWORD}.
 * Runs before {@link DatabaseSeeder} local fallback.
 */
@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${admin.username:}")
    private String adminUsername;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.debug("ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping env admin bootstrap");
            return;
        }

        String email = adminEmail.trim().toLowerCase();
        String username = StringUtils.hasText(adminUsername)
                ? adminUsername.trim()
                : email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        if (username.length() > 30) {
            username = username.substring(0, 30);
        }

        var existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            User user = existing.get();
            boolean changed = false;
            if (user.getRole() != UserRole.ROLE_ADMIN) {
                user.setRole(UserRole.ROLE_ADMIN);
                user.setTokenVersion(user.getTokenVersion() + 1);
                changed = true;
            }
            if (!user.isEnabled()) {
                user.setEnabled(true);
                changed = true;
            }
            if (user.isLocked()) {
                user.setLocked(false);
                user.setTokenVersion(user.getTokenVersion() + 1);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
                log.info("Promoted existing user {} to ROLE_ADMIN", email);
            } else {
                log.info("Admin account already present for {}", email);
            }
            return;
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            username = ("admin-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        }

        String encoded = passwordEncoder.encode(adminPassword);
        User admin = User.builder()
                .username(username)
                .email(email)
                .passwordHash(encoded)
                .legacyPassword(encoded)
                .role(UserRole.ROLE_ADMIN)
                .coins(GameEconomy.STARTING_COINS)
                .enabled(true)
                .locked(false)
                .build();
        UserStats stats = UserStats.builder().user(admin).build();
        admin.setStats(stats);
        userRepository.save(admin);
        log.info("Created ROLE_ADMIN user {} ({})", username, email);
    }
}
