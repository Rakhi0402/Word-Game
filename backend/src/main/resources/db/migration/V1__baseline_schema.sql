-- Kung Fu Word Quest — baseline schema (BIGINT puzzle ids).
-- Applied by Flyway. Do not edit after release; add V2+ for changes.
-- Existing databases: Flyway baselines at v1 (baseline-on-migrate) then applies V2+.

CREATE TABLE users (
    id                              UUID            NOT NULL,
    username                        VARCHAR(30)     NOT NULL,
    email                           VARCHAR(120)    NOT NULL,
    password_hash                   VARCHAR(255)    NOT NULL,
    password                        VARCHAR(255)    NOT NULL,
    role                            VARCHAR(20)     NOT NULL,
    belt                            VARCHAR(20)     NOT NULL,
    level                           INTEGER         NOT NULL,
    xp                              INTEGER         NOT NULL,
    coins                           INTEGER         NOT NULL,
    gems                            INTEGER         NOT NULL,
    current_streak                  INTEGER         NOT NULL,
    daily_streak                    INTEGER         NOT NULL,
    streak_shields                  INTEGER         NOT NULL DEFAULT 0,
    free_chest_tokens               INTEGER         NOT NULL DEFAULT 0,
    permanent_extra_daily_hint      BOOLEAN         NOT NULL DEFAULT FALSE,
    bonus_free_hints_next_day       INTEGER         NOT NULL DEFAULT 0,
    last_puzzle_date                VARCHAR(16),
    choice_puzzles_date             VARCHAR(16),
    choice_puzzles_completed_today  INTEGER         NOT NULL DEFAULT 0,
    equipped_card_id                VARCHAR(255)    NOT NULL,
    last_played                     TIMESTAMP,
    last_login                      TIMESTAMP,
    enabled                         BOOLEAN         NOT NULL,
    locked                          BOOLEAN         NOT NULL,
    token_version                   INTEGER         NOT NULL,
    version                         BIGINT,
    created_at                      TIMESTAMP       NOT NULL,
    updated_at                      TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('ROLE_USER', 'ROLE_ADMIN'))
);

CREATE INDEX idx_user_username ON users (username);
CREATE INDEX idx_user_email ON users (email);
CREATE INDEX idx_users_xp_id ON users (xp, id);

