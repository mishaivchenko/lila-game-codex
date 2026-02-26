ALTER TABLE room_game_states
  ADD COLUMN IF NOT EXISTS active_card_json JSONB,
  ADD COLUMN IF NOT EXISTS notes_json JSONB,
  ADD COLUMN IF NOT EXISTS settings_json JSONB;

CREATE TABLE IF NOT EXISTS admin_chat_bindings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_instance TEXT NOT NULL,
  chat_type TEXT,
  granted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chat_instance)
);

CREATE INDEX IF NOT EXISTS admin_chat_bindings_user_idx
  ON admin_chat_bindings(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS admin_chat_bindings_chat_idx
  ON admin_chat_bindings(chat_instance, updated_at DESC);
