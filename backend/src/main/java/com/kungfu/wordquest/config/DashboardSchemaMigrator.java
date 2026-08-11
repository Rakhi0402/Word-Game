package com.kungfu.wordquest.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * Backfills NOT NULL columns that Hibernate ddl-auto cannot add to non-empty tables
 * without a SQL DEFAULT. Safe to run repeatedly (IF NOT EXISTS + null backfill).
 */
@Component("dashboardSchemaMigrator")
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DashboardSchemaMigrator {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        ensureIntColumn("user_cards", "charges_remaining", "5");
        ensureVarcharColumn("user_cards", "status", 20, "'available'");
        ensureIntColumn("user_stats", "hints_bought", "0");
        ensureIntColumn("users", "streak_shields", "0");
        ensureIntColumn("users", "free_chest_tokens", "0");
        ensureBooleanColumn("users", "permanent_extra_daily_hint", "false");
        ensureIntColumn("users", "bonus_free_hints_next_day", "0");
        ensureIntColumn("users", "choice_puzzles_completed_today", "0");
        ensureNullableVarchar("users", "last_puzzle_date", 16);
        ensureNullableVarchar("users", "choice_puzzles_date", 16);

        // Puzzle columns — Hibernate cannot ADD NOT NULL without DEFAULT on populated tables
        ensureIntColumn("puzzles", "minimum_word_length", "4");
        ensureNullableVarchar("puzzles", "fingerprint", 64);
        ensureNullableVarchar("puzzles", "generation_batch_id", 64);
        ensureNullableVarchar("puzzles", "dictionary_source_version", 64);
        ensurePuzzleWordsTable();

        // #region agent log
        try {
            boolean hasMinLen = Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='puzzles' AND column_name='minimum_word_length')",
                    Boolean.class));
            Files.writeString(
                    Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                    "{\"sessionId\":\"156feb\",\"runId\":\"post-fix\",\"hypothesisId\":\"A\",\"location\":\"DashboardSchemaMigrator.migrate\",\"message\":\"Puzzle schema migrate complete\",\"data\":{\"minimum_word_length_exists\":"
                            + hasMinLen + "},\"timestamp\":" + System.currentTimeMillis() + "}\n",
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {
            // debug log best-effort
        }
        // #endregion

        log.info("Schema migrator finished (users/cards/puzzles columns ensured)");
    }

    private void ensurePuzzleWordsTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS puzzle_words (
                    id UUID PRIMARY KEY,
                    puzzle_id UUID NOT NULL REFERENCES puzzles(id),
                    normalized_word VARCHAR(64) NOT NULL,
                    display_word VARCHAR(64) NOT NULL,
                    is_pangram BOOLEAN NOT NULL DEFAULT FALSE,
                    CONSTRAINT uk_puzzle_word UNIQUE (puzzle_id, normalized_word)
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_puzzle_words_puzzle ON puzzle_words (puzzle_id)");
        jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS idx_puzzle_words_lookup ON puzzle_words (puzzle_id, normalized_word)");
    }

    private void ensureIntColumn(String table, String column, String defaultSql) {
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " integer");
        jdbcTemplate.execute("UPDATE " + table + " SET " + column + " = " + defaultSql + " WHERE " + column + " IS NULL");
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET DEFAULT " + defaultSql);
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET NOT NULL");
    }

    private void ensureBooleanColumn(String table, String column, String defaultSql) {
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " boolean");
        jdbcTemplate.execute("UPDATE " + table + " SET " + column + " = " + defaultSql + " WHERE " + column + " IS NULL");
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET DEFAULT " + defaultSql);
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET NOT NULL");
    }

    private void ensureVarcharColumn(String table, String column, int length, String defaultSqlLiteral) {
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column
                + " varchar(" + length + ")");
        jdbcTemplate.execute("UPDATE " + table + " SET " + column + " = " + defaultSqlLiteral
                + " WHERE " + column + " IS NULL");
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column
                + " SET DEFAULT " + defaultSqlLiteral);
        jdbcTemplate.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET NOT NULL");
    }

    private void ensureNullableVarchar(String table, String column, int length) {
        jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column
                + " varchar(" + length + ")");
    }
}
