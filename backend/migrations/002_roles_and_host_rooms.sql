ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_granted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS host_rooms (
  id UUID PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_type TEXT NOT NULL CHECK (board_type IN ('short', 'full')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'paused', 'finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS host_rooms_host_user_updated_idx
  ON host_rooms(host_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES host_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('host', 'player')),
  token_color TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connection_status TEXT NOT NULL DEFAULT 'online' CHECK (connection_status IN ('online', 'offline')),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS room_players_room_joined_idx
  ON room_players(room_id, joined_at ASC);

CREATE TABLE IF NOT EXISTS room_game_states (
  room_id UUID PRIMARY KEY REFERENCES host_rooms(id) ON DELETE CASCADE,
  current_turn_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  per_player_state_json JSONB NOT NULL,
  move_history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS room_game_states_updated_idx
  ON room_game_states(updated_at DESC);
