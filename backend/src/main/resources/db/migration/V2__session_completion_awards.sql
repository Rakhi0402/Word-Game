-- Persist XP/coins granted at first puzzle completion (idempotent sync / completion UI).

ALTER TABLE user_puzzle_sessions
    ADD COLUMN IF NOT EXISTS xp_awarded INTEGER;

ALTER TABLE user_puzzle_sessions
    ADD COLUMN IF NOT EXISTS coins_awarded INTEGER;
