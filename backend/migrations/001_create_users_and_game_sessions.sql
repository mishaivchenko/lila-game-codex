-- MVP schema for Telegram-authenticated users and game history.
-- The current runtime backend still uses in-memory stores, but this migration
-- defines the production Postgres structure expected by the API contracts.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  telegram_user_id TEXT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_type TEXT NOT NULL CHECK (board_type IN ('short', 'full')),
  current_cell INTEGER NOT NULL CHECK (current_cell > 0),
  game_status TEXT NOT NULL CHECK (game_status IN ('in_progress', 'finished')),
  throws_count INTEGER NOT NULL DEFAULT 0,
  has_notes BOOLEAN NOT NULL DEFAULT FALSE,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS game_sessions_user_id_updated_at_idx
  ON game_sessions(user_id, updated_at DESC);
