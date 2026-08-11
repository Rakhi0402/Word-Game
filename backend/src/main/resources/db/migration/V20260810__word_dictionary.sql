-- Reference schema for offline Word Quest dictionary (applied via JPA ddl-auto:update).
-- Documented for ops; project does not run Flyway by default.

CREATE TABLE IF NOT EXISTS word_dictionary (
    id UUID PRIMARY KEY,
    word VARCHAR(64) NOT NULL,
    normalized_word VARCHAR(64) NOT NULL UNIQUE,
    word_length INT NOT NULL,
    frequency_score DOUBLE PRECISION,
    frequency_rank INT,
    difficulty VARCHAR(16) NOT NULL,
    source VARCHAR(32) NOT NULL,
    source_version VARCHAR(64) NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_word_dict_allowed_len ON word_dictionary (allowed, word_length);
CREATE INDEX IF NOT EXISTS idx_word_dict_difficulty ON word_dictionary (difficulty);
CREATE INDEX IF NOT EXISTS idx_word_dict_source_ver ON word_dictionary (source, source_version);

CREATE TABLE IF NOT EXISTS puzzle_words (
    id UUID PRIMARY KEY,
    puzzle_id UUID NOT NULL REFERENCES puzzles(id),
    normalized_word VARCHAR(64) NOT NULL,
    display_word VARCHAR(64) NOT NULL,
    is_pangram BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_puzzle_word UNIQUE (puzzle_id, normalized_word)
);

CREATE INDEX IF NOT EXISTS idx_puzzle_words_puzzle ON puzzle_words (puzzle_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_words_lookup ON puzzle_words (puzzle_id, normalized_word);