CREATE TABLE user_stats (
    user_id                     UUID            NOT NULL,
    words_found                 INTEGER         NOT NULL,
    cards_collected             INTEGER         NOT NULL,
    achievements_earned         INTEGER         NOT NULL,
    highest_score               INTEGER         NOT NULL,
    days_played                 INTEGER         NOT NULL,
    puzzles_completed           INTEGER         NOT NULL,
    pangrams_found              INTEGER         NOT NULL,
    perfect_puzzles             INTEGER         NOT NULL,
    hints_used                  INTEGER         NOT NULL,
    hints_bought                INTEGER         NOT NULL DEFAULT 0,
    games_played                INTEGER         NOT NULL,
    highest_streak              INTEGER         NOT NULL,
    total_play_time_minutes     BIGINT          NOT NULL,
    last_puzzle_completed       TIMESTAMP,
    last_updated                TIMESTAMP,
    CONSTRAINT user_stats_pkey PRIMARY KEY (user_id),
    CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE cards (
    id          VARCHAR(255)    NOT NULL,
    name        VARCHAR(255)    NOT NULL,
    rarity      VARCHAR(255)    NOT NULL,
    image       VARCHAR(255)    NOT NULL,
    stars       INTEGER         NOT NULL,
    description VARCHAR(255),
    bonuses     TEXT,
    CONSTRAINT cards_pkey PRIMARY KEY (id)
);

CREATE TABLE user_cards (
    id                  UUID            NOT NULL,
    user_id             UUID            NOT NULL,
    card_id             VARCHAR(255)    NOT NULL,
    count               INTEGER         NOT NULL,
    charges_remaining   INTEGER         NOT NULL DEFAULT 5,
    status              VARCHAR(20)     NOT NULL DEFAULT 'available',
    acquired_at         TIMESTAMP       NOT NULL,
    CONSTRAINT user_cards_pkey PRIMARY KEY (id),
    CONSTRAINT uk_user_cards_user_card UNIQUE (user_id, card_id),
    CONSTRAINT user_cards_nonneg_check CHECK (charges_remaining >= 0 AND count >= 0),
    CONSTRAINT fk_user_cards_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_cards_card FOREIGN KEY (card_id) REFERENCES cards (id)
);

CREATE TABLE achievements (
    id              VARCHAR(255)    NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(255),
    target          INTEGER         NOT NULL,
    reward_xp       INTEGER,
    reward_coins    INTEGER,
    icon_name       VARCHAR(255),
    CONSTRAINT achievements_pkey PRIMARY KEY (id)
);

CREATE TABLE user_achievements (
    id              UUID            NOT NULL,
    user_id         UUID            NOT NULL,
    achievement_id  VARCHAR(255)    NOT NULL,
    progress        INTEGER         NOT NULL,
    unlocked        BOOLEAN         NOT NULL,
    unlocked_at     TIMESTAMP,
    CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
    CONSTRAINT uk_user_achievements_user_ach UNIQUE (user_id, achievement_id),
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements (id)
);

CREATE TABLE puzzles (
    id                          BIGINT          GENERATED BY DEFAULT AS IDENTITY,
    puzzle_date                 DATE,
    letters                     VARCHAR(255)    NOT NULL,
    center_letter               VARCHAR(1)      NOT NULL,
    valid_words                 TEXT            NOT NULL,
    pangrams                    TEXT            NOT NULL,
    difficulty                  VARCHAR(255)    NOT NULL,
    minimum_word_length         INTEGER         NOT NULL DEFAULT 4,
    target_word_count           INTEGER         NOT NULL,
    pangram_count               INTEGER         NOT NULL,
    xp_reward                   INTEGER         NOT NULL,
    coin_reward                 INTEGER         NOT NULL,
    max_score                   INTEGER         NOT NULL,
    available_hints             INTEGER         NOT NULL,
    active                      BOOLEAN         NOT NULL,
    fingerprint                 VARCHAR(64),
    generation_batch_id         VARCHAR(64),
    dictionary_source_version   VARCHAR(64),
    version                     BIGINT,
    created_at                  TIMESTAMP       NOT NULL,
    updated_at                  TIMESTAMP       NOT NULL,
    CONSTRAINT puzzles_pkey PRIMARY KEY (id),
    CONSTRAINT uk_puzzles_fingerprint UNIQUE (fingerprint),
    CONSTRAINT puzzles_difficulty_check CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT'))
);

CREATE INDEX idx_puzzle_date ON puzzles (puzzle_date);
CREATE INDEX idx_puzzle_difficulty ON puzzles (difficulty);
CREATE INDEX idx_puzzle_fingerprint ON puzzles (fingerprint);

CREATE TABLE daily_puzzles (
    id              UUID        NOT NULL,
    puzzle_id       BIGINT      NOT NULL,
    scheduled_date  DATE        NOT NULL,
    created_at      TIMESTAMP   NOT NULL,
    CONSTRAINT daily_puzzles_pkey PRIMARY KEY (id),
    CONSTRAINT uk_daily_scheduled_date UNIQUE (scheduled_date),
    CONSTRAINT fk_daily_puzzles_puzzle FOREIGN KEY (puzzle_id) REFERENCES puzzles (id)
);

CREATE TABLE puzzle_words (
    id                  UUID            NOT NULL,
    puzzle_id           BIGINT          NOT NULL,
    normalized_word     VARCHAR(64)     NOT NULL,
    display_word        VARCHAR(64)     NOT NULL,
    is_pangram          BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT puzzle_words_pkey PRIMARY KEY (id),
    CONSTRAINT uk_puzzle_word UNIQUE (puzzle_id, normalized_word),
    CONSTRAINT fk_puzzle_words_puzzle FOREIGN KEY (puzzle_id) REFERENCES puzzles (id)
);

CREATE INDEX idx_puzzle_words_puzzle ON puzzle_words (puzzle_id);
CREATE INDEX idx_puzzle_words_lookup ON puzzle_words (puzzle_id, normalized_word);

CREATE TABLE user_puzzle_sessions (
    id              UUID        NOT NULL,
    user_id         UUID        NOT NULL,
    puzzle_id       BIGINT      NOT NULL,
    words_found     TEXT,
    hinted_words    TEXT,
    current_score   INTEGER,
    current_streak  INTEGER,
    completed       BOOLEAN     NOT NULL,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL,
    CONSTRAINT user_puzzle_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT uk_user_puzzle_sessions_user_puzzle UNIQUE (user_id, puzzle_id),
    CONSTRAINT fk_user_puzzle_sessions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_puzzle_sessions_puzzle FOREIGN KEY (puzzle_id) REFERENCES puzzles (id)
);

CREATE TABLE word_dictionary (
    id                  UUID            NOT NULL,
    word                VARCHAR(64)     NOT NULL,
    normalized_word     VARCHAR(64)     NOT NULL,
    word_length         INTEGER         NOT NULL,
    frequency_score     DOUBLE PRECISION,
    frequency_rank      INTEGER,
    difficulty          VARCHAR(16)     NOT NULL,
    source              VARCHAR(32)     NOT NULL,
    source_version      VARCHAR(64)     NOT NULL,
    allowed             BOOLEAN         NOT NULL,
    created_at          TIMESTAMP       NOT NULL,
    updated_at          TIMESTAMP       NOT NULL,
    CONSTRAINT word_dictionary_pkey PRIMARY KEY (id),
    CONSTRAINT uk_word_dict_normalized UNIQUE (normalized_word),
    CONSTRAINT word_dictionary_difficulty_check CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXPERT'))
);

CREATE INDEX idx_word_dict_allowed_len ON word_dictionary (allowed, word_length);
CREATE INDEX idx_word_dict_difficulty ON word_dictionary (difficulty);
CREATE INDEX idx_word_dict_source_ver ON word_dictionary (source, source_version);
