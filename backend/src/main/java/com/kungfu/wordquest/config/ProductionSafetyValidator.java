package com.kungfu.wordquest.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * Fails fast in production when critical configuration is unsafe.
 */
@Component
@Order(0)
@Slf4j
public class ProductionSafetyValidator implements ApplicationRunner {

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${app.seed.local-admin:false}")
    private boolean localAdminSeed;

    @Value("${spring.jpa.hibernate.ddl-auto:validate}")
    private String ddlAuto;

    public ProductionSafetyValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isProd()) {
            return;
        }

        if (!StringUtils.hasText(jwtSecret)
                || jwtSecret.length() < 32
                || jwtSecret.contains("CHANGE_ME")) {
            throw new IllegalStateException(
                    "Production requires JWT_SECRET of at least 32 characters (not a placeholder).");
        }

        if (localAdminSeed) {
            throw new IllegalStateException(
                    "Production forbids app.seed.local-admin=true. Set APP_SEED_LOCAL_ADMIN=false.");
        }

        String normalized = ddlAuto == null ? "" : ddlAuto.trim().toLowerCase();
        if (!normalized.equals("validate") && !normalized.equals("none")) {
            throw new IllegalStateException(
                    "Production JPA ddl-auto must be validate or none (schema owned by Flyway). Got: "
                            + ddlAuto);
        }

        log.info("Production safety checks passed (profiles={})",
                Arrays.toString(environment.getActiveProfiles()));
    }

    private boolean isProd() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> "prod".equalsIgnoreCase(p));
    }
}
